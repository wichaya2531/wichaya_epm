import { NextResponse } from 'next/server';
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { JOB_ID } = body;
    try {
        const job = await Job.findOne({ _id: JOB_ID });
        const jobStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
        const jobStatusName = jobStatus.status_name;
        const ongoing_status = await Status.findOne({ status_name: 'ongoing' });

        // Update the job status to ongoing if the current status is new
        if (jobStatusName === 'new') {
            job.JOB_STATUS_ID = ongoing_status._id;
            await job.save();
        }

        return NextResponse.json({ status: 200 });
    } catch (err) {
        console.error("Error occurred:", err); // Log the error
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}