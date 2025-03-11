import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule";
import { Job } from "@/lib/models/Job.js";

export const GET = async (req, res) => {
    await connectToDb();

    const now = new Date(); // เวลาปัจจุบัน
       const startTime = new Date(now); // สำเนาเวลาปัจจุบัน
       startTime.setMinutes(now.getMinutes() - 800); // ลบ 60 นาที
       
       const endTime = new Date(now); // สำเนาเวลาปัจจุบัน
       endTime.setMinutes(now.getMinutes() + 800); // เพิ่ม 60 นาที
       console.log("scheduler startTime:",startTime);  
       console.log("scheduler endTime:",endTime);  
       
       const scheduler = await Schedule.find({
         ACTIVATE_DATE: {
           $gte: startTime, // เวลาที่มากกว่าหรือเท่ากับ startTime (60 นาทีก่อนหน้า)
           $lte: endTime, // เวลาที่น้อยกว่าหรือเท่ากับ endTime (60 นาทีถัดไป)
         },
         STATUS:"plan",
       });
   
       console.log("scheduler ที่ค้นหาเจอ=>", scheduler);

    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({ status: 200});
};
