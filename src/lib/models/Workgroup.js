import mongoose from "mongoose";

const workgroupSchema = new mongoose.Schema(
  {
    WORKGROUP_NAME: { type: String, required: true },
    USER_LIST: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);

export const Workgroup =
  mongoose.models?.Workgroup || mongoose.model("Workgroup", workgroupSchema);
