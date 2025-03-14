// {
//     "activationDate": "2024-05-28",
//     "recurrence": "daily",
//     "jobTemplateID": "6645834c66167e4286abad6e",
//     "jobTemplateCreateID": "18f7f88e15c-e357ef12d244b",
//     "ACTIVATER_ID": "6632fae0a67bf44b884f39be"
// }
// import mongoose from "mongoose";

// const JobTemplateActivateSchema = new mongoose.Schema({
//     JobTemplateID: { type: mongoose.Schema.Types.ObjectId, ref: "JobTemplate" },
//     JobTemplateCreateID: { type: String, required: true },
//     JOB_ID: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
//     RECURRING_TYPE: { type: String, default: null }
// }, { timestamps: true });

// export const JobTemplateActivate = mongoose.models?.JobTemplateActivate || mongoose.model("JobTemplateActivate", JobTemplateActivateSchema)
import { NextResponse } from "next/server.js";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Approves } from "@/lib/models/Approves.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
// import mongoose from 'mongoose';

// const scheduleSchema = new mongoose.Schema({
//     JOB_TEMPLATE_ID : { type: mongoose.Schema.Types.ObjectId, ref: 'JobTemplate', required: true },
//     ACTIVATE_DATE: { type: Date, required: true },
// }, { timestamps: true });

// export const Schedule = mongoose.models?.Schedule || mongoose.model('Schedule', scheduleSchema);

function formatDateToString(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "Invalid Date";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const POST = async (req, res) => {
  //console.log("************use job planning******************");

  await connectToDb();
  const body = await req.json();

  const {
    activationDate,
    activationTime,
    recurrence,
    jobTemplateID,
    jobTemplateCreateID,
    ACTIVATER_ID,
    LINE_NAME,
    endDate,
    startDate,
    shift_date,
  } = body;

 // console.log("startDate ====>", startDate);

  try {
    const jobTemplate = await JobTemplate.findOne({ _id: jobTemplateID });
    if (!jobTemplate) {
      return NextResponse.json({
        status: 404,
        file: __filename,
        error: "Job template not found",
      });
    }

    // Calculate the end date based on the recurrence type

    let startDateActive = new Date(
      formatDateToString(new Date(startDate || null)) + "T" + activationTime
    );
    startDateActive.setHours(
      startDateActive.getHours() +
        parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
    );

    if (
      recurrence === "weekly" ||
      recurrence == "monthly" ||
      recurrence === "yearly"
    ) {
      startDateActive = new Date(
        formatDateToString(new Date(startDate || activationDate)) +
          "T" +
          activationTime
      );
      startDateActive.setHours(
        startDateActive.getHours() +
          parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
      );
    }
    let endDateActive = new Date(
      formatDateToString(new Date(endDate)) + "T" + activationTime
    );
    endDateActive.setHours(
      endDateActive.getHours() +
        parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
    );
    let rolling_Datetime = startDateActive;
    while (rolling_Datetime <= endDateActive) {
      // Create a new job
      const AdvanceActivationDate = new Date(rolling_Datetime);
      AdvanceActivationDate.setHours(
        AdvanceActivationDate.getHours() -
          parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
      );
      const schedulePromises = LINE_NAME.map(async (lineName) => {
        const schedule1 = new Schedule({
          JOB_TEMPLATE_ID: new ObjectId(),
          JOB_TEMPLATE_CREATE_ID: jobTemplateCreateID,
          JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
          ACTIVATE_DATE: AdvanceActivationDate,
          LINE_NAME: lineName,
          DOC_NUMBER: jobTemplate.DOC_NUMBER,
          WORKGROUP_ID: jobTemplate.WORKGROUP_ID,          
        });
        console.log(`Saving Schedule `, schedule1);
        //console.log(`Saving Schedule for lineName: ${lineName}`, schedule1);
        await schedule1.save();

        // ถ้า shift_date เป็น true ให้สร้าง schedule ที่มีเวลาเพิ่มขึ้น 12 ชั่วโมง
        if (shift_date === true) {
          const schedule2 = new Schedule({
            ...schedule1.toObject(), // คัดลอกข้อมูลทั้งหมด
            _id: undefined, // ลบ _id ออกเพื่อให้ MongoDB สร้างใหม่
            ACTIVATE_DATE: new Date(
              AdvanceActivationDate.getTime() + 12 * 60 * 60 * 1000
            ), // เพิ่ม 12 ชั่วโมง
          });

          console.log(
            `Saving Shifted Schedule for lineName: ${lineName}`,
            schedule2
          );
          await schedule2.save();
        }
      });

      // ใช้ Promise.all เพื่อรอให้ทุกคำขอทำงานพร้อมกัน
      await Promise.all(schedulePromises);

      // Increment currentDate based on the recurrence type
      if (recurrence === "daily") {
        rolling_Datetime.setDate(rolling_Datetime.getDate() + 1); // Add one day for daily recurrence
      } else if (recurrence === "weekly") {
        rolling_Datetime.setDate(rolling_Datetime.getDate() + 7); // Add seven days for weekly recurrence
      } else if (recurrence === "monthly") {
        rolling_Datetime.setMonth(rolling_Datetime.getMonth() + 1); // Add one month for monthly recurrence
      } else if (recurrence === "yearly") {
        rolling_Datetime.setFullYear(rolling_Datetime.getFullYear() + 1); // Add one year for yearly recurrence
      } else {
        break; // If recurrence type is not specified or invalid, exit the loop
      }
    }

    return NextResponse.json({
      status: 200,
      message: "Jobs activated successfully",
    });
  } catch (err) {
    console.log("Error", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
