// {
//     "activationDate": "2024-05-28",
//     "recurrence": "daily",
//     "jobTemplateID": "6645834c66167e4286abad6e",
//     "jobTemplateCreateID": "18f7f88e15c-e357ef12d244b",
//     "ACTIVATER_ID": "6632fae0a67bf44b884f39be"
// }
// import mongoose from "mongoose";

// const JobTemplateActivateSchema = new mongoose.Schema({
//     JobTemplateID: { type: mongoose.Schema.Types.ObjectId, ref: "JobTemplate" },
//     JobTemplateCreateID: { type: String, required: true },
//     JOB_ID: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
//     RECURRING_TYPE: { type: String, default: null }
// }, { timestamps: true });

// export const JobTemplateActivate = mongoose.models?.JobTemplateActivate || mongoose.model("JobTemplateActivate", JobTemplateActivateSchema)
import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Approves } from "@/lib/models/Approves.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";

// import mongoose from 'mongoose';

// const scheduleSchema = new mongoose.Schema({
//     JOB_TEMPLATE_ID : { type: mongoose.Schema.Types.ObjectId, ref: 'JobTemplate', required: true },
//     ACTIVATE_DATE: { type: Date, required: true },
// }, { timestamps: true });

// export const Schedule = mongoose.models?.Schedule || mongoose.model('Schedule', scheduleSchema);

export const POST = async (req, res) => {


   // console.log("use job planning");

    await connectToDb();
    const body = await req.json();

    const {
        activationDate,
        recurrence,
        jobTemplateID,
        jobTemplateCreateID,
        ACTIVATER_ID,
        endDate,
    } = body;

    try {
        const jobTemplate = await JobTemplate.findOne({ _id: jobTemplateID });
        if (!jobTemplate) {
            return NextResponse.json({ status: 404, file: __filename, error: "Job template not found" });
        }

        // Calculate the end date based on the recurrence type
        let endDateObj;
        if (recurrence && endDate) {
            endDateObj = new Date(endDate); // Convert endDate to a Date object
        }

        // Activate jobs until the end date based on the recurrence type
        let currentDate = new Date(activationDate);
        console.log("currentDate", currentDate)
        while (!endDateObj || currentDate <= endDateObj) {
            // Create a new job
            const AdvanceActivationDate = new Date(currentDate);
            const schedule = new Schedule({
                JOB_TEMPLATE_ID: jobTemplateID,
                JOB_TEMPLATE_CREATE_ID: jobTemplateCreateID,
                JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
                ACTIVATE_DATE: AdvanceActivationDate,
                DOC_NUMBER: jobTemplate.DOC_NUMBER,
                WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
            });
            await schedule.save();
            // Increment currentDate based on the recurrence type
            if (recurrence === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1); // Add one day for daily recurrence
            } else if (recurrence === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7); // Add seven days for weekly recurrence
            } else if (recurrence === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1); // Add one month for monthly recurrence
            } else if (recurrence === 'yearly') {
                currentDate.setFullYear(currentDate.getFullYear() + 1); // Add one year for yearly recurrence
            } else {
                break; // If recurrence type is not specified or invalid, exit the loop
            }
        }


        return NextResponse.json({ status: 200, message: 'Jobs activated successfully' });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};
