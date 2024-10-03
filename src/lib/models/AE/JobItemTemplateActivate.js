import mongoose from "mongoose";

const jobItemTemplateAcitvateSchema = new mongoose.Schema(
  {
    JOB_ITEM_TEMPLATE_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobItemTemplate",
      required: true,
    },
    JobItemTemplateCreateID: { type: String, required: true },
    JOB_ITEM_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobItem",
      required: true,
    },
  },
  { timestamps: true }
);

export const JobItemTemplateActivate =
  mongoose.models?.JobItemTemplateActivate ||
  mongoose.model("JobItemTemplateActivate", jobItemTemplateAcitvateSchema);
