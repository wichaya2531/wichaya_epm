import { connectToDb } from "@/app/api/mongo/index";
import { NextResponse }  from "next/server";
export const dynamic = "force-dynamic";

import { Workgroup } from "@/lib/models/Workgroup.js";
import { Job }       from "@/lib/models/Job.js";
import { Status }    from "@/lib/models/Status.js";

function addTime(date, hours, minutes) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

// ── Status cache (10 min TTL) ─────────────────────────────────────────────────
let statusCache   = null;
let statusCacheAt = 0;
const STATUS_TTL  = 10 * 60 * 1000;

async function getStatusMap() {
  const now = Date.now();
  if (statusCache && now - statusCacheAt < STATUS_TTL) return statusCache;
  const statuses = await Status.find({}, { status_name: 1, color: 1 }).lean();
  // key = _id.toString() เพราะ Job เก็บ JOB_STATUS_ID เป็น string
  statusCache = Object.fromEntries(
    statuses.map((s) => [s._id.toString(), { name: s.status_name, color: s.color }])
  );
  statusCacheAt = now;
  return statusCache;
}

export const GET = async (req) => {
  await connectToDb();
  console.time("job-report-type-2");

  const sp            = req.nextUrl.searchParams;
  const startDate     = addTime(new Date(sp.get("start")),  -24,  0);
  const endDate       = addTime(new Date(sp.get("end")),     23, 59);
  const workgroupName = sp.get("workgroup");

  const workgroup = await Workgroup.findOne(
    { WORKGROUP_NAME: workgroupName },
    { _id: 1 }
  ).lean();

  if (!workgroup?._id) {
    console.timeEnd("job-report-type-2");
    return NextResponse.json([]);
  }

  try {
    const statusMap = await getStatusMap();

    const jobs = await Job.aggregate([
      // ── 1. กรอง Job ──────────────────────────────────────────────────────
      {
        $match: {
          WORKGROUP_ID:      workgroup._id.toString(),
          updatedAt:         { $gte: startDate, $lte: endDate },
          CHECKLIST_VERSION: { $ne: null },
          LINE_NAME:         { $ne: null },
          WD_TAG:            { $ne: null },
          DOC_NUMBER:        { $ne: null },
          JOB_STATUS_ID:     { $ne: null },
        },
      },

      // ── 2. join JobItems เพื่อนับจำนวน (ไม่ unwind) ──────────────────────
      {
        $lookup: {
          from:         "jobitems",
          localField:   "_id",
          foreignField: "JOB_ID",
          as:           "jobItems",
        },
      },

      // ── 3. project ระดับ Job — เก็บ JOB_STATUS_ID ไว้ map หลัง aggregate ─
      {
        $project: {
          _id:               1,
          JOB_STATUS_ID:     1,   // string → จะ map กับ statusMap ด้านล่าง
          JOB_NAME:          1,
          LINE_NAME:         1,
          WD_TAG:            1,
          DOC_NUMBER:        1,
          CHECKLIST_VERSION: 1,
          SUBMITTED_BY:      "$SUBMITTED_BY.EMP_NAME",
          updatedAt:         1,
          createdAt:         1,
          ITEM_COUNT:        { $size: "$jobItems" },
          ITEM_ABNORMAL:     1,
          JOB_VERIFY:        1,
        },
      },

      { $sort: { updatedAt: -1 } },
    ]).allowDiskUse(true);

    // ── map JOB_STATUS_ID (string) → status_name ─────────────────────────────
    // หมายเหตุ: ใช้ statusMap แทน $lookup เพราะ JOB_STATUS_ID เก็บเป็น string
    //           ส่วน statuses._id เป็น ObjectId → $lookup join ไม่ติด
    for (const job of jobs) {
      const sid        = job.JOB_STATUS_ID?.toString();
      const statusInfo = statusMap[sid];
      job.JOB_STATUS       = statusInfo?.name  || "unknown";
      job.JOB_STATUS_COLOR = statusInfo?.color || "#9ca3af";
      delete job.JOB_STATUS_ID;
    }

    console.timeEnd("job-report-type-2");
    return NextResponse.json(jobs);
  } catch (err) {
    console.error("job-report-type-2 error:", err);
    console.timeEnd("job-report-type-2");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};
