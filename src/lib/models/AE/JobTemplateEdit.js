import mongoose from "mongoose";

const jobTemplateEditSchema = new mongoose.Schema(
  {
    JobTemplateCreateID: { type: String, required: true },
    JOB_TEMPLATE_ID: { type: String, required: true },
    JOB_TEMPLATE_NAME: { type: String, required: true },
    AUTHOR_ID: { type: String, required: true },
    DOC_NUMBER: { type: String, required: true },
    DUE_DATE: { type: Date, required: true },
    CHECKLIST_VERSION: { type: String, required: true },
    WORKGROUP_ID: { type: String, required: true },
    TIMEOUT: { type: String, required: true },
  },
  { timestamps: true }
);

export const JobTemplateEdit =
  mongoose.models?.JobTemplateEdit ||
  mongoose.model("JobTemplateEdit", jobTemplateEditSchema);
