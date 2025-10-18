// /app/api/job/activate-job-template-manual/route.js
import { NextResponse } from "next/server.js";
import { ObjectId } from "mongodb";

import { connectToDb } from "@/app/api/mongo/index.js";

import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";

import { Approves } from "@/lib/models/Approves.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { Status } from "@/lib/models/Status";
import { sendEmailsFromManual } from "@/lib/utils/utils";
import { Notifies } from "@/lib/models/Notifies.js";
import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { User } from "@/lib/models/User";

// ---------- helpers ----------
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function asInt(v, def = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function POST(req) {

   console.log("flush from activate-job-template-manual");

  await connectToDb();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 400, error: "Invalid JSON body" });
  }

  const JobTemplateID = toObjectId(body?.JobTemplateID);
  const JobTemplateCreateID = body?.JobTemplateCreateID ?? null;
  const ACTIVATER_ID = toObjectId(body?.ACTIVATER_ID);
  const LINE_NAME = (body?.LINE_NAME ?? "").toString().trim();
  const jobCount = asInt(body?.jobCount, 1);

  if (!JobTemplateID || !ACTIVATER_ID || !LINE_NAME) {
    return NextResponse.json({
      status: 400,
      error: "Missing required fields: JobTemplateID, ACTIVATER_ID, LINE_NAME",
    });
  }

  try {
    // ----- phase 1: read all required data -----
    const [jobTemplate, newStatus, approves, overdueNotifies] = await Promise.all([
      JobTemplate.findOne({ _id: JobTemplateID, JobTemplateCreateID }).lean(),
      Status.findOne({ status_name: "new" }).lean(),
      Approves.find({ JOB_TEMPLATE_ID: JobTemplateID, JobTemplateCreateID }).lean(),
      NotifiesOverdue.find({ JOB_TEMPLATE_ID: JobTemplateID }).lean(),
    ]);

    if (!jobTemplate) {
      return NextResponse.json({ status: 404, error: "Job template not found" });
    }
    if (!newStatus?._id) {
      return NextResponse.json({ status: 404, error: "Status 'new' not found" });
    }

    const approverUserIds = (approves || [])
      .map(a => toObjectId(a?.USER_ID))
      .filter(Boolean);

    const overdueNotifyUserIds = (overdueNotifies || [])
      .map(n => toObjectId(n?.USER_ID))
      .filter(Boolean);

    const jobItemTemplates = await JobItemTemplate.find({ JOB_TEMPLATE_ID: JobTemplateID }).lean();
    if (!jobItemTemplates?.length) {
      return NextResponse.json({ status: 404, error: "Job item templates not found" });
    }

    // ----- phase 2: prefetch BEFORE_VALUE (ล่าสุดของแต่ละ template) -----
    const templateIds = jobItemTemplates.map(t => t._id);
    const latestItems = await JobItem.aggregate([
      { $match: { JOB_ITEM_TEMPLATE_ID: { $in: templateIds }, ACTUAL_VALUE: { $exists: true, $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$JOB_ITEM_TEMPLATE_ID", latestActual: { $first: "$ACTUAL_VALUE" } } },
    ]);

    const latestByTemplate = new Map();
    for (const row of latestItems) {
      latestByTemplate.set(String(row._id), row.latestActual);
    }

    const initialBeforeValueByTemplate = new Map();
    for (const t of jobItemTemplates) {
      const key = String(t._id);
      initialBeforeValueByTemplate.set(key, latestByTemplate.get(key) ?? "None");
    }

    // ----- phase 3: create jobs -----
    const baseJobDoc = {
      JOB_TEMPLATE_ID: jobTemplate._id,
      JOB_STATUS_ID: newStatus._id,
      DOC_NUMBER: jobTemplate.DOC_NUMBER,
      LINE_NAME,
      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
      ACTIVATE_USER: ACTIVATER_ID,
      JOB_APPROVERS: approverUserIds,
      OVERDUE_NOTIFYS: overdueNotifyUserIds,
      OVERDUE_ACK: "",
      TIMEOUT: jobTemplate.TIMEOUT,
      DISAPPROVE_REASON: "",
      PICTURE_EVEDENT_REQUIRE: jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
      AGILE_SKIP_CHECK: jobTemplate.AGILE_SKIP_CHECK || false,
      SORT_ITEM_BY_POSITION: jobTemplate.SORT_ITEM_BY_POSITION || false,
      PUBLIC_EDIT_IN_WORKGROUP: jobTemplate.PUBLIC_EDIT_IN_WORKGROUP || false,
      TYPE:jobTemplate.TYPE || "Unknown",
      PROFILE_GROUP:jobTemplate.PROFILE_GROUP || "Unknown",
    };
    
    //console.log("baseJobDoc for create new ",baseJobDoc);  

    let createdJobs = [];
    if (jobCount > 1) {
      const jobsDocs = Array.from({ length: jobCount }, (_, i) => ({
        ...baseJobDoc,
        //JOB_NAME: `${jobTemplate.JOB_TEMPLATE_NAME} (${i + 1})`,
        JOB_NAME: `${jobTemplate.JOB_TEMPLATE_NAME}`,
     
      }));
      createdJobs = await Job.insertMany(jobsDocs, { ordered: true });
    } else {
      createdJobs = [
        await Job.create({
          ...baseJobDoc,
          JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
        }),
      ];
    }

    const createdJobIds = createdJobs.map(j => j._id);

    // ----- phase 4: JobTemplateActivate -----
    const jtaDocs = createdJobIds.map(jid => ({
      JobTemplateID: jobTemplate._id,
      JobTemplateCreateID,
      JOB_ID: jid,
    }));
    await JobTemplateActivate.insertMany(jtaDocs, { ordered: true });

    // ----- phase 5: create JobItems (bulk) + JobItemTemplateActivate -----
    const jobItemsDocs = [];
    for (const jobId of createdJobIds) {
      for (const tpl of jobItemTemplates) {
        const tplIdStr = String(tpl._id);
        const beforeVal = initialBeforeValueByTemplate.get(tplIdStr) ?? "None";
        jobItemsDocs.push({
          JOB_ID: jobId,
          JOB_ITEM_TITLE: tpl.JOB_ITEM_TEMPLATE_TITLE,
          JOB_ITEM_NAME: tpl.JOB_ITEM_TEMPLATE_NAME,
          UPPER_SPEC: tpl.UPPER_SPEC,
          LOWER_SPEC: tpl.LOWER_SPEC,
          TEST_METHOD: tpl.TEST_METHOD,
          TEST_LOCATION_ID: tpl.TEST_LOCATION_ID,
          JOB_ITEM_TEMPLATE_ID: tpl._id,
          FILE: tpl.FILE,
          createdAt: tpl.createdAt,
          BEFORE_VALUE2: null,
          INPUT_TYPE: tpl.INPUT_TYPE || "All",
          POS: tpl.pos || 0,
          BEFORE_VALUE: beforeVal,
        });
      }
    }

    const createdJobItems = await JobItem.insertMany(jobItemsDocs, { ordered: true });

    const jitaDocs = createdJobItems.map(ji => {
      const tpl = jobItemTemplates.find(t => String(t._id) === String(ji.JOB_ITEM_TEMPLATE_ID));
      return {
        JOB_ITEM_TEMPLATE_ID: ji.JOB_ITEM_TEMPLATE_ID,
        JobItemTemplateCreateID: tpl?.JobItemTemplateCreateID,
        JOB_ITEM_ID: ji._id,
      };
    });
    await JobItemTemplateActivate.insertMany(jitaDocs, { ordered: true });

    // ----- phase 6: ส่งอีเมล (รวม Approvers + Notifies) -----
    const notifyIds = [...approverUserIds, ...overdueNotifyUserIds]
      .filter(Boolean)
      .map(x => String(x));
    const uniqueUserIds = Array.from(new Set(notifyIds)).map(s => new ObjectId(s));

    let uniqueEmails = [];
    if (uniqueUserIds.length) {
      const users = await User.find({ _id: { $in: uniqueUserIds } }, { EMAIL: 1 }).lean();
      uniqueEmails = users
        .map(u => (u?.EMAIL ? String(u.EMAIL).trim() : null))
        .filter(Boolean);
      uniqueEmails = Array.from(new Set(uniqueEmails));
    }

    const activater = await User.findOne({ _id: ACTIVATER_ID }, { EMP_NAME: 1 }).lean();
    const jobData = {
      name: jobCount > 1 ? `${jobTemplate.JOB_TEMPLATE_NAME} (x${jobCount})` : jobTemplate.JOB_TEMPLATE_NAME,
      activatedBy: activater?.EMP_NAME ?? null,
      timeout: jobTemplate.TIMEOUT,
      linename: LINE_NAME,
    };


    //console.log("uniqueEmails: ", uniqueEmails);  

    try {
      if (uniqueEmails.length) {
        await sendEmailsFromManual(uniqueEmails, jobData);
      }
    } catch (mailErr) {
      console.error("[activate-job-template-manual] email error:", mailErr);
      // ไม่ throw ต่อ เพื่อไม่ให้การสร้างงานล้ม
    }

    return NextResponse.json({
      status: 200,
      data: {
        createdJobIds,
        jobCount: createdJobIds.length,
      },
    });
  } catch (err) {
    console.error("[activate-job-template-manual] error:", err);
    return NextResponse.json({
      status: 500,
      error: err?.message ?? "Internal Server Error",
    });
  }
}
