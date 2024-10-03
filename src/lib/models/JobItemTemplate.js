import mongoose from "mongoose";

const jobItemTemplateSchema = new mongoose.Schema(
  {
    AUTHOR_ID: { type: String, required: true },
    JOB_ITEM_TEMPLATE_TITLE: { type: String, required: true },
    JOB_ITEM_TEMPLATE_NAME: { type: String, required: true },
    UPPER_SPEC: { type: String, required: true },
    LOWER_SPEC: { type: String, required: true },
    TEST_METHOD: { type: String, required: true },

    JOB_TEMPLATE_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobTemplate",
      required: true,
    },
    TEST_LOCATION_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestLocation",
      required: true,
    },

    JobTemplateCreateID: { type: String, required: true },
    JobItemTemplateCreateID: { type: String, required: true },
    FILE: { type: String, default: null },
  },
  { timestamps: true }
);

export const JobItemTemplate =
  mongoose.models?.JobItemTemplate ||
  mongoose.model("JobItemTemplate", jobItemTemplateSchema);
