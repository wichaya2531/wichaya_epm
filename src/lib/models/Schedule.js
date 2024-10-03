import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    JOB_TEMPLATE_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobTemplate",
      required: true,
    },
    JOB_TEMPLATE_CREATE_ID: { type: String, required: true },
    JOB_TEMPLATE_NAME: { type: String, required: true },
    ACTIVATE_DATE: { type: Date, required: true },
    DOC_NUMBER: { type: String, required: true },
    STATUS: { type: String, default: "plan" },
    WORKGROUP_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workgroup",
      required: true,
    },
  },
  { timestamps: true }
);

export const Schedule =
  mongoose.models?.Schedule || mongoose.model("Schedule", scheduleSchema);
