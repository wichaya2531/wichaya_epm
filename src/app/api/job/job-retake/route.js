//jobID
//actualValue :[
//{jobItemID: 1, actualValue: 1},
//{jobItemID: 2, actualValue: 2},
//]

//comment :[
//{jobItemID: 1, comment: 'comment 1'},
//{jobItemID: 2, comment: 'comment 2'},
//]

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
    const { jobID, submitUser, actualValue, comment } = body;
    
    try {
        const job = await Job.findOne({ _id: jobID });
        const submitteduser = await User.findById(submitUser);
        const latestDocNo = await getRevisionNo(job.DOC_NUMBER);
        if (latestDocNo.message){
            return NextResponse.json({ status: 455, message: latestDocNo.message });
        }
        else if (job.CHECKLIST_VERSION !== latestDocNo) {
            return NextResponse.json({ status: 455, message: "This job is not the latest revision" });
        }

        const status = await Status.findOne({ status_name: "waiting for approval" });
        job.JOB_STATUS_ID = status._id;
        job.SUBMITTED_BY = submitteduser;

        await job.save();
        await Promise.all(actualValue.map(async (item) => {
            const jobItem = await JobItem.findOne({ _id: item.jobItemID });
            jobItem.ACTUAL_VALUE = item.actualValue;
            await jobItem.save();
        }
        ));
        await Promise.all(comment.map(async (item) => {
            const jobItem = await JobItem.findOne({ _id: item.jobItemID });
            jobItem.COMMENT = item.comment;
            await jobItem.save();
        }
        ));

        await Promise.all(actualValue.map(async (item) => {
            const jobItem = await JobItem.findOne({ _id: item.jobItemID });
            const jobItemTemplateActivate = await JobItemTemplateActivate.findOne({ JOB_ITEM_ID: item.jobItemID });
            const jobItemTemplateId = jobItemTemplateActivate.JOB_ITEM_TEMPLATE_ID;
            const jobItemTemplatesAcivate = await JobItemTemplateActivate.find({ JOB_ITEM_TEMPLATE_ID: jobItemTemplateId });
            const jobItemTemplatesAcivateFiltered = jobItemTemplatesAcivate.filter((item) => !item.JOB_ITEM_ID.equals(item.jobItemID));
            for (const item of jobItemTemplatesAcivateFiltered) {
                const jobItemUpdate = await JobItem.findOne({ _id: item.JOB_ITEM_ID });
                if (!jobItemUpdate.ACTUAL_VALUE && !jobItemUpdate.BEFORE_VALUE) {
                    jobItemUpdate.BEFORE_VALUE = jobItem.ACTUAL_VALUE;
                }

                if (jobItemUpdate.BEFORE_VALUE && jobItemUpdate.BEFORE_VALUE !== jobItem.ACTUAL_VALUE && !jobItemUpdate.ACTUAL_VALUE) {
                    jobItemUpdate.BEFORE_VALUE = jobItem.ACTUAL_VALUE;
                }

                await jobItemUpdate.save();
            }
        }
        ));

        return NextResponse.json({ status: 200 });
    } catch (err) {
        console.error("Error occurred:", err); // Log the error
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};

