import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";
import { NextResponse } from 'next/server';
import { User } from "@/lib/models/User.js";

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");
    try {
        const waitForApproveStatus = await Status.findOne({ status_name: 'waiting for approval' });
        const jobs = await Job.find({
            JOB_STATUS_ID: waitForApproveStatus._id,
            JOB_APPROVERS: { $in: [user_id] }
        }).sort({ updatedAt: -1 })
        //console.log("Job", jobs);
        const promiseData = jobs.map(async (job) => {
            const activator = await User.findOne({ _id: job.ACTIVATE_USER });
            return {
                job_id: job._id,
                job_name: job.JOB_NAME,
                job_line_name: job.LINE_NAME,
                job_status: waitForApproveStatus.status_name,
                job_status_color: waitForApproveStatus.color,
                job_doc_number: job.DOC_NUMBER,
                job_activator: activator.EMP_NAME,
                job_submittedAt: job.updatedAt
            };
        });

        const data = await Promise.all(promiseData);


        return NextResponse.json({ status: 200, data: data });
    }
    catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}
