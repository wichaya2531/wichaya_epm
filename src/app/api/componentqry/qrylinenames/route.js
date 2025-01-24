import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";

export const GET = async (req, res) => {
    await connectToDb();


    const { searchParams } = req.nextUrl;
    const workgroup = searchParams.get("workgroup"); // รับค่า lineName จาก query string

    console.log("Received workgroup:", workgroup);

    const qry_job = await Job.aggregate([
        {
            // แปลง WORKGROUP_ID ที่เป็น String ให้เป็น ObjectId
            $addFields: {
                WORKGROUP_ID_ObjectId: { $toObjectId: "$WORKGROUP_ID" }
            }
        },
        {
            $lookup: {
                from: "workgroups", // ชื่อคอลเลกชันของ Workgroup
                localField: "WORKGROUP_ID_ObjectId", // ฟิลด์ใน Job ที่แปลงเป็น ObjectId
                foreignField: "_id", // ฟิลด์ใน Workgroup
                as: "workgroupDetails" // ชื่อฟิลด์ที่รวมข้อมูล
            }
        }
    ]);

    //console.log("qry_job",qry_job);
    // กรอง qry_job ให้เอาเฉพาะงานที่มี workgroupName ตรงกับ workgroup
const filteredJobs = qry_job.filter((job) => {
    return (
      job.workgroupDetails.length > 0 &&
      job.workgroupDetails[0].WORKGROUP_NAME === workgroup &&
      job.LINE_NAME !== undefined // ตรวจสอบว่า LINE_NAME ไม่เป็น undefined
    );
  });
  
        // สร้าง unique LINE_NAME
        const uniqueLineNames = [...new Set(filteredJobs.map((job) => job.LINE_NAME))];
        
        // แปลง unique LINE_NAME ให้เป็นรูปแบบ result
        const result = uniqueLineNames.map((lineName) => {
            return {
            LINE_NAME: lineName,
            };
        });
        
        //console.log("Filtered LINE_NAME based on workgroup and valid LINE_NAME:", result);

    return NextResponse.json({ status: 200, data: result });   

    console.log(new Date());
    // ใช้ Aggregation Pipeline
    

    // สร้างผลลัพธ์ที่รวม Workgroup Name และ _id
   

    // แสดงผลลัพธ์แต่ละรายการ
    var workgroups = [];
    result.forEach(element => {
        if (element.WORKGROUP_NAME !== "No Workgroup") {
            // ตรวจสอบว่า Workgroup นี้มีอยู่แล้วใน workgroups หรือไม่
            if (!workgroups.some(group => group.WORKGROUP_NAME === element.WORKGROUP_NAME)) {
                workgroups.push({
                    _id: element.WORKGROUP_ID, // เก็บ _id จาก Workgroup
                    WORKGROUP_NAME: element.WORKGROUP_NAME
                });
            }
        }
    });

    console.log("line", workgroups);

    
    console.log(new Date());

    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({ status: 200, data: workgroups });
};
