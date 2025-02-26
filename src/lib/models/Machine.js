import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    WD_TAG: { type: String, required: true },
    MACHINE_NAME: { type: String, required: true },
    created_by: { type: String, required: true },
    workgroup: { type: String, required: true },
  },
  { timestamps: true }
);

export const Machine =
  mongoose.models?.Machine || mongoose.model("Machine", machineSchema);
