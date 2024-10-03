import { generateUniqueKey } from "@/lib/utils/utils";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { JobTemplateEdit } from "@/lib/models/AE/JobTemplateEdit";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { Approves } from "@/lib/models/Approves";
import { Notifies } from "@/lib/models/Notifies";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, res) => {
  await connectToDb();

  //console.log("<= use edit job template => ");

  const body = await req.json();
  const {
    jobTemplateID,
    author,
    workgroup,
    due_date,
    line_name,
    job_template_name,
    doc_num,
    checklist_ver,
    timeout,
    approvers_id,
    notifies_id,
  } = body;

  try {
    const JobTemplateCreateID = await generateUniqueKey();
    const jobTemplate = await JobTemplate.findById(jobTemplateID);
    const jobTemplateEdit = new JobTemplateEdit({
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
      JOB_TEMPLATE_ID: jobTemplate._id,
      JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
      AUTHOR_ID: jobTemplate.AUTHOR_ID,
      DOC_NUMBER: jobTemplate.DOC_NUMBER,
      LINE_NAME: jobTemplate.LINE_NAME,
      DUE_DATE: jobTemplate.DUE_DATE,
      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
      TIMEOUT: jobTemplate.TIMEOUT,
    });
    //console.log("jobTemplateEdit", jobTemplateEdit)
    await jobTemplateEdit.save();

    //update job template
    jobTemplate.JOB_TEMPLATE_NAME = job_template_name;
    jobTemplate.AUTHOR_ID = author;
    jobTemplate.DOC_NUMBER = doc_num;
    jobTemplate.DUE_DATE = due_date;
    jobTemplate.LINE_NAME = line_name;
    jobTemplate.CHECKLIST_VERSION = checklist_ver;
    jobTemplate.WORKGROUP_ID = workgroup;
    jobTemplate.TIMEOUT = timeout;
    jobTemplate.JobTemplateCreateID = JobTemplateCreateID;

    await jobTemplate.save();
    // console.log("Updated jobTemplate:", jobTemplate);
    const newApprovers = approvers_id.map((approver_id) => {
      return new Approves({
        JOB_TEMPLATE_ID: jobTemplate._id,
        JobTemplateCreateID: JobTemplateCreateID,
        USER_ID: approver_id,
      });
    });

    await Approves.insertMany(newApprovers);

    const newNotifies = notifies_id.map((notify_id) => {
      return new Notifies({
        JOB_TEMPLATE_ID: jobTemplate._id,
        JobTemplateCreateID: JobTemplateCreateID,
        USER_ID: notify_id,
      });
    });

    await Notifies.insertMany(newNotifies);

    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: jobTemplateID,
    });

    if (jobItemTemplates.length > 0) {
      const updatePromises = jobItemTemplates.map(async (template) => {
        template.JobTemplateCreateID = jobTemplate.JobTemplateCreateID;
        return template.save();
      });

      await Promise.all(updatePromises);
      console.log("JobItemTemplates updated successfully.");
    } else {
      console.log(
        "No JobItemTemplates found with the specified JOB_TEMPLATE_ID."
      );
    }

    return NextResponse.json({ status: 200, jobTemplateEdit });
  } catch (err) {
    console.log("Edit Error=>", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
