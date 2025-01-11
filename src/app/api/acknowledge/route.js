import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job";

export const POST = async (req, res) => {
    try {
        const body = await req.json(); // อ่าน body ของ request
        const jobID = body.taskID; // ดึง jobID จาก body
        
        //console.log("JobID: ", jobID);
        
        await connectToDb();
        const jobs = await Job.findOne({_id:jobID});  
        //console.log("jobs=>",jobs);
        jobs.OVERDUE_ACK="OK";
        await jobs.save();
        // ส่ง response กลับ
        return NextResponse.json({ status: 200, jobID: jobID });
    } catch (error) {
        console.error("Error reading request body:", error);
        return NextResponse.json({ status: 500, error: "Failed to process request" });
    }




}


// export default async function handler(req, res) {
  
//   console.log('HHHH');  
//   const { jobID } = req.query; // ดึง jobID จาก URL
//   if (req.method === "POST") {
//     try {
//       const { taskID } = req.body; // รับข้อมูลจาก request body
//       console.log(`Task ID received: ${taskID}`);

//       // ตรวจสอบว่า jobID กับ taskID ตรงกันหรือไม่
//       if (taskID !== jobID) {
//         return res.status(400).json({
//           message: "Task ID mismatch.",
//         });
//       }

//       // ตัวอย่าง: จำลองการบันทึกลงฐานข้อมูล
//       console.log(`Acknowledging Task ID: ${taskID}`);
//       // e.g., await db.saveAcknowledgment(taskID);

//       return res.status(200).json({
//         message: `Task ID ${taskID} acknowledged successfully.`,
//       });
//     } catch (error) {
//       console.error("Error processing task acknowledgment:", error);
//       return res.status(500).json({
//         message: "Internal server error.",
//       });
//     }
//   } else {
//     // Method ไม่ใช่ POST
//     return res.status(405).json({
//       message: "Method not allowed.",
//     });
//   }
// }
