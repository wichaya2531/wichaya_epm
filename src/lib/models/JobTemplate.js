import mongoose from "mongoose";

const jobTemplateSchema = new mongoose.Schema(
  {
    JobTemplateCreateID: { type: String, required: true },
    JOB_TEMPLATE_NAME: { type: String, required: true },
    AUTHOR_ID: { type: String, required: true },
    DOC_NUMBER: { type: String, required: true },
    LINE_NAME: { type: String, required: true },
    DUE_DATE: { type: Date, required: true },
    CHECKLIST_VERSION: { type: String, required: true },
    WORKGROUP_ID: { type: String, required: true },
    TIMEOUT: { type: String, required: true },
    PICTURE_EVEDENT_REQUIRE: { type: Boolean, required: false },    
    AGILE_SKIP_CHECK: { type: Boolean, required: false },    
    SORT_ITEM_BY_POSITION:{ type: Boolean, default: false },
    PUBLIC_EDIT_IN_WORKGROUP:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

export const JobTemplate =
  mongoose.models?.JobTemplate ||
  mongoose.model("JobTemplate", jobTemplateSchema);
