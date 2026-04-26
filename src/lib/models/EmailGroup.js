import mongoose from "mongoose";

const EmailGroupSchema = new mongoose.Schema(
  {
    EMAIL_GROUP_NAME: { type: String, required: true },
    workgroup_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    USER_LIST: [
          { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);
// สร้าง unique compound index กันข้อมูลซ้ำใน workgroup เดียวกัน
EmailGroupSchema.index(
  { EMAIL_GROUP_NAME: 1, workgroup_id: 1 },
  { unique: true }
);
export const EmailGroup =
  mongoose.models?.EmailGroup || mongoose.model("EmailGroup", EmailGroupSchema);
