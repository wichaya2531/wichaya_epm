import mongoose from "mongoose";
import { JobDynamicTemplate } from "./JobDynamicTemplate";

const jobDynamicSchema = new mongoose.Schema(
    {
        USER_ID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        spreadsheet_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobDynamicTemplate",
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true
    },
);

export const JobDynamic =
  mongoose.models?.JobDynamic ||
  mongoose.model("JobDynamic", jobDynamicSchema);
