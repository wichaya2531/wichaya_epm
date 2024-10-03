import mongoose from "mongoose";

const JobTemplateActivateSchema = new mongoose.Schema(
  {
    JobTemplateID: { type: mongoose.Schema.Types.ObjectId, ref: "JobTemplate" },
    JobTemplateCreateID: { type: String, required: true },
    JOB_ID: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    RECURRING_TYPE: { type: String, default: null },
  },
  { timestamps: true }
);

export const JobTemplateActivate =
  mongoose.models?.JobTemplateActivate ||
  mongoose.model("JobTemplateActivate", JobTemplateActivateSchema);
