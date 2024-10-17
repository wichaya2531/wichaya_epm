import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { User } from "@/lib/models/User";
import fs from "fs";
import path from "path";

export const POST = async (req) => {
  try {
    // เชื่อมต่อฐานข้อมูล
    await connectToDb();
    console.log("Database connected");

    const form = await req.formData();
    console.log("Form data received");

    // รับ jobData และ jobItemsData จาก FormData
    const jobData = JSON.parse(form.get("jobData"));
    const jobItemsData = JSON.parse(form.get("jobItemsData"));
    console.log("jobData:", jobData);
    console.log("jobItemsData:", jobItemsData);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!jobData || !jobItemsData) {
      return NextResponse.json({
        status: 400,
        message: "Missing job data or job items data.",
      });
    }

    // รับไฟล์ที่อัปโหลด
    const file = form.get("file");
    const filePath = file ? await handleFileUpload(file) : null;
    console.log("File path:", filePath);

    if (!filePath) {
      return NextResponse.json({ status: 400, message: "No file received." });
    }

    // ค้นหา job ในฐานข้อมูล
    const job = await Job.findOne({ _id: jobData.JobID });
    console.log("Job found:", job);

    if (!job) {
      return NextResponse.json({ status: 404, message: "Job not found." });
    }

    // ค้นหาผู้ส่งข้อมูล
    const submittedUser = await User.findById(jobData.submittedBy);
    // const latestDocNo = await getRevisionNo(job.DOC_NUMBER);
    // ปิดไว้เมื่อต้องการทดสอบ local  Jack Wichaya 

    // // ตรวจสอบหมายเลขเอกสาร
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
    await updateJobItems(jobItemsData); // ตรวจสอบที่นี่

    // อัปเดตสถานะ job และบันทึกชื่อไฟล์รูปภาพ
    job.WD_TAG = jobData.wd_tag;
    const waitingStatus = await Status.findOne({
      status_name: "waiting for approval",
    });
    if (!waitingStatus) {
      return NextResponse.json({ status: 404, message: "Status not found." });
    }
    job.JOB_STATUS_ID = waitingStatus._id;
    job.SUBMITTED_BY = submittedUser;
    job.SUBMITTED_DATE = new Date();

    // บันทึกพาธของไฟล์รูปภาพในรูปแบบ "/job-image/pic.png"
    job.IMAGE_FILENAME = filePath;

    await job.save();
    console.log("Job updated successfully");

    return NextResponse.json({
      status: 200,
      message: "Job updated successfully.",
    });
  } catch (err) {
    console.error("Error occurred:", err);
    return NextResponse.json({
      status: 500,
      message: "An error occurred while updating the job.",
      error: err.message,
    });
  }
};

// ฟังก์ชันสำหรับการอัปโหลดไฟล์
const handleFileUpload = async (file) => {
  // กำหนดพาธโฟลเดอร์ที่ต้องการบันทึกไฟล์
  const uploadDir = path.join(process.cwd(), "public", "job-image");

  // สร้างโฟลเดอร์ถ้ายังไม่มี
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // ตั้งชื่อไฟล์ตามเวลาเพื่อไม่ให้ชื่อไฟล์ซ้ำกัน
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  // อ่านเนื้อหาไฟล์แล้วบันทึกลงโฟลเดอร์ที่กำหนด
  const fileData = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, fileData);

  // ส่งคืนพาธของไฟล์ในรูปแบบ "/job-image/pic.png"
  return `/job-image/${fileName}`;
};

// ฟังก์ชันอัปเดต Job Items
const updateJobItems = async (jobItemsData) => {
  for (const item of jobItemsData) {
    const jobItem = await JobItem.findById(item.JobItemID);
    if (jobItem) {
      // อัปเดตข้อมูลของ jobItem ตามข้อมูลที่ส่งมา
      jobItem.JobItemTitle = item.JobItemTitle;
      jobItem.UpperSpec = item.UpperSpec;
      jobItem.LowerSpec = item.LowerSpec;
      jobItem.TestMethod = item.TestMethod;
      jobItem.BeforeValue = item.BeforeValue;
      jobItem.ActualValue = item.ActualValue;
      jobItem.Comment = item.Comment;
      jobItem.RealTimeValue = item.RealTimeValue;
      jobItem.TestLocationName = item.TestLocationName;
      jobItem.LastestUpdate = new Date();

      await jobItem.save();
    }
  }
};
