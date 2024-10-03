import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const workgroup_id = searchParams.get("workgroup_id");

    try {
        // Fetch job templates based on workgroup_id
        let jobTemplates;
        if (workgroup_id === "all") {
            jobTemplates = await JobTemplate.find();
        } else {
            jobTemplates = await JobTemplate.find({ WORKGROUP_ID: workgroup_id });
        }

        // Check if there are no job templates
        if (jobTemplates.length === 0) {
            return NextResponse.json({ status: 200, events: [] });
        }

        // Fetch job template activations
        const jobTemplatesActivates = await Promise.all(jobTemplates.map(async (jobTemplate) => {
            return await JobTemplateActivate.find({ JobTemplateID: jobTemplate._id }).sort({ createdAt: -1 });
        }));

        // Flatten the activations array
        const flattenedActivates = jobTemplatesActivates.flat();

        // Fetch schedules
        const schedules = await Promise.all(jobTemplates.map(async (jobTemplate) => {
            return await Schedule.find({ JOB_TEMPLATE_ID: jobTemplate._id }).sort({ createdAt: -1 });
        }));

        // Flatten the schedules array
        const flattenedSchedules = schedules.flat();

        // Create events from job template activations
        const activationEvents = await Promise.all(flattenedActivates.map(async (jobTemplateActivate) => {
            const createdAtDate = new Date(jobTemplateActivate.createdAt);
            const job = await Job.findOne({ _id: jobTemplateActivate.JOB_ID });
            if (!job) {
                return null; // Skip if the job does not exist
            }
            const jobName = job.JOB_NAME;
            const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
            const statusColor = status ? status.color : null;
            const statusName = status ? status.status_name : null;
            //console.log("test->",job.LINE_NAME+" : "+jobName);
            return {
                title: job.LINE_NAME+" : "+jobName,
                job_id: job._id,
                status_name: statusName,
//                line_name: job.LINE_NAME,
                start: new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate()),
                end: new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate()),
                color: statusColor,
            };
        }));

        // Filter out null values from activationEvents
        const validActivationEvents = activationEvents.filter(event => event !== null);

        // Create events from schedules
        const scheduleEvents = await Promise.all(flattenedSchedules.map(async (schedule) => {
            const activateDate = new Date(schedule.ACTIVATE_DATE);
            const status = await Status.findOne({ status_name: schedule.STATUS });
            const statusColor = status ? status.color : null;
            //console.log('schedule',schedule);
            const LineName=await JobTemplate.findOne({JobTemplateCreateID:schedule.JOB_TEMPLATE_CREATE_ID});
            const Line_Name=LineName?.LINE_NAME || 'Unknown';

            //console.log("test->",schedule.LINE_NAME+" : "+schedule.JOB_TEMPLATE_NAME);    
            return {
                title: Line_Name+" : "+schedule.JOB_TEMPLATE_NAME,
                job_id: schedule.JOB_TEMPLATE_ID,
                status_name: schedule.STATUS,
                //line_name: schedule.LINE_NAME,
                start: new Date(activateDate.getFullYear(), activateDate.getMonth(), activateDate.getDate()),
                end: new Date(activateDate.getFullYear(), activateDate.getMonth(), activateDate.getDate()),
                color: statusColor,
            };
        }));

        // Combine valid activation events and schedule events
        const resolvedEvents = [...validActivationEvents, ...await Promise.all(scheduleEvents)];

        //console.log("Resolved events:", resolvedEvents);

        return NextResponse.json({ status: 200, events: resolvedEvents });
    } catch (error) {
        console.error("Error fetching job events:", error);
        return NextResponse.json({ status: 404, file: __filename, error: error.message || error });
    }
};
