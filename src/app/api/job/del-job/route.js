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
import { JobItem } from "@/lib/models/JobItem.js";


//export const dynamic = "force-dynamic";
export const GET = async (req, res) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;
  const JobId = searchParams.get("job_id");
  //console.log("JobId for ",JobId);
   try {  
      const jobItems = await JobItem.find({ JOB_ID: JobId });
      await Job.deleteOne({ _id: JobId });
      await JobItem.deleteMany({ JOB_ID: JobId });

      return NextResponse.json({
        status: 200
      });
  } catch (err) {
      console.log(err);
      return NextResponse.json({
        status: 500,      
        error: err.message,
      });
    }
};
