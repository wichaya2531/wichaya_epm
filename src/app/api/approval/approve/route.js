import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";
import { NextResponse } from 'next/server';
import { JobApproves } from "@/lib/models/JobApprove";
import { User } from "@/lib/models/User.js";


//------------------สำหรับการ เชื่อมต่อ SSE ------->>
//import { eventsBus } from "@/lib/server/eventsBus";
import { addClient, removeClient, broadcast } from "@/lib/server/sseHub";
//--------------------------------------------->>
export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { job_id, user_id, isApproved, comment,disapprove_reason } = body;

    try {
        const renew = await Status.findOne({ status_name: 'renew' });
        const complete = await Status.findOne({ status_name: 'complete' });
        const job = await Job.findOne({ _id: job_id });
        if ( !isApproved ) {
            // กรณีที่ เป็นการ Disapprove
            job.JOB_STATUS_ID = renew._id;
            job.DISAPPROVE_REASON=disapprove_reason;
            await job.save();
        }
        else {
            // กรณีการ Approve
            job.JOB_STATUS_ID = complete._id;
            job.JOB_APPROVERS=[user_id];   // ระบุข้อมูล  user ที่ Approve งานนั้น
            await job.save(); 
        }

        const jobApprove = new JobApproves({
            JOB: job,
            USER_ID: user_id,
            IS_APPROVE: isApproved,
            COMMENT: comment,
        });

        await jobApprove.save();
        




      //----------------SSE------------------------------->>
            try {
              const payload = { JOB_ID: job_id};
              broadcast(job.WORKGROUP_ID, payload);
            } catch (err) {
              console.error("emit error:", err);
            }
      //--------------------------------------------------->>    



        return NextResponse.json({ status: 200,  message: isApproved ? "Job has been approved" : "Job has been rejected" });
    }
    catch (err) {
        if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 010");
        }
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}