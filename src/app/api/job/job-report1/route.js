import { connectToDb } from "@/app/api/mongo/index";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { Workgroup } from "@/lib/models/Workgroup.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";

function addTime(date, hours, minutes) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
}

// ✅ cache ระดับ process (ไม่ query statuses ทุก request)
let statusCache = null;
let statusCacheAt = 0;
const STATUS_TTL_MS = 10 * 60 * 1000; // 10 นาที

async function getStatusMapCached() {
  const now = Date.now();
  if (statusCache && (now - statusCacheAt) < STATUS_TTL_MS) return statusCache;

  const statuses = await Status.find({}, { status_name: 1 }).lean();
  const map = Object.create(null);
  for (const s of statuses) map[s._id.toString()] = s.status_name;

  statusCache = map;
  statusCacheAt = now;
  return map;
}

export const GET = async (req) => {
  await connectToDb();
  console.time("Query Execution Time");

  const searchParams = req.nextUrl.searchParams;

  // ⚠️ อันนี้คุณลบ 24 ชม. จริงไหม? (ถ้าไม่ตั้งใจ มันทำให้ช่วงกว้างขึ้นและช้าขึ้น)
  const startDate = addTime(new Date(searchParams.get("start")), -24, 0);
  const endDate = addTime(new Date(searchParams.get("end")), 23, 59);

  //console.log("startDate", startDate);
  //console.log("endDate", endDate);
 


  const workgroup_name = searchParams.get("workgroup");
  const workgroup = await Workgroup.findOne({ WORKGROUP_NAME: workgroup_name }, { _id: 1 }).lean();

  // ✅ ไม่เจอ workgroup return เร็ว ๆ ไม่ต้อง aggregate
  if (!workgroup?._id) {
    console.timeEnd("Query Execution Time");
    return NextResponse.json([]);
  }

  try {
    const statusMap = await getStatusMapCached(); // ✅ ดึงครั้งเดียว (ส่วนใหญ่ hit cache)

          const jobValues = await Job.aggregate([
            {
              $match: {
                WORKGROUP_ID: workgroup._id.toString(),
                updatedAt: { $gte: startDate, $lte: endDate },
                CHECKLIST_VERSION: { $ne: null },
                LINE_NAME: { $ne: null },
                WD_TAG: { $ne: null },
                DOC_NUMBER: { $ne: null },
                JOB_STATUS_ID: { $ne: null },
              },
            },

            {
              $lookup: {
                from: "jobitems",
                localField: "_id",
                foreignField: "JOB_ID",
                as: "jobItems",
              },
            },
            { $unwind: "$jobItems" },

            // ✅ กรองหลัง unwind ใน DB เลย ลด payload ไป JS
            {
              $match: {
                "jobItems.updatedAt": { $ne: null },
                "jobItems.JOB_ITEM_NAME": { $ne: null },
                "jobItems.JOB_ITEM_TITLE": { $ne: null },

                // ถ้าต้องการให้มีค่าเท่านั้น (และไม่ทำ 0 หาย)
                "jobItems.ACTUAL_VALUE": { $ne: null },
              },
            },

            // ✅ ดึง status_name ใน pipeline เลย ตัด statusMap
            {
              $lookup: {
                from: "statuses",
                localField: "JOB_STATUS_ID",
                foreignField: "_id",
                as: "statusInfo",
              },
            },
            { $unwind: { path: "$statusInfo", preserveNullAndEmptyArrays: true } },

            {
              $project: {
                _id: 0,
                WORKGROUP_NAME: workgroup_name,
                LINE_NAME: 1,
                DOC_NUMBER: 1,
                JOB_NAME:1,
                WD_TAG: 1,
                CHECKLIST_VERSION: 1,  
                SUBMITTED_BY: "$SUBMITTED_BY.EMP_NAME",
                JOB_STATUS: { $ifNull: ["$statusInfo.status_name", "Unknown"] },

                JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
                JOB_ITEM_TITLE: "$jobItems.JOB_ITEM_TITLE",
                jobItemsUpdatedAt: "$jobItems.updatedAt",
                ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE",
                VALUE: "$jobItems.VALUE",
                UPPER: "$jobItems.UPPER_SPEC",
                LOWER: "$jobItems.LOWER_SPEC",
                FILE: "$jobItems.FILE", // ใน jobitems ของคุณชื่อ FILE ไม่ใช่ IMG_ATTACH
         
              },
            },

            { $sort: { jobItemsUpdatedAt: 1 } },
          ]).allowDiskUse(true);

    // ✅ map status แบบเร็ว + ไม่ต้อง filter ซ้ำ
    for (const row of jobValues) {
      const id = row.JOB_STATUS_ID?.toString();
      row.JOB_STATUS = statusMap[id] || "Unknown";
      delete row.JOB_STATUS_ID;
    }

    console.timeEnd("Query Execution Time");
    return NextResponse.json(jobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    console.timeEnd("Query Execution Time");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};
