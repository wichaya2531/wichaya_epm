import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Schedule } from "@/lib/models/Schedule";
import { Status } from "@/lib/models/Status";
import { ObjectId } from "mongodb";
import { TextEncoder } from "util";
import { Machine } from "@/lib/models/Machine";

export const dynamic = "force-dynamic";

const checkItemAbNormal = async (_id) => {
  const _jobItem = await JobItem.find({ JOB_ID: _id });
  let _abnormal = false;
  _jobItem.forEach((element) => {
    _abnormal |= element.ACTUAL_VALUE === "Fail" ? true : false;
  });
  return _abnormal;
};

export const GET = async (req) => {
  console.time("fetch-jobs");

  await connectToDb();
  const searchParams = req.nextUrl.searchParams;

  const workgroup_id_raw = searchParams.get("workgroup_id");
  const selectedType = searchParams.get("type") || "all";
  const selectedPlanType = searchParams.get("plantype") || "all";
  const workgroup_id =
    workgroup_id_raw === "No workgroup" ? "all" : workgroup_id_raw;

  const datetimeStart = searchParams.get("start");
  const datetimeEnd = searchParams.get("end");

  const lineName = searchParams.get("line_name") || "";
  const checklistName = searchParams.get("checklist_name") || "";
  const profilegroupId = searchParams.get("profilegroup_id") || "";
  const wdTag = searchParams.get("wd_tag") || "";

const startDate = datetimeStart ? new Date(datetimeStart) : null;
const endDate = datetimeEnd ? new Date(datetimeEnd) : null;

if (startDate) {
  startDate.setHours(0, 0, 0, 0); // 00:00:00.000
}

if (endDate) {
  endDate.setHours(23, 59, 59, 999); // 23:59:59.999
}

//console.log('startDate', startDate);
//console.log('endDate', endDate);

    // โหลด Machine ทั้งหมดไว้ map ครั้งเดียว
    const machines = await Machine.find().lean();
    const machineMap = machines.reduce((acc, machine) => {
      acc[machine.WD_TAG] = machine.MACHINE_NAME;
      return acc;
    }, {});



  //console.log('machineMap=',machineMap);

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

        // =========================
        // Jobs Query
        // =========================
        const jobQuery = {};

        if (workgroup_id !== "all") {
          jobQuery.WORKGROUP_ID = workgroup_id;
        }

        if (startDate && endDate) {
          jobQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (lineName.trim()) {
          jobQuery.LINE_NAME = { $regex: lineName.trim(), $options: "i" };
        }

        if (checklistName.trim()) {
          jobQuery.JOB_NAME = { $regex: checklistName.trim(), $options: "i" };
        }

        if (profilegroupId) {
          jobQuery.PROFILE_GROUP = profilegroupId;
        }

        if (wdTag.trim()) {
          jobQuery.WD_TAG = { $regex: wdTag.trim(), $options: "i" };
        }

        const jobs = await Job.find(jobQuery);

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
          // ในส่วนของการ  
          const jobStatus = statusMap[job.JOB_STATUS_ID?.toString()];
          const event = {
            job_id: job._id,
            event_id: job._id,
            event_type: "job",
            title: `${job.LINE_NAME} : ${job.JOB_NAME} : ${time}`,
            status_name: jobStatus?.status_name || "Unknown",
            start: job.createdAt,
            end: adjustedEnd,
            color: jobStatus?.color || "#999999",
            sticker_verify: !!(job.IMAGE_FILENAME_2 || job.IMAGE_FILENAME),
            abnormal_item: job.VALUE_ITEM_ABNORMAL || false,
            job_name: job.JOB_NAME,
            line_name: job.LINE_NAME,
            profilegroup_id: job.PROFILE_GROUP || "",
            wd_tag: job.WD_TAG || "",
            machine_name:machineMap[job.WD_TAG] ?? "",//job.WD_TAG || "",
            last_get_by: job.LAST_GET_BY || "Unknown",
            last_get_date: job.LAST_GET_TIME || "Unknown",
          };

          if (selectedType === "all" || event.status_name === selectedType) {
            controller.enqueue(encoder.encode(JSON.stringify([event]) + "\n"));
          }
        }

        // =========================
        // Schedules Query
        // =========================
        const scheduleQuery = {};

        if (workgroup_id !== "all") {
          scheduleQuery.WORKGROUP_ID = new ObjectId(workgroup_id);
        }

        if (selectedPlanType !== "all") {
          scheduleQuery.PLAN_TYPE = selectedPlanType;
        }

        if (startDate && endDate) {
          scheduleQuery.ACTIVATE_DATE = { $gte: startDate, $lte: endDate };
        }

        if (lineName.trim()) {
          scheduleQuery.LINE_NAME = { $regex: lineName.trim(), $options: "i" };
        }

        if (checklistName.trim()) {
          scheduleQuery.JOB_TEMPLATE_NAME = {
            $regex: checklistName.trim(),
            $options: "i",
          };
        }

        if (profilegroupId) {
          scheduleQuery.PROFILE_GROUP = profilegroupId;
        }

        if (wdTag.trim()) {
          scheduleQuery.WD_TAG = { $regex: wdTag.trim(), $options: "i" };
        }

        const schedules = await Schedule.find(scheduleQuery);

        for (const schedule of schedules) {
          const status = statusMap[schedule.STATUS] || {
            status_name: schedule.STATUS,
            color: "#999999",
          };

         // console.log('schedule=',schedule);

          const hours = schedule.ACTIVATE_DATE
            .getHours()
            .toString()
            .padStart(2, "0");
          const minutes = schedule.ACTIVATE_DATE
            .getMinutes()
            .toString()
            .padStart(2, "0");
          const time = `${hours}:${minutes}`;

          const event = {
            event_id: schedule._id,
            event_type: "schedule",
            title: `${schedule.LINE_NAME} : ${schedule.JOB_TEMPLATE_NAME} : ${time}`,
            job_id: schedule.JOB_TEMPLATE_ID,
            status_name: status.status_name,
            start: schedule.ACTIVATE_DATE,
            end: schedule.ACTIVATE_DATE,
            color: status.color,
            plan_type: schedule.PLAN_TYPE || "Unknown",
            job_name: schedule.JOB_TEMPLATE_NAME,
            line_name: schedule.LINE_NAME,
            profilegroup_id: schedule.PROFILE_GROUP || "",
            wd_tag: schedule.MC_TAG.WD_TAG ?? "" ,
            machine_name: schedule.MC_TAG.MACHINE_NAME ?? "",//schedule.WD_TAG || "", 
          };

         // console.log('schedule event=',event);

          if (selectedType === "all" || event.status_name === selectedType) {
            controller.enqueue(encoder.encode(JSON.stringify([event]) + "\n"));
          }
        }

        controller.close();
        
        console.timeEnd("fetch-jobs");
      } catch (err) {
        if (process.env.NEXT_PUBLIC_DEBUG == "true") {
          console.log("Error Code : 028");
          console.error("Stream error", err);
        }
        controller.error(err);
      }
    },
  });

  //console.log(stream);


  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
};