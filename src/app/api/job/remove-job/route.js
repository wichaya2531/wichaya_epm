import { NextResponse } from "next/server.js";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";

export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { job_ids } = body; // รับเป็น array

  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return NextResponse.json({ status: 400, error: "Invalid job_ids" });
  }

  try {
    await Promise.all(
      job_ids.map(async (job_id) => {
        // ตรวจสอบว่ามีอยู่ในตาราง Schedule หรือไม่
        const schedules = await Schedule.find({ JOB_TEMPLATE_ID: job_id });
        if (schedules.length > 0) {
          await Schedule.deleteMany({ JOB_TEMPLATE_ID: job_id });
        }

        await JobTemplateActivate.findOneAndDelete({ JOB_ID: job_id });

        const jobItems = await JobItem.find({ JOB_ID: job_id });
        await Promise.all(
          jobItems.map((jobItem) =>
            JobItemTemplateActivate.findOneAndDelete({
              JOB_ITEM_ID: jobItem._id,
            })
          )
        );

        await JobItem.deleteMany({ JOB_ID: job_id });
        await Job.findByIdAndDelete(job_id);
      })
    );

    return NextResponse.json({ status: 200, message: "Jobs deleted" });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
