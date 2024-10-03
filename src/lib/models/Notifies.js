import mongoose from "mongoose";

const notifiesSchema = new mongoose.Schema(
  {
    JOB_TEMPLATE_ID: { type: String, required: true },
    JobTemplateCreateID: { type: String, required: true },
    USER_ID: { type: String, required: true },
  },
  { timestamps: true }
);

export const Notifies =
  mongoose.models?.Notifies || mongoose.model("Notifies", notifiesSchema);
