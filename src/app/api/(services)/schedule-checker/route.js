
import { Job } from "@/lib/models/Job";
import { NextResponse } from 'next/server';
import { Status } from "@/lib/models/Status";
import { addHours, addDays, addMonths } from 'date-fns';
import { connectToDb } from "@/app/api/mongo/index.js";
import { ActivateJobTemplate, getRevisionNo, sendEmails } from "@/lib/utils/utils";
import { Schedule } from "@/lib/models/Schedule";
import { User } from "@/lib/models/User";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Approves } from "@/lib/models/Approves";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItem } from "@/lib/models/JobItem";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { Workgroup } from "@/lib/models/Workgroup";


const convertTimeout = async (timeout, createdAt) => {
    const startDate = new Date(createdAt);
    switch (timeout) {
        case "12 hrs":
            return addHours(startDate, 12);
        case "1 days":
            return addDays(startDate, 1);
        case "7 days":
            return addDays(startDate, 7);
        case "15 days":
            return addDays(startDate, 15);
        case "30 days":
            return addDays(startDate, 30);
        case "3 months":
            return addMonths(startDate, 3);
        case "6 months":
            return addMonths(startDate, 6);
        case "12 months":
            return addMonths(startDate, 12);
        default:
            return addHours(startDate, 12);
    }
}

const logText = async () => {
    const currentTime = new Date();
    const totalJobs = await Job.countDocuments();
    console.log("-----------------------------------------------------------")
    console.log("Checking for overdue jobs: ", currentTime.toLocaleString());
    console.log("Total Jobs Today: ", totalJobs);
    console.log("-----------------------------------------------------------")
}

export const POST = async (req, res) => {
    await connectToDb();

    try {
        const jobs = await Job.find();
        const now = new Date();
        const JobTemplatesSchedule = await Schedule.find();
        const overdueStatus = await Status.findOne({ status_name: 'overdue' });

        const checkOverdue = jobs.map(async (job) => {
            const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
            const statusName = status?.status_name || 'Unknown';

            const jobCreationTime = new Date(job.createdAt);
            const jobExpiryTime = await convertTimeout(job.TIMEOUT, job.createdAt);

            //check if job is overdue
            if (now > jobExpiryTime && statusName !== 'overdue' && statusName !== 'complete') {
                job.JOB_STATUS_ID = overdueStatus._id;
                await job.save();
            }

            const finalStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
            const finalStatusName = finalStatus?.status_name || 'Unknown';

            return {
                jobID: job._id,
                jobName: job.JOB_NAME,
                STATUS_NAME: finalStatusName
            };
        });

        await Promise.all(checkOverdue);

        const scheduler = await User.findOne({ EMP_NAME: 'scheduler' });
        const activateJobTemplatesSchedule = JobTemplatesSchedule.map(async (jobTemplateSchedule) => {
            if (jobTemplateSchedule.ACTIVATE_DATE.toDateString() === now.toDateString() || jobTemplateSchedule.ACTIVATE_DATE < now) {

                const JobTemplateID = jobTemplateSchedule.JOB_TEMPLATE_ID
                const ACTIVATER_ID =  scheduler._id
                const JobTemplateCreateID = jobTemplateSchedule.JOB_TEMPLATE_CREATE_ID

                //1 create job
                //1.1 find job template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
                const jobTemplate = await JobTemplate.findOne({ _id: JobTemplateID, JobTemplateCreateID: JobTemplateCreateID });
                if (!jobTemplate) {
                    return NextResponse.json({ status: 404, file: __filename, error: "Job template not found" });
                }
                //1.2 find approvers where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid  1 job template can have multiple approvers
                const approvers = await Approves.find({ JOB_TEMPLATE_ID: JobTemplateID, JobTemplateCreateID: JobTemplateCreateID });
                if (!approvers) {
                    return NextResponse.json({ status: 404, file: __filename, error: "Approvers not found" });
                }

                const newID = await Status.findOne({ status_name: "new" });
                if (!newID) {
                    return NextResponse.json({ status: 404, file: __filename, error: "Status not found" });
                }
                //1.3 create job
                const job = new Job({
                    JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
                    JOB_STATUS_ID: newID._id,
                    DOC_NUMBER: jobTemplate.DOC_NUMBER,
                    CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
                    WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
                    ACTIVATE_USER: ACTIVATER_ID,
                    JOB_APPROVERS: approvers.map((approver) => approver.USER_ID),
                    TIMEOUT: jobTemplate.TIMEOUT,
                });
                await job.save();

                //2 update to jobtemplateactivate
                const jobTemplateActivate = new JobTemplateActivate({
                    JobTemplateID: jobTemplate._id,
                    JobTemplateCreateID: JobTemplateCreateID,
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
                    });
                    await jobItem.save();


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

                const workgroup = await Workgroup.findOne({ _id: jobTemplate.WORKGROUP_ID });
                const userlist = workgroup ? workgroup.USER_LIST : [];
            
                const userEmails = await Promise.all(userlist.map(async (user) => {
                    const use = await User.findOne({ _id: user });
                    return use.EMAIL;
                }));
                
                const activater = "Scheduler"
                const jobData = {
                    name: job.JOB_NAME,
                    activatedBy: activater,
                    timeout: job.TIMEOUT,
                };
                
                await sendEmails(userEmails, jobData);  

                await Schedule.deleteOne({ _id: jobTemplateSchedule._id });
            }
        })

        await Promise.all(activateJobTemplatesSchedule);

        return NextResponse.json({ status: 200 });
    } catch (err) {
        return NextResponse.json({ status: 500, error: err.message });
    } finally {
        await logText();
    }
}
