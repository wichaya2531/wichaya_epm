// /api/job/get-jobs-from-workgroup-byIds/[workgroup_id]/route.js

import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job";
import { Schedule } from "@/lib/models/Schedule";
import { User } from "@/lib/models/User";
import { Status } from "@/lib/models/Status";
import { ProfileGroup } from "@/lib/models/ProfileGroup";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

// ---------- Utilities ----------
function normalizeJobIds(jobIds) {
  if (!jobIds) return [];
  const arr = Array.isArray(jobIds) ? jobIds : String(jobIds).split(",");
  return arr
    .map((s) => String(s).trim())
    .filter((s) => Types.ObjectId.isValid(s))
    .map((s) => new Types.ObjectId(s));
}

async function loadProfileGroupsMap() {
  const arr = await ProfileGroup.find().lean();
  return arr.reduce((acc, g) => {
    acc[g._id] = g.PROFILE_NAME;
    return acc;
  }, {});
}

function makeNDJSONStream(producerFn) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const push = (obj) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        await producerFn(push);
      } catch (e) {
        push({ error: e?.message || "internal error" });
      } finally {
        controller.close();
      }
    },
  });
}

function streamResponse(stream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

// enrich/mapping ให้หน้าบ้าน
async function mapJobsAndSchedules({ jobs, schedules, profileNameById }) {
  const jobStatusIds = [
    ...new Set(jobs.map((j) => String(j.JOB_STATUS_ID)).filter(Boolean)),
  ];
  const statusDocs = await Status.find({ _id: { $in: jobStatusIds } }).lean();
  const statusMap = statusDocs.reduce((acc, s) => ((acc[String(s._id)] = s), acc), {});

  const userIds = [
    ...new Set(jobs.map((j) => String(j.ACTIVATE_USER)).filter(Boolean)),
  ];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = users.reduce((acc, u) => ((acc[String(u._id)] = u), acc), {});

  const jobRows = jobs.map((job) => {
    const user = userMap[String(job.ACTIVATE_USER)];
    const st = statusMap[String(job.JOB_STATUS_ID)];
    const submit_name = {
      EMP_NAME:
        job.SUBMITTED_BY_NAME ??
        job.SUBMITTED_BY?.EMP_NAME ??
        "-",
    };
    return {
      _id: job._id,
      SUBMITTED_BY: submit_name,
      LINE_NAME: job.LINE_NAME,
      JOB_NAME: job.JOB_NAME,
      ACTIVATE_USER: job.ACTIVATE_USER,
      createdAt: job.createdAt,
      ACTIVATER_NAME: user?.EMP_NAME || "Unknown",
      STATUS_NAME: st?.status_name || "Unknown",
      STATUS_COLOR: st?.color || "Unknown",
      ITEM_ABNORMAL: job.VALUE_ITEM_ABNORMAL || false,
      VALUE_ITEM_ABNORMAL: job.VALUE_ITEM_ABNORMAL,
      updatedAt: job.updatedAt,
      SUBMITTED_DATE: job.SUBMITTED_DATE,
      JOB_VERIFY: job.IMAGE_FILENAME || job.IMAGE_FILENAME_2 ? true : false,
      LAST_GET_BY: job.LAST_GET_BY || "Unknown",
      LAST_GET_TIME: job.LAST_GET_TIME || "Unknown",
      TYPE: job.TYPE || "Unknown",
      PROFILE_GROUP: profileNameById[job.PROFILE_GROUP] || "Unknown",
    };
  });

  const scheduleStatusNames = [
    ...new Set(schedules.map((s) => s.STATUS).filter(Boolean)),
  ];
  const scheduleStatusDocs = await Status.find({
    status_name: { $in: scheduleStatusNames },
  }).lean();
  const scheduleStatusMap = scheduleStatusDocs.reduce(
    (acc, s) => ((acc[s.status_name] = s.color || "Unknown"), acc),
    {}
  );

  const scheduleRows = schedules.map((schedule) => ({
    _id: schedule._id,
    LINE_NAME: schedule.LINE_NAME,
    JOB_APPROVERS: [],
    JOB_NAME: schedule.JOB_TEMPLATE_NAME,
    DOC_NUMBER: schedule.DOC_NUMBER,
    ACTIVATE_USER: "Scheduler",
    createdAt: new Date(schedule.ACTIVATE_DATE).toISOString(),
    updatedAt: schedule.updatedAt,
    ACTIVATER_NAME: "Scheduler",
    STATUS_NAME: schedule.STATUS,
    STATUS_COLOR: scheduleStatusMap[schedule.STATUS] || "Unknown",
    JOB_TEMPLATE_CREATE_ID: schedule.JOB_TEMPLATE_CREATE_ID,
    JOB_TEMPLATE_NAME: schedule.JOB_TEMPLATE_NAME,
    ACTIVATE_DATE: schedule.ACTIVATE_DATE,
    SCHEDULE_STATUS: schedule.STATUS,
    PROFILE_GROUP: profileNameById[schedule.PROFILE_GROUP] || "Unknown",
  }));

  const merged = [...jobRows, ...scheduleRows];
  merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return merged;
}

// ---------- POST ----------
export const POST = async (req, { params }) => {
  console.log("✅ POST /get-jobs-from-workgroup-byIds called");

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 400, error: "Invalid JSON body" });
  }

  const { jobIds } = body || {};
  if (!jobIds) {
    return NextResponse.json({ status: 400, error: "Missing jobIds" });
  }

  await connectToDb();
  const ids = normalizeJobIds(jobIds);
  if (!ids.length) {
    const stream = makeNDJSONStream(async (push) => push([]));
    return streamResponse(stream);
  }

  const profileNameById = await loadProfileGroupsMap();

  const stream = makeNDJSONStream(async (push) => {
    // ❌ ตัด WORKGROUP_ID ออกจากเงื่อนไข
    const [jobs, schedules] = await Promise.all([
      Job.find({ _id: { $in: ids } }).sort({ updatedAt: -1 }).lean(),
      Schedule.find({ _id: { $in: ids } }).sort({ updatedAt: -1 }).lean(),
    ]);

    const merged = await mapJobsAndSchedules({ jobs, schedules, profileNameById });
    push(merged);
  });

  return streamResponse(stream);
};
