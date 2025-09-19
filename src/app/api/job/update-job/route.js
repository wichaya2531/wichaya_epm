import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { User } from "@/lib/models/User";
import { sendEmailsFromManual } from "@/lib/utils/utils";
import {
  ActivateJobTemplate,
  getRevisionNo,
  sendEmails,
} from "@/lib/utils/utils";
import { bool } from "sharp";
//import fs from "fs";
//import path from "path";

export const POST = async (req) => {
      //const form = await req.formData();
      //console.log("form=>",form);
      // รับ jobData และ jobItemsData จาก FormData
      //const jobData = JSON.parse(form.get("jobData"));      
      //const _Job= await Job.findById(jobData.JobID);
      //console.log('_Job',_Job);
      //console.log('Approve',_Job.JOB_APPROVERS);
      //console.log('jobData',jobData);
       
      //console.log(' this is test function !!!');


  try {
    // เชื่อมต่อฐานข้อมูล
    await connectToDb();
    //console.log("Database connected");

    const form = await req.formData();
    //console.log("form=>",form);

    // รับ jobData และ jobItemsData จาก FormData
    const jobData = JSON.parse(form.get("jobData"));
    const jobItemsData = JSON.parse(form.get("jobItemsData"));
    //console.log("jobData:", jobData);
    //console.log("jobItemsData:", jobItemsData);

    //console.log("update job  with POST****");
   // return NextResponse.json({ status : 200 });

    //return NextResponse.json({ status: 200, message: "Job updated successfully." });
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!jobData || !jobItemsData) {
      return NextResponse.json({
        status: 400,
        message: "Missing job data or job items data.",
      });
    }

    //return NextResponse.json({ status: 404, message: "Job not found." }); // รับไฟล์ที่อัปโหลด
    // const file = form.get("file");
    // const filePath = file ? await handleFileUpload(file) : null;
    // console.log("File path:", filePath);

    // if (!filePath) {
    //   return NextResponse.json({ status: 400, message: "No file received." });
    // }

    // ค้นหา job ในฐานข้อมูล
    const job = await Job.findOne({ _id: jobData.JobID });
    //console.log("Job found:", job);
     
    //console.log("update job  with POST****");
    //return NextResponse.json({ status : 200 });

    if (!job) {
      return NextResponse.json({ status: 404, message: "Job not found." });
    }

    // ค้นหาผู้ส่งข้อมูล
    let submittedUser = await User.findById(jobData.submittedBy);
    submittedUser.USERNAME="unknown";
    submittedUser.PASSWORD="unknown";

    //console.log('submittedUser',submittedUser);  

    //console.log("job",job);   
    //console.log("process.env.WD_INTRANET_MODE",process.env.WD_INTRANET_MODE);
    if(process.env.NEXT_PUBLIC_AGILE_ACCESS==="true"){
      if (process.env.WD_INTRANET_MODE === "true"  && job.AGILE_SKIP_CHECK===false) {
        const latestDocNo = await getRevisionNo(job.DOC_NUMBER);
        //console.log("Agile get result=>",latestDocNo);   
        // ปิดไว้เมื่อต้องการทดสอบ local fee
        //console.log(" ตรวจสอบหมายเลขเอกสาร");
        if (latestDocNo.message) {
          console.log("Doc number error for "+job.DOC_NUMBER);
          return NextResponse.json({ status: 455, message: latestDocNo.message });
        } else if (job.CHECKLIST_VERSION !== latestDocNo) {
          return NextResponse.json({
            status: 455,
            message: "This Checklist does not have the latest revision",
          });
        }
      }
    }
    

            

    //return NextResponse.json({ status: 455, message: "Tester..." });

    // อัปเดต job items
    await updateJobItems(jobItemsData); // ตรวจสอบที่นี่
    
    // อัปเดตสถานะ job และบันทึกชื่อไฟล์รูปภาพ
    job.WD_TAG = jobData.wd_tag;


    var statusAssigned;  
    if (job.JOB_APPROVERS.length==0) {
      //console.log(" ไม่มี Approve"); 
      statusAssigned = await Status.findOne({
        status_name: "complete",
      }); 
    }else{
      //console.log(" มี Approve"); 
      statusAssigned = await Status.findOne({
        status_name: "waiting for approval",
      });
    } 

    if (!statusAssigned) {
      return NextResponse.json({ status: 404, message: "Status not found." });
    }
    
    job.JOB_STATUS_ID = statusAssigned._id;
    job.SUBMITTED_BY = submittedUser;
    job.SUBMITTED_DATE = new Date();
    job.IMAGE_FILENAME = jobData.wdtagImage_1;
    job.IMAGE_FILENAME_2 = jobData.wdtagImage_2;
    job.VALUE_ITEM_ABNORMAL=jobData.valueItemABnormal;

    await job.save();
    {
      //console.log('submittedUser',submittedUser);
      const approverIds = job.JOB_APPROVERS;     // <-- อาจมี 1 หรือหลาย id
      var emailList=new Array();
      if (approverIds && approverIds.length > 0) {
        const approvers = await User.find({ _id: { $in: approverIds } });
        // แสดง email ของผู้อนุมัติทุกคน
        approvers.forEach((user) => {
          emailList.push(user.EMAIL);
        });
      } 
      const _jobForEmail= {
              name: job.JOB_NAME,
              activatedBy: submittedUser.EMP_NAME,
              timeout:  job.TIMEOUT,
              linename: job.LINE_NAME
      };      
      await sendEmailsFromManual(emailList, _jobForEmail,"wait_for_approve");
   }




    return NextResponse.json({
      status: 200,
      message: "Job updated successfully.",
      jobData,
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

// // ฟังก์ชันสำหรับการอัปโหลดไฟล์
// const handleFileUpload = async (file) => {
//   // กำหนดพาธโฟลเดอร์ที่ต้องการบันทึกไฟล์
//   const uploadDir = "C:\\img-jobs"; // เปลี่ยนพาธที่นี่

//   // สร้างโฟลเดอร์ถ้ายังไม่มี
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }

//   // ตั้งชื่อไฟล์ตามเวลาเพื่อไม่ให้ชื่อไฟล์ซ้ำกัน
//   const fileName = `${Date.now()}-${file.name}`;
//   const filePath = path.join(uploadDir, fileName);

//   // อ่านเนื้อหาไฟล์แล้วบันทึกลงโฟลเดอร์ที่กำหนด
//   const fileData = Buffer.from(await file.arrayBuffer());
//   fs.writeFileSync(filePath, fileData);

//   // ส่งคืนพาธของไฟล์ในรูปแบบ "C:\img-jobs\pic.png"
//   return filePath; // เปลี่ยนที่นี่
// };

// ฟังก์ชันอัปเดต Job Items
const updateJobItems = async (jobItemsData) => {
  const updatePromises = jobItemsData.map(async (jobItemData) => {
    const jobItem = await JobItem.findOne({ _id: jobItemData.JobItemID });

    if (jobItem) {
      // อัปเดตค่า ACTUAL_VALUE, COMMENT และ BEFORE_VALUE
      jobItem.ACTUAL_VALUE = jobItemData.value || jobItem.ACTUAL_VALUE; // อัปเดต ActualValue
      jobItem.COMMENT = jobItemData.Comment || jobItem.COMMENT; // อัปเดต Comment
      jobItem.BEFORE_VALUE =
        jobItemData.BeforeValue === "" || jobItemData.BeforeValue == null
          ? ""
          : jobItemData.BeforeValue;
      jobItem.BEFORE_VALUE2 =
        jobItemData.BeforeValue2 === "" || jobItemData.BeforeValue2 == null
          ? null
          : jobItemData.BeforeValue2;
      jobItem.IMG_ATTACH = jobItemData.IMG_ATTACH || jobItem.IMG_ATTACH; // อัปเดต ImageFileName
      jobItem.LastestUpdate = new Date(); // อัปเดตเวลาล่าสุด
      await jobItem.save(); // บันทึกการเปลี่ยนแปลง
      //console.log(`JobItem ${jobItemData.JobItemID} updated successfully.`);
    } else {
      console.error(`JobItem with ID ${jobItemData.JobItemID} not found.`);
    }
  });

  await Promise.all(updatePromises); // รอให้การอัปเดตทั้งหมดเสร็จสิ้น
};
