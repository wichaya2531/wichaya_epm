import { NextResponse } from "next/server";
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { User } from "@/lib/models/User";


export const PUT = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { JOB_ID } = body;
  const { user_id } = body; 
  //console.log("JOB_ID", JOB_ID);
  //console.log("USER_ID", user_id);
  const user = await User.findOne({ _id: user_id });
  //console.log("user", user);
  //return NextResponse.json({ status: 200 });
  
  try {

    const job = await Job.findOne({ _id: JOB_ID });
    const jobStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
    const jobStatusName = jobStatus.status_name;
    const ongoing_status = await Status.findOne({ status_name: "ongoing" });

    // Update the job status to ongoing if the current status is new
    if (jobStatusName === "new" || jobStatusName === "renew") {
      job.JOB_STATUS_ID = ongoing_status._id;
      job.LAST_GET_BY = user.EMP_NAME || "Unknown"; // Set LAST_GET to current date and time
      job.LAST_GET_TIME = new Date();
      await job.save();
    }

    return NextResponse.json({ status: 200 });
  } catch (err) {
    console.error("Error occurred:", err); // Log the error
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
