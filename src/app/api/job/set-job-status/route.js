import { NextResponse } from "next/server.js";
import { Job } from "@/lib/models/Job.js";
//import { JobItem } from "@/lib/models/JobItem.js";
import { Machine } from "@/lib/models/Machine";
import { Workgroup } from "@/lib/models/Workgroup";
import { User } from "@/lib/models/User.js";
import { TestLocation } from "@/lib/models/TestLocation";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobApproves } from "@/lib/models/JobApprove";

//export const dynamic = "force-dynamic";
export const GET = async (req, res) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;
  const JobId = searchParams.get("job_id");
  //const JobItemvalue = searchParams.get("value");

  //const JobTemplateID = searchParams.get("job_key");
  //const ACTIVE_LINE_NAME = searchParams.get("line");
  //const ACTIVE_USER_ID = searchParams.get("user_id");

  //console.log('JobItemID',JobItemID);
  //console.log('JobItemValue',JobItemvalue);  

   try {  
     const job = await Job.findOne({ _id: JobId });
     //jobItem.ACTUAL_VALUE = JobItemvalue;
      const statusAssigned = await Status.findOne({
             status_name: "complete",
      });  
      
      const submittedUser = await User.findById("67ce53c078f9a087fb30c7d9");

      job.JOB_STATUS_ID = statusAssigned._id;
      job.SUBMITTED_BY = submittedUser;
      job.SUBMITTED_DATE = new Date();
     // job.IMAGE_FILENAME = jobData.wdtagImage_1;
     // job.IMAGE_FILENAME_2 = jobData.wdtagImage_2;

     await job.save();

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
