import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";
import { NextResponse } from 'next/server';
import { User } from "@/lib/models/User.js";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");
    //console.log("user_id => ", user_id);
    try {
        const waitForApproveStatus = await Status.findOne({ status_name: 'waiting for approval' });
       // console.log("waitForApproveStatus => ", waitForApproveStatus);
        const jobs = await Job.find({
            JOB_STATUS_ID: waitForApproveStatus._id,
            JOB_APPROVERS: new ObjectId(user_id)
        }).sort({ updatedAt: -1 })
        //console.log("Job=>", jobs);
        const promiseData = jobs.map(async (job) => {
            //console.log("Job.ACTIVATE_USER => ", job.ACTIVATE_USER);            
            // ตรวจสอบว่า ACTIVATE_USER เป็น array หรือไม่
            const activators = Array.isArray(job.ACTIVATE_USER) 
                ? await Promise.all(job.ACTIVATE_USER.map(async userId => await User.findOne({ _id: userId })))
                : [await User.findOne({ _id: job.ACTIVATE_USER })];
            
            // ดึงชื่อของทุก activator (EMP_NAME) มาใส่ใน array
            const activatorNames = activators.map(activator => activator?.EMP_NAME || "Unknown");
        
            return {
                job_id: job._id,
                job_name: job.JOB_NAME,
                job_line_name: job.LINE_NAME,
                job_status: waitForApproveStatus.status_name,
                job_status_color: waitForApproveStatus.color,
                job_doc_number: job.DOC_NUMBER,
                // ถ้า ACTIVATE_USER เป็น array ให้เก็บชื่อ activator หลายคน
                job_activator: activatorNames.join(", "),  // รวมชื่อ activators เป็น string แยกด้วย comma
                job_submittedAt: job.updatedAt
            };
        });
        //--------------------------Code เก่า ไม่ Work--------------------------------    
        // const promiseData = jobs.map(async (job) => {
        //     console.log("Job.ACTIVATE_USER => ", job.ACTIVATE_USER);    
        //     const activator = await User.findOne({ _id: job.ACTIVATE_USER });
        //     console.log("Activator => ", activator);
        //     return {
        //         job_id: job._id,
        //         job_name: job.JOB_NAME,
        //         job_line_name: job.LINE_NAME,
        //         job_status: waitForApproveStatus.status_name,
        //         job_status_color: waitForApproveStatus.color,
        //         job_doc_number: job.DOC_NUMBER,
        //         job_activator: activator.EMP_NAME,
        //         job_submittedAt: job.updatedAt
        //     };
        // });




        

        const data = await Promise.all(promiseData);


        return NextResponse.json({ status: 200, data: data });
    }
    catch (err) {
        console.log("Error => ", err.message);
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}
