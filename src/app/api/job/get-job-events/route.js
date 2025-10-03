import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Schedule } from "@/lib/models/Schedule";
import { Status } from "@/lib/models/Status";
import { ObjectId } from "mongodb";
import { TextEncoder } from "util";

export const dynamic = "force-dynamic";

const checkItemAbNormal = async (_id) => {
   const _jobItem=await JobItem.find({JOB_ID:_id});
   let _abnormal=false; 
   _jobItem.forEach(element => {
          _abnormal|=element.ACTUAL_VALUE==="Fail"?true:false
   }); 
   //console.log(_id,_abnormal);
   return _abnormal;
}


export const GET = async (req) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;

  const workgroup_id_raw = searchParams.get("workgroup_id");
  const selectedType = searchParams.get("type") || "all";
  const selectedPlanType = searchParams.get("plantype") || "all";

  const workgroup_id = workgroup_id_raw === "No workgroup" ? "all" : workgroup_id_raw;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const statusArr = await Status.find();
        const statusMap = {};
        statusArr.forEach((s) => {
          statusMap[s._id] = {
            status_name: s.status_name,
            color: s.color,
          };
        });

        // Jobs
        const jobs =
          workgroup_id === "all"
            ? await Job.find()
            : await Job.find({ WORKGROUP_ID: workgroup_id });

        for (const job of jobs) {
          const startDate = new Date(job.createdAt);
          const endDate = new Date(job.updatedAt);

          const adjustedEnd =
            startDate.toDateString() !== endDate.toDateString()
              ? new Date(startDate.setHours(23, 59, 0, 0))
              : endDate;

          const hours = job.createdAt.getHours().toString().padStart(2, "0");
          const minutes = job.createdAt.getMinutes().toString().padStart(2, "0");
          const time = `${hours}:${minutes}`;


          const jobStatus = statusMap[job.JOB_STATUS_ID?.toString()];
          const event = {
            job_id:job._id,
            event_id:job._id,
            event_type:"job",
            title: `${job.LINE_NAME} : ${job.JOB_NAME} : ${time}`,
            status_name: jobStatus?.status_name || "Unknown",
            start: job.createdAt,
            end: adjustedEnd,
            color: jobStatus?.color || "#999999",
            sticker_verify: !!(job.IMAGE_FILENAME_2 || job.IMAGE_FILENAME),
            abnormal_item:job.VALUE_ITEM_ABNORMAL||false, //await checkItemAbNormal(job._id)
            job_name:job.JOB_NAME,
            line_name:job.LINE_NAME,
            last_get_by:job.LAST_GET_BY || "Unknown",
            last_get_date: job.LAST_GET_TIME || "Unknown",

          };

          if (selectedType === "all" || event.status_name === selectedType) {
            controller.enqueue(encoder.encode(JSON.stringify([event]) + "\n"));
          }
        }



      const query = {};

      // กำหนดเงื่อนไข WORKGROUP_ID
      if (workgroup_id !== "all") {
        query.WORKGROUP_ID = new ObjectId(workgroup_id);
      }

      // กำหนดเงื่อนไข PLAN_TYPE
      if (selectedPlanType !== "all") {
        query.PLAN_TYPE = selectedPlanType;
      }

      // แล้วใช้ query นี้ในการดึงข้อมูล
      //console.log('query',query);
      const schedules = await Schedule.find(query);

        // // Schedules
        // const schedules =
        //   workgroup_id === "all"
        //     ? await Schedule.find()
        //     : await Schedule.find({ WORKGROUP_ID: new ObjectId(workgroup_id)/*,PLAN_TYPE:selectedType*/ });




        for (const schedule of schedules) {
          const status = statusMap[schedule.STATUS] || {
            status_name: schedule.STATUS,
            color: "#999999",
          };

          const hours = schedule.ACTIVATE_DATE.getHours().toString().padStart(2, "0");
          const minutes = schedule.ACTIVATE_DATE.getMinutes().toString().padStart(2, "0");
          const time = `${hours}:${minutes}`;

          const event = {
            event_id:schedule._id,
            event_type:"schedule",            
            title: `${schedule.LINE_NAME} : ${schedule.JOB_TEMPLATE_NAME} : ${time}`,
            job_id: schedule.JOB_TEMPLATE_ID,
            status_name: status.status_name,
            start: schedule.ACTIVATE_DATE,
            end: schedule.ACTIVATE_DATE,
            color: status.color,
            plan_type: schedule.PLAN_TYPE || "Unknown",
            job_name:schedule.JOB_TEMPLATE_NAME,
            line_name:schedule.LINE_NAME,
          };

          if (selectedType === "all" || event.status_name === selectedType) {
            controller.enqueue(encoder.encode(JSON.stringify([event]) + "\n"));
          }
        }

        controller.close();
      } catch (err) {
        console.error("Stream error", err);
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
};
