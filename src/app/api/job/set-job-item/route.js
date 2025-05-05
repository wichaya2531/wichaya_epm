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

//export const dynamic = "force-dynamic";
export const GET = async (req, res) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;
  const JobItemID = searchParams.get("id");
  const JobItemvalue = searchParams.get("value");

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
