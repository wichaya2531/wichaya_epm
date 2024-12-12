import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { NextResponse } from "next/server.js";
import { Approves } from "@/lib/models/Approves.js";
import { Notifies } from "@/lib/models/Notifies";
import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
  await connectToDb();
  const JobTemplateCreateID = await generateUniqueKey();
  const body = await req.json();
  const {
    AUTHOR_ID,
    JOB_TEMPLATE_NAME,
    DOC_NUMBER,
    LINE_NAME,
    DUE_DATE,
    CHECKLIST_VERSION,
    TIMEOUT,
    WORKGROUP_ID,
    APPROVERS_ID,
    NOTIFIES_ID,
    NOTIFIES_OVERDUE_ID,
  } = body;
  try {
    const jobTemplate = new JobTemplate({
      AUTHOR_ID,
      JOB_TEMPLATE_NAME,
      DOC_NUMBER,
      LINE_NAME,
      DUE_DATE,
      CHECKLIST_VERSION,
      TIMEOUT,
      WORKGROUP_ID,
      JobTemplateCreateID,
    });

    await jobTemplate.save();

    // สร้างข้อมูลสำหรับ Approves, Notifies, NotifiesOverdue
    const approvers = APPROVERS_ID.map((approver) => ({
      JOB_TEMPLATE_ID: jobTemplate._id,
      JobTemplateCreateID,
      USER_ID: approver,
    }));

    const notifies = NOTIFIES_ID.map((notify) => ({
      JOB_TEMPLATE_ID: jobTemplate._id,
      JobTemplateCreateID,
      USER_ID: notify,
    }));

    const notifiesOverdue = NOTIFIES_ID.map((notifyOverdue) => ({
      JOB_TEMPLATE_ID: jobTemplate._id,
      JobTemplateCreateID,
      USER_ID: notifyOverdue,
    }));

    // บันทึกข้อมูลพร้อมกันโดยใช้ Promise.all
    await Promise.all([
      Approves.insertMany(approvers),
      Notifies.insertMany(notifies),
      NotifiesOverdue.insertMany(notifiesOverdue),
    ]);

    return NextResponse.json({ status: 200, jobTemplate });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
