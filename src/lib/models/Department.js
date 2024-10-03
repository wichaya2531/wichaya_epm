import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    DEPARTMENT_NAME: { type: String, required: true },
    USER_LIST: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);

export const Department =
  mongoose.models?.Department || mongoose.model("Department", departmentSchema);
