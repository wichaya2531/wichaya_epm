import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { NextResponse } from "next/server";
import { Machine } from "@/lib/models/Machine";
import { Approves } from "@/lib/models/Approves";
import { Notifies } from "@/lib/models/Notifies";
import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { User } from "@/lib/models/User";
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = "force-dynamic";
export const GET = async (req, { params }) => {
  await connectToDb();
  const { jobTemplate_id } = params;

  try {
    // Fetch JobTemplate
    const jobTemplate = await JobTemplate.findById(jobTemplate_id);

    // Fetch Machine
    const machines = await Machine.find({ _id: jobTemplate.MACHINE_ID });
    const machineName = machines.length > 0 ? machines[0].MACHINE_NAME : null;
    const createdAt = new Date(jobTemplate.createdAt).toLocaleString();

    // Fetch Approvers

    //console.log('jobTemplate_id',jobTemplate_id);
    //console.log('jobTemplate.JobTemplateCreateID',jobTemplate.JobTemplateCreateID);
    const approvers = await Approves.find({
      JOB_TEMPLATE_ID: jobTemplate_id,
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
    });

    //console.log('approvers',approvers);

    const notifier = await Notifies.find({
      JOB_TEMPLATE_ID: jobTemplate_id /*,
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID, */
    });


    const notifierOverdue = await NotifiesOverdue.find({
      JOB_TEMPLATE_ID: jobTemplate_id/*,
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID,*/
    });

    //console.log("notifierOverdue",notifierOverdue);

    const approversUserID = approvers.map((approver) => approver.USER_ID);
    const usersApprove = await Promise.all(
      approversUserID.map(async (approver) => {
        const user = await User.findOne({ _id: approver });
        return user;
      })
    );

    const notifierUserID = notifier.map((notifier) => notifier.USER_ID);
    const usersNotifier = await Promise.all(
      notifierUserID.map(async (notifier) => {
        const user = await User.findOne({ _id: notifier });
        return user;
      })
    );

    const notifierOverdueUserID = notifierOverdue.map(
      (notifierOverdue) => notifierOverdue.USER_ID
    );
    const usersNotifierOverdue = await Promise.all(
      notifierOverdueUserID.map(async (notifierOverdue) => {
        const user = await User.findOne({ _id: notifierOverdue });
        return user;
      })
    );

    //console.log("Notify user", usersNotifier);

    // Fetch Notifies
    // const notifies = await Notifies.find({
    //   JOB_TEMPLATE_ID: jobTemplate_id,
    //   JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
    // });
    // const notifiesUserID = notifies.map((notify) => notify.USER_ID);
    // const notifyUsers = await Promise.all(
    //   notifiesUserID.map(async (notify) => {
    //     const user = await User.findById(notify.USER_ID);
    //     return user;
    //   })
    // );

    // const data = {
    //   _id: jobTemplate._id,
    //   JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
    //   AUTHOR_ID: jobTemplate.AUTHOR_ID,
    //   JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
    //   DOC_NUMBER: jobTemplate.DOC_NUMBER,
    //   LINE_NAME: jobTemplate.LINE_NAME,
    //   DUE_DATE: jobTemplate.DUE_DATE,
    //   CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
    //   MACHINE_ID: jobTemplate.MACHINE_ID,
    //   MACHINE_NAME: machineName,
    //   WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
    //   JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
    //   TIMEOUT: jobTemplate.TIMEOUT,
    //   createdAt: createdAt,
    //   ApproverList: usersApprove,
    //   NotifyList: usersNotifier,
    //   NotifyOverdueList: usersNotifierOverdue,
    //   PICTURE_EVEDENT_REQUIRE:jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
    //   AGILE_SKIP_CHECK:jobTemplate.AGILE_SKIP_CHECK || false,
    //   SORT_ITEM_BY_POSITION:jobTemplate.SORT_ITEM_BY_POSITION || false
    // };
      const data = {
        _id: jobTemplate._id,
        JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
        AUTHOR_ID: jobTemplate.AUTHOR_ID,
        JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
        DOC_NUMBER: jobTemplate.DOC_NUMBER,
        LINE_NAME: jobTemplate.LINE_NAME,
        DUE_DATE: jobTemplate.DUE_DATE,
        CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
        MACHINE_ID: jobTemplate.MACHINE_ID,
        MACHINE_NAME: machineName,
        WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
        TIMEOUT: jobTemplate.TIMEOUT,
        TYPE: jobTemplate.TYPE || "Null",
        createdAt: createdAt,
        ApproverList: (usersApprove || []).filter(Boolean),
        NotifyList: (usersNotifier || []).filter(Boolean),
        NotifyOverdueList: (usersNotifierOverdue || []).filter(Boolean),
        PICTURE_EVEDENT_REQUIRE: jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
        AGILE_SKIP_CHECK: jobTemplate.AGILE_SKIP_CHECK || false,
        SORT_ITEM_BY_POSITION: jobTemplate.SORT_ITEM_BY_POSITION || false,
        PUBLIC_EDIT_IN_WORKGROUP:jobTemplate.PUBLIC_EDIT_IN_WORKGROUP || false,
      };
    //console.log('data',data);
    return NextResponse.json({ status: 200, jobTemplate: data });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
