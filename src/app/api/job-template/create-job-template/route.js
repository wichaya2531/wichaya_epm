import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { NextResponse } from "next/server.js";
import { Approves } from "@/lib/models/Approves.js";
import { Notifies } from "@/lib/models/Notifies";
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

    const approvers = APPROVERS_ID.map((approver) => {
      return new Approves({
        JOB_TEMPLATE_ID: jobTemplate._id,
        JobTemplateCreateID,
        USER_ID: approver,
      });
    });
    await Approves.insertMany(approvers);

    const notifies = NOTIFIES_ID.map((notify) => {
      return new Notifies({
        JOB_TEMPLATE_ID: jobTemplate._id,
        JobTemplateCreateID,
        USER_ID: notify,
      });
    });
    await Notifies.insertMany(notifies);

    return NextResponse.json({ status: 200, jobTemplate });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
