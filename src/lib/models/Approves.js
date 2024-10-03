import mongoose from "mongoose";

const approvesSchema = new mongoose.Schema(
  {
    JOB_TEMPLATE_ID: { type: String, required: true },
    JobTemplateCreateID: { type: String, required: true },
    USER_ID: { type: String, required: true },
  },
  { timestamps: true }
);

export const Approves =
  mongoose.models?.Approves || mongoose.model("Approves", approvesSchema);
