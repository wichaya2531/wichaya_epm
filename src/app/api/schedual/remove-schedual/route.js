import { NextResponse } from "next/server.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { Machine } from "@/lib/models/Machine";
import { Workgroup } from "@/lib/models/Workgroup";
import { User } from "@/lib/models/User.js";
import { TestLocation } from "@/lib/models/TestLocation";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobApproves } from "@/lib/models/JobApprove";
import { Schedule } from "@/lib/models/Schedule.js";

//export const dynamic = "force-dynamic";
export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  let schedual_id = body._id;
  //console.log('schedual_id to want to delete',schedual_id);
  // const isJob=await Job.findById(job_ids);
 

  try {
   const schedualsDelete=await Schedule.findByIdAndDelete(schedual_id);
    return NextResponse.json({ status: 200, message: "ลบสำเร็จ", schedualsDelete });
  } catch (error) {
    console.error("ลบไม่สำเร็จ:", error);
    return NextResponse.json({ status: 500, message: "เกิดข้อผิดพลาด", error: error.message });
  }
  return;
  //const JobItemID = searchParams.get("id");
  //const JobItemvalue = searchParams.get("value");

  //const JobTemplateID = searchParams.get("job_key");
  //const ACTIVE_LINE_NAME = searchParams.get("line");
  //const ACTIVE_USER_ID = searchParams.get("user_id");

  //console.log('JobItemID',JobItemID);
  //console.log('JobItemValue',JobItemvalue);  

   try {  
     const jobItem = await JobItem.findOne({ _id: JobItemID });
     jobItem.ACTUAL_VALUE = JobItemvalue;
     await jobItem.save();

      return NextResponse.json({
        status: 200
        // ,
        // jobData: jobData,
        // jobItemData: jobItemData,
      });
  } catch (err) {
      console.log(err);
      return NextResponse.json({
        status: 500,      
        error: err.message,
      });
    }
};
