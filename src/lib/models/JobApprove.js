import mongoose from "mongoose";
import { jobSchema } from "./Job"; // Ensure the correct path to the Job schema

const jobApprovesSchema = new mongoose.Schema(
  {
    JOB: { type: jobSchema, required: true },
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    IS_APPROVE: { type: Boolean, required: true },
    COMMENT: { type: String, default: null },
  },
  { timestamps: true }
);

export const JobApproves =
  mongoose.models?.JobApproves ||
  mongoose.model("JobApproves", jobApprovesSchema);
