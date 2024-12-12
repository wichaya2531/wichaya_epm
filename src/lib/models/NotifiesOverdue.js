import mongoose from "mongoose";

const notifiesOverdueSchema = new mongoose.Schema(
  {
    JOB_TEMPLATE_ID: { type: String, required: true },
    JobTemplateCreateID: { type: String, required: true },
    USER_ID: { type: String, required: true },
  },
  { timestamps: true }
);

export const NotifiesOverdue =
  mongoose.models?.NotifiesOverdue ||
  mongoose.model("NotifiesOverdue", notifiesOverdueSchema);
