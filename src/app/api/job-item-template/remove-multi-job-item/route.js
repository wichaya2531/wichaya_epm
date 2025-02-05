import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { Job } from "@/lib/models/Job";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import fs from "fs";
import path from "path";

export const DELETE = async (req) => {
  await connectToDb();
  const body = await req.json();
  const { job_ids } = body; // เปลี่ยนเป็น job_ids เพื่อความชัดเจน

  console.log("Job IDs to delete:", job_ids); // ตรวจสอบค่าที่ได้รับจาก frontend

  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return NextResponse.json({
      status: 400,
      error: "Invalid request: No job IDs provided",
    });
  }

  try {
    const jobsToDelete = await Job.find({ _id: { $in: job_ids } });

    console.log("Jobs found for deletion:", jobsToDelete); // ตรวจสอบว่ามีข้อมูลที่ต้องลบจริงหรือไม่

    if (jobsToDelete.length === 0) {
      return NextResponse.json({
        status: 404,
        error: "No matching jobs found",
      });
    }

    // ลบไฟล์ภาพที่เกี่ยวข้อง (ถ้ามี)
    jobsToDelete.forEach((job) => {
      if (job.IMAGE_FILENAME) {
        console.log(`Removing image file: ${job.IMAGE_FILENAME}`);
        const imagePath = path.join(
          process.cwd(),
          "public",
          job.IMAGE_FILENAME
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    // ลบเอกสารทั้งหมดในฐานข้อมูล
    await Job.deleteMany({ _id: { $in: job_ids } });

    return NextResponse.json({
      status: 200,
      message: "Jobs and associated images removed successfully",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
