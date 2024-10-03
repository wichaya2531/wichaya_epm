import { NextResponse } from "next/server.js";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Approves } from "@/lib/models/Approves.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { sendEmails } from "@/lib/utils/utils";
import { Workgroup } from "@/lib/models/Workgroup";
import { User } from "@/lib/models/User";

export const POST = async (req) => {
  console.log("Activate Job Template Manual with new line name");
  await connectToDb();
  const body = await req.json();
  const { JobTemplateID, LINE_NAME, ACTIVATER_ID, JobTemplateCreateID } = body;

  try {
    // 1. Find job template
    const jobTemplate = await JobTemplate.findOne({
      _id: JobTemplateID,
      JobTemplateCreateID: JobTemplateCreateID,
    });

    if (!jobTemplate) {
      return NextResponse.json({
        status: 404,
        error: "Job template not found",
      });
    }

    // 2. Find approvers
    const approvers = await Approves.find({
      JOB_TEMPLATE_ID: JobTemplateID,
      JobTemplateCreateID: JobTemplateCreateID,
    });

    if (!approvers) {
      return NextResponse.json({
        status: 404,
        error: "Approvers not found",
      });
    }

    const newID = await Status.findOne({ status_name: "new" });
    if (!newID) {
      return NextResponse.json({
        status: 404,
        error: "Status not found",
      });
    }

    // 3. Create job with new LINE_NAME
    const job = new Job({
      JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
      JOB_STATUS_ID: newID._id,
      DOC_NUMBER: jobTemplate.DOC_NUMBER,
      LINE_NAME: LINE_NAME, // ใช้ LINE_NAME ใหม่ที่ส่งมา
      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
      ACTIVATE_USER: ACTIVATER_ID,
      JOB_APPROVERS: approvers.map((approver) => approver.USER_ID),
      TIMEOUT: jobTemplate.TIMEOUT,
    });

    await job.save();

    // 4. Update to job template activate
    const jobTemplateActivate = new JobTemplateActivate({
      JobTemplateID: jobTemplate._id,
      JobTemplateCreateID: JobTemplateCreateID,
      JOB_ID: job._id,
    });
    await jobTemplateActivate.save();

    // 5. Create job items based on job item templates
    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: JobTemplateID,
    });

    await Promise.all(
      jobItemTemplates.map(async (jobItemTemplate) => {
        const jobItem = new JobItem({
          JOB_ID: job._id,
          JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
          JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
          UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
          LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
          TEST_METHOD: jobItemTemplate.TEST_METHOD,
          TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
          JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
          FILE: jobItemTemplate.FILE,
          createdAt: jobItemTemplate.createdAt,
        });

        await jobItem.save();

        // Update the job item activate records
        const jobItemActivate = new JobItemActivate({
          JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
          JOB_ID: job._id,
          JOB_ITEM_ID: jobItem._id,
        });

        await jobItemActivate.save();
      })
    );

    return NextResponse.json({
      status: 200,
      message: "Job created successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: 500,
      error: "Internal server error",
    });
  }
};
