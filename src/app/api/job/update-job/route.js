import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { getRevisionNo } from "@/lib/utils/utils";
import { User } from "@/lib/models/User";
import fs from "fs";
import path from "path";

export const POST = async (req) => {
  await connectToDb();
  const form = await req.formData();

  // รับ jobData และ jobItemsData จาก FormData
  const jobData = JSON.parse(form.get("jobData"));
  const jobItemsData = JSON.parse(form.get("jobItemsData"));

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!jobData || !jobItemsData) {
    return NextResponse.json({
      status: 400,
      message: "Missing job data or job items data.",
    });
  }

  try {
    const file = form.get("file");

    // จัดการกับไฟล์
    const filePath = await handleFileUpload(file);
    if (!filePath) {
      return NextResponse.json({ status: 400, message: "No file received." });
    }

    // ค้นหา job
    const job = await Job.findOne({ _id: jobData.JobID });
    if (!job) {
      return NextResponse.json({ status: 404, message: "Job not found." });
    }

    // ค้นหาผู้ส่ง
    const submittedUser = await User.findById(jobData.submittedBy);
    const latestDocNo = await getRevisionNo(job.DOC_NUMBER);

    // ตรวจสอบหมายเลขเอกสาร  ปิดเมื่อทดสอบใน Local
    // if (latestDocNo.message) {
    //   console.log("Doc number error");
    //   return NextResponse.json({ status: 455, message: latestDocNo.message });
    // } else if (job.CHECKLIST_VERSION !== latestDocNo) {
    //   return NextResponse.json({
    //     status: 455,
    //     message: "This Checklist does not have the latest revision",
    //   });
    // }

    // อัปเดต job items
    await updateJobItems(jobItemsData);

    // อัปเดตสถานะ job และบันทึกชื่อไฟล์รูปภาพ
    job.WD_TAG = jobData.wd_tag;
    const waitingStatus = await Status.findOne({
      status_name: "waiting for approval",
    });
    job.JOB_STATUS_ID = waitingStatus._id;
    job.SUBMITTED_BY = submittedUser;
    job.SUBMITTED_DATE = new Date();

    // บันทึกพาธของไฟล์รูปภาพ
    job.IMAGE_FILENAME = `/job-image/${file.name}`;

    await job.save();

    return NextResponse.json({ status: 200 });
  } catch (err) {
    console.error("Error occurred:", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};

// ฟังก์ชันจัดการการอัปโหลดไฟล์
const handleFileUpload = async (file) => {
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());

    // ใช้ชื่อไฟล์ต้นฉบับ
    const originalFilename = file.name;
    const relativeFilePath = path.join("job-image", originalFilename);
    const filePath = path.join(process.cwd(), "public", relativeFilePath);

    // ตรวจสอบว่ามีโฟลเดอร์หรือไม่ ถ้าไม่มีให้สร้างใหม่
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // บันทึกไฟล์ลงในโฟลเดอร์
    fs.writeFileSync(filePath, buffer);

    // ส่งคืนพาธของไฟล์เพื่อบันทึกลงในฐานข้อมูล
    return `/job-image/${originalFilename}`;
  }
  return null;
};

// ฟังก์ชันอัปเดต job items
const updateJobItems = async (jobItemsData) => {
  await Promise.all(
    jobItemsData.map(async (jobItemData) => {
      const jobItem = await JobItem.findOne({ _id: jobItemData.jobItemID });
      if (jobItem) {
        jobItem.ACTUAL_VALUE = jobItemData.value || jobItem.ACTUAL_VALUE;
        jobItem.COMMENT = jobItemData.Comment || jobItem.COMMENT;
        jobItem.BEFORE_VALUE = jobItemData.BeforeValue || jobItem.BEFORE_VALUE;
        await jobItem.save();
      }
    })
  );
};
