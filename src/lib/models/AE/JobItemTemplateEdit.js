import mongoose from "mongoose";

const jobItemTemplateEditSchema = new mongoose.Schema(
  {
    JOB_ITEM_TEMPLATE_ID: { type: String, required: true },
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
  },
  { timestamps: true }
);

export const JobItemTemplateEdit =
  mongoose.models?.JobItemTemplateEdit ||
  mongoose.model("JobItemTemplateEdit", jobItemTemplateEditSchema);
