import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";
import { NextResponse } from 'next/server';
import { JobApproves } from "@/lib/models/JobApprove";


export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { job_id, user_id, isApproved, comment } = body;

    try {
        const renew = await Status.findOne({ status_name: 'renew' });
        const complete = await Status.findOne({ status_name: 'complete' });
        const job = await Job.findOne({ _id: job_id });
        if ( !isApproved ) {
            job.JOB_STATUS_ID = renew._id;
            await job.save();
        }
        else {
            job.JOB_STATUS_ID = complete._id;
            await job.save();
        }

        const jobApprove = new JobApproves({
            JOB: job,
            USER_ID: user_id,
            IS_APPROVE: isApproved,
            COMMENT: comment
        });

        await jobApprove.save();
        return NextResponse.json({ status: 200,  message: isApproved ? "Job has been approved" : "Job has been rejected" });
    }
    catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}