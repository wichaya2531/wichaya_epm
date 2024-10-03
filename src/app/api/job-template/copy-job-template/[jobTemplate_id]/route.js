import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server.js";
import { Approves } from "@/lib/models/Approves.js";
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const GET = async (req, { params }) => {
  await connectToDb();

  const { jobTemplate_id } = params;
  //console.log("jobTemplate_id",jobTemplate_id);
  const jobTemplates = await JobTemplate.findOne({ _id: jobTemplate_id });
  //console.log("Data jobTemplates",jobTemplates);

  try {
    const JobTemplateCreateID_buffer = await generateUniqueKey();
    const jobTemplate = new JobTemplate({
      AUTHOR_ID: jobTemplates.AUTHOR_ID,
      JOB_TEMPLATE_NAME: jobTemplates.JOB_TEMPLATE_NAME + " Copy",
      DOC_NUMBER: jobTemplates.DOC_NUMBER,
      LINE_NAME: jobTemplates.LINE_NAME,
      DUE_DATE: jobTemplates.DUE_DATE,
      CHECKLIST_VERSION: jobTemplates.CHECKLIST_VERSION,
      TIMEOUT: jobTemplates.TIMEOUT,
      WORKGROUP_ID: jobTemplates.WORKGROUP_ID,
      JobTemplateCreateID: JobTemplateCreateID_buffer,
    });

    await jobTemplate.save();
    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: jobTemplates._id,
    });
    for (const item of jobItemTemplates) {
      const jobItemTemplate = new JobItemTemplate({
        AUTHOR_ID: item.AUTHOR_ID,
        JOB_ITEM_TEMPLATE_TITLE: item.JOB_ITEM_TEMPLATE_TITLE,
        JOB_ITEM_TEMPLATE_NAME: item.JOB_ITEM_TEMPLATE_NAME,
        UPPER_SPEC: item.UPPER_SPEC,
        LOWER_SPEC: item.LOWER_SPEC,
        TEST_METHOD: item.TEST_METHOD,
        JOB_TEMPLATE_ID: jobTemplate._id,
        TEST_LOCATION_ID: item.TEST_LOCATION_ID,
        JobTemplateCreateID: JobTemplateCreateID_buffer,
        JobItemTemplateCreateID: await generateUniqueKey(),
        FILE: item.FILE,
      });

      await jobItemTemplate.save();
    }
    //console.log("Data jobItemTemplates",jobItemTemplates);
    return NextResponse.json({ status: 200, message: "Copy Job Template" });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
