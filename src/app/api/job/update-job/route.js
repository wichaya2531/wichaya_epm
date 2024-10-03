// jobData: {
//     JobID: jobData.JobID,
//     wd_tag: wdTag,

import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { getRevisionNo } from "@/lib/utils/utils";
import { User } from "@/lib/models/User";



export const PUT = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { jobData, jobItemsData } = body;

   // console.log("try to update job to database", jobData) 

    try {
        const job = await Job.findOne({ _id: jobData.JobID });
        const submitteduser = await User.findById(jobData.submittedBy);
        const latestDocNo = await getRevisionNo(job.DOC_NUMBER);
        if (latestDocNo.message){
            console.log("Doc number error")
            return NextResponse.json({ status: 455, message: latestDocNo.message });
        }
        else if (job.CHECKLIST_VERSION !== latestDocNo) {
            return NextResponse.json({ status: 455, message: "This Checklist does not has the latest revision" });
        }

       // console.log("jobtitle->", job.JOB_NAME);
       // console.log("Line Name->", job.LINE_NAME);
        var tmp_job={
            jobtitle: job.JOB_NAME,
            lineName: job.LINE_NAME,
            docNumber: job.DOC_NUMBER,
            wd_tag: "",
            submitteduser_en: submitteduser.EMP_NUMBER,
            submitteduser_name: submitteduser.EMP_NAME,
            datetime: new Date(),
            jobItem: []
        }
        //var tmp_job_item = [];
        
        await Promise.all(jobItemsData.map(async (jobItemData) => {
            const jobItem = await JobItem.findOne({ _id: jobItemData.jobItemID });
            jobItem.ACTUAL_VALUE = jobItemData.value || jobItem.ACTUAL_VALUE;
            jobItem.COMMENT = jobItemData.Comment || jobItem.COMMENT;
            jobItem.BEFORE_VALUE = jobItem.BEFORE_VALUE || jobItemData.BeforeValue;
            await jobItem.save();

        }));
        
        

        await Promise.all(jobItemsData.map(async (jobItemData) => {
            const jobItemTemplateActivate = await JobItemTemplateActivate.findOne({ JOB_ITEM_ID: jobItemData.jobItemID });
           // console.log("jobItemTemplateActivate->",jobItemTemplateActivate);
            
            const job_item_buffer=await JobItem.findOne({ _id: jobItemTemplateActivate.JOB_ITEM_ID });
             // console.log("job_item_title->",job_item_buffer);        

            tmp_job.jobItem.push({
                jobItemID: job_item_buffer._id,
                value: job_item_buffer.ACTUAL_VALUE,
                comment: job_item_buffer.COMMENT,
                jobItemTitle: job_item_buffer.JOB_ITEM_TITLE,
                datetime: new Date()    
            });

            const jobItemTemplateId = jobItemTemplateActivate.JOB_ITEM_TEMPLATE_ID;
            const jobItemTemplatesAcivate = await JobItemTemplateActivate.find({ JOB_ITEM_TEMPLATE_ID: jobItemTemplateId });
            const jobItemTemplatesAcivateFiltered = jobItemTemplatesAcivate.filter((item) => !item.JOB_ITEM_ID.equals(jobItemData.jobItemID));
            //console.log("jobItemTemplatesAcivateFiltered->",jobItemTemplatesAcivateFiltered);

            for (const item of jobItemTemplatesAcivateFiltered) {
                const jobItemUpdate = await JobItem.findOne({ _id: item.JOB_ITEM_ID });
                //console.log("jobItemUpdate->",jobItemUpdate);

                if (!jobItemUpdate.ACTUAL_VALUE && !jobItemUpdate.BEFORE_VALUE) {
                    jobItemUpdate.BEFORE_VALUE = jobItemData.value;
                }

                if (jobItemUpdate.BEFORE_VALUE && jobItemUpdate.BEFORE_VALUE !== jobItemData.value && !jobItemUpdate.ACTUAL_VALUE) {
                    jobItemUpdate.BEFORE_VALUE = jobItemData.value;
                }

               
               // console.log("jobItemUpdate->",jobItemUpdate._id);
                await jobItemUpdate.save();
            }
        }))

        job.WD_TAG = jobData.wd_tag;
        const waiting_status = await Status.findOne({ status_name: 'waiting for approval' });
        job.JOB_STATUS_ID = waiting_status._id
        job.SUBMITTED_BY = submitteduser;
        job.SUBMITTED_DATE = new Date();

        await job.save();
        //console.log("job->",job);            
        // ==============Send data to elasticsearch================
            // try{
            //      const response = await fetch('http://127.0.0.1:3000/api/elasticsearch/push/', {
            //         method: 'POST',
            //         headers: {
            //           'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify(tmp_job),
            //       });
            //       console.log("push data to elasticsearch  Done")
            // }catch(err){
            //     console.log("Error push data to elasticsearch", err)
            // }  
         // ==============Send data to SQL Server================
            //  try{
            //      console.log("push data to SQL Server")
            //       const response = await fetch('http://172.17.70.173/receiver/epm_receiver.php?doc=1234&line=9305A');
            //       console.log("push data to elasticsearch  Done" ,response )
            // }catch(err){
            //     console.log("Error push data to SQL Server", err)
            // }    

            //console.log("WD_TAG->", tmp_job.wd_tag);    
            tmp_job.wd_tag = job.WD_TAG;
            let wd_tag = job.WD_TAG;
            tmp_job.jobItem.forEach(element => {
                            const response =  fetch('http://172.17.70.173/receiver/epm_receiver.php?doc='+tmp_job.docNumber
                                +'&line='+tmp_job.lineName+'&jobItemID='+element.jobItemID+'&value='+
                                element.value+'&comment='+element.comment+'&jobItemTitle='+
                                element.jobItemTitle+'&datetime='+element.datetime+'&submitteduser_en='+
                                tmp_job.submitteduser_en+'&submitteduser_name='+tmp_job.submitteduser_name+
                                '&wd_tag='+wd_tag);
            });    


        return NextResponse.json({ status: 200 });
    } catch (err) {
        console.error("Error occurred:", err); // Log the error
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};
