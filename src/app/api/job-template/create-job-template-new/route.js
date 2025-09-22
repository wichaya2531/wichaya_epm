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
    LINE_NAME="N/A",
    //DUE_DATE,
    CHECKLIST_VERSION,
    TIMEOUT,
    WORKGROUP_ID,
    APPROVERS_ID=[],
    NOTIFIES_ID=[],
    NOTIFIES_OVERDUE_ID=[],
    PICTURE_EVEDENT_REQUIRE=false,
    AGILE_SKIP_CHECK=true,
    SORT_ITEM_BY_POSITION=false,
    PUBLIC_EDIT_IN_WORKGROUP=false,
  } = body;

  const currentDate = new Date();
  const DUE_DATE = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));

 // console.log('body',body);

  // return NextResponse.json({ status: 200, message:"OK"});
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
      PICTURE_EVEDENT_REQUIRE,
      AGILE_SKIP_CHECK,
      SORT_ITEM_BY_POSITION,
      PUBLIC_EDIT_IN_WORKGROUP
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

    const notifiesOverdue = NOTIFIES_OVERDUE_ID.map((notifyOverdue) => ({
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
    console.error("Error creating job template:", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
