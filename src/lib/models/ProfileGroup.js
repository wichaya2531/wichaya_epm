import mongoose from "mongoose";

const ProfileGroupSchema = new mongoose.Schema(
  {
    PROFILE_NAME: { type: String, required: true },
    workgroup_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    USER_LIST: [
          { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);
// สร้าง unique compound index กันข้อมูลซ้ำใน workgroup เดียวกัน
ProfileGroupSchema.index(
  { PROFILE_NAME: 1, workgroup_id: 1 },
  { unique: true }
);
export const ProfileGroup =
  mongoose.models?.ProfileGroup || mongoose.model("ProfileGroup", ProfileGroupSchema);
