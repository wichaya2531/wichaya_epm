import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";

export const GET = async (req, res) => {
    await connectToDb();

    console.log(new Date());
    // ใช้ Aggregation Pipeline
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

    // สร้างผลลัพธ์ที่รวม Workgroup Name และ _id
    const result = qry_job.map(job => {
        const workgroupName = job.workgroupDetails.length > 0 ? job.workgroupDetails[0].WORKGROUP_NAME : "No Workgroup";
        const workgroupId = job.workgroupDetails.length > 0 ? job.workgroupDetails[0]._id : null;

        return {
            JOB_NAME: job.JOB_NAME,
            WORKGROUP_NAME: workgroupName,
            WORKGROUP_ID: workgroupId
        };
    });

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

    console.log("workgroups", workgroups);

    
    console.log(new Date());

    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({ status: 200, data: workgroups });
};
