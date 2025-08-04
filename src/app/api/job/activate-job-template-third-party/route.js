import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Approves } from "@/lib/models/Approves.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { config } from "@/config/config.js";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Workgroup } from '@/lib/models/Workgroup';
import { User } from '@/lib/models/User';
import { sendEmails } from '@/lib/utils/utils';
import { Notified, Notifies } from "@/lib/models/Notifies.js";
import { ObjectId } from "mongodb";

async function getEmailfromUserID(userID) {
    try {
      const user = await User.findOne({ _id: new ObjectId(userID) });
      return user ? user.EMAIL : null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
  async function getApproversUserEmail(job) {
    const approvers = [];
  
    for (const element of job.JOB_APPROVERS) {
      try {
        const approver = await User.findOne({ _id: new ObjectId(element) });
        if (approver) {
          approvers.push(approver.EMAIL); // เก็บข้อมูลใน array
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  
    return approvers; // return ข้อมูลทั้งหมดหลังจากประมวลผลเสร็จ
  }

export const GET = async (req, res) => {
    //console.log("***activate-job-template-third-party ****");
    const searchParams = req.nextUrl.searchParams;
    const JobTemplateID = searchParams.get("job_key");
    const ACTIVE_LINE_NAME = searchParams.get("line");
    const ACTIVE_USER_ID = searchParams.get("user_id");
    //console.log("JobTemplateID",JobTemplateID);

    //const jobTemplate = await JobTemplate.findOne({ _id: JobTemplateID});
    //console.log("jobTemplate",jobTemplate);
    //return NextResponse.json({ status: 200,result: "OK" });

    await connectToDb();
    
    //const JobTemplateID = searchParams.get("jobTemID");
    //const JobTemplateCreateID = searchParams.get("jobTemCreateID");
    //const ACTIVATER_ID = searchParams.get("actID");
    //const ACTIVE_LINE_NAME = searchParams.get("LineName");
    
    

    try {
        //1 create job
        //1.1 find job template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
        const jobTemplate = await JobTemplate.findOne({ _id: JobTemplateID /*, JobTemplateCreateID: JobTemplateCreateID */});
        if (!jobTemplate) {
            return NextResponse.json({ status: 404, file: __filename, error: "Job template not found" });
        }

        //console.log("jobTemplate",jobTemplate);

        //1.2 find approvers where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid  1 job template can have multiple approvers
        const approvers = await Approves.find({ JOB_TEMPLATE_ID: JobTemplateID , JobTemplateCreateID: jobTemplate.JobTemplateCreateID });
        if (!approvers) {
            return NextResponse.json({ status: 404, file: __filename, error: "Approvers not found" });
        }

        // console.log("approvers",approvers);   
        

        const newID = await Status.findOne({ status_name: "new" });
        if (!newID) {
            return NextResponse.json({ status: 404, file: __filename, error: "Status not found" });
        }
        //1.3 create job
        //console.log("jobTemplate relmote Activate=>", jobTemplate)
        const job = new Job({
            JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
            JOB_STATUS_ID: newID._id,
            DOC_NUMBER: jobTemplate.DOC_NUMBER,
            LINE_NAME:ACTIVE_LINE_NAME,
            CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
            WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
            ACTIVATE_USER: ACTIVE_USER_ID,
            JOB_APPROVERS: approvers.map((approver) => approver.USER_ID),
            TIMEOUT: jobTemplate.TIMEOUT,
            PICTURE_EVEDENT_REQUIRE:jobTemplate.PICTURE_EVEDENT_REQUIRE||false,
            AGILE_SKIP_CHECK:jobTemplate.AGILE_SKIP_CHECK||false, 
        });
        await job.save();
        //console.log("current job Activate=>", jobTemplate);
        //2 update to jobtemplateactivate
        const jobTemplateActivate = new JobTemplateActivate({
            JobTemplateID: jobTemplate._id,
            JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
            JOB_ID: job._id,
        });
        await jobTemplateActivate.save();

        //3 create job item
        //3.1 find job item template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
        const jobItemTemplates = await JobItemTemplate.find({ JOB_TEMPLATE_ID: JobTemplateID });
        if (!jobItemTemplates) {
            return NextResponse.json({ status: 404, file: __filename, error: "Job item templates not found" });
        }


        //3.2 create job item

        var jobItemList=new Array();
        await Promise.all(jobItemTemplates.map(async (jobItemTemplate) => {
            const jobItem = new JobItem({
                JOB_ID: job._id,
                JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
                JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
                UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
                LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
                TEST_METHOD: jobItemTemplate.TEST_METHOD,
                TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
                JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
                FILE: jobItemTemplate.FILE,
                createdAt : jobItemTemplate.createdAt,
                INPUT_CONVERT:jobItemTemplate.INPUT_CONVERT||false
            });
            await jobItem.save();
            

            jobItemList.push({
                jobItem: jobItem._id,
                JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
                JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME
            });

            const currentJobItems = await JobItem.find({ JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id });

            // if there is no job item yet
            if (currentJobItems.length === 1) {
                jobItem.BEFORE_VALUE = "None";
            } else {

                // Initialize BEFORE_VALUE with a default value
                let BEFORE_VALUE = "None";

                // Iterate to find the last job item with an actual value
                for (let i = currentJobItems.length - 2; i >= 0; i--) {
                    if (currentJobItems[i].ACTUAL_VALUE) {
                        BEFORE_VALUE = currentJobItems[i].ACTUAL_VALUE;
                        break;
                    }
                }

                // Set BEFORE_VALUE based on the found actual value or default value
                jobItem.BEFORE_VALUE = BEFORE_VALUE;

            }

            await jobItem.save();

            //4 update approves jobitemtemplateactivate
            const jobItemTemplateActivate = new JobItemTemplateActivate({
                JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
                JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
                JOB_ITEM_ID: jobItem._id,
            });
            await jobItemTemplateActivate.save();
        }));

        const link = `api/job/get-job-value?job_id=${job._id}`;
        


       /* const workgroup = await Workgroup.findOne({ _id: jobTemplate.WORKGROUP_ID });
        const userlist = workgroup ? workgroup.USER_LIST : [];
    
        const userEmails = await Promise.all(userlist.map(async (user) => {
            const use = await User.findOne({ _id: user });
            return use.EMAIL;
        }));*/
        

        //------------------------->>
            var userEmailNotified = [];
                try {
                // ใช้ await เพื่อรอให้คำสั่ง find สำเร็จ
                const notified = await Notifies.find({ JOB_TEMPLATE_ID: JobTemplateID });
                // ใช้ for...of loop เพื่อรองรับการใช้ await ในลูป
                for (const element of notified) {
                    //console.log("element->USER_ID", element.USER_ID); // แสดง USER_ID ที่ได้รับ
                    const email = await getEmailfromUserID(element.USER_ID); // รอให้ getEmailfromUserID คืนค่า
                    //console.log("element->USER_ID->Email", email); // แสดง email ที่ได้รับ
                    userEmailNotified.push(email); // เก็บข้อมูลใน array
                }
                } catch (error) {
                     console.error("Error:", error);
                }

                const userEmailsApprover = await getApproversUserEmail(job);
                const allEmails = [...userEmailsApprover, ...userEmailNotified];
                const activator = await User.findOne({ _id: ACTIVE_USER_ID });

                if (activator && activator.EMAIL) {
                    allEmails.push(activator.EMAIL);
                }

                const uniqueEmails = [...new Set(allEmails)];

                 
                // const jobData = {
                //     name: job.JOB_NAME,
                //     activatedBy: activater ? activater.EMP_NAME : null,
                //     timeout: job.TIMEOUT,
                // };



        
        //console.log("activator",activator);                    
        //console.log("uniqueEmails",uniqueEmails);
        
        //return NextResponse.json({ status: 200, JobID: job._id /*, ToSeeData: link*/});

        const activater = "Third Party"
        const jobData = {
            name: job.JOB_NAME,
            activatedBy: activater,
            timeout: job.TIMEOUT,
            linename:job.LINE_NAME,
        };
        await sendEmails(uniqueEmails, jobData);  
        return NextResponse.json({ status: 200, JobID: job._id ,jobItemList : jobItemList /*, ToSeeData: link*/});
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};

