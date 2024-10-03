import mongoose from "mongoose";

const JobItemSchema = new mongoose.Schema(
  {
    JOB_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    TEST_LOCATION_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestLocation",
      default: null,
    },
    JOB_ITEM_PICTURE_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobItemPicture",
      default: null,
    },

    ACTUAL_VALUE: { type: String, default: null },
    COMMENT: { type: String, default: null },
    JOB_ITEM_EXECUTE_DATE: { type: String, default: null },
    BEFORE_VALUE: { type: String, default: null },

    JOB_ITEM_TITLE: { type: String, required: true },
    JOB_ITEM_NAME: { type: String, required: true },
    UPPER_SPEC: { type: String, required: true },
    LOWER_SPEC: { type: String, required: true },
    TEST_METHOD: { type: String, required: true },
    TEST_LOCATION_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestLocation",
      required: true,
    },
    JOB_ITEM_TEMPLATE_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobItemTemplate",
      required: true,
    },
    REAL_TIME_VALUE: { type: String, default: "None" },
    FILE: { type: String, default: null },
  },
  { timestamps: true }
);

export const JobItem =
  mongoose.models?.JobItem || mongoose.model("JobItem", JobItemSchema);
