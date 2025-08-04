import mongoose from "mongoose";
import { userSchema } from "./User";

const jobSchema = new mongoose.Schema(
  {
    REVIEWS: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApproves",
      default: null,
    },
    WD_TAG: { type: String, default: null },
    JOB_STATUS_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },
    JOB_APPROVERS: { type: Array, required: true },
    OVERDUE_NOTIFYS: { type: Array, required: false },
    DISAPPROVE_REASON:{ type: String, required: false }, // เก็บ ข้อความ ตอบกลับ ในกรณีที่มีการ ให้ ทำ Checklist นั้น ใหม่    
    JOB_NAME: { type: String, required: true },
    DOC_NUMBER: { type: String, required: true },
    LINE_NAME: { type: String, required: true },
    CHECKLIST_VERSION: { type: String, required: true },
    WORKGROUP_ID: { type: String, required: true },
    ACTIVATE_USER: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    TIMEOUT: { type: String, required: true },
    SUBMITTED_BY: { type: userSchema, default: null },
    REVIEW_USER: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    SUBMITTED_DATE: { type: Date, default: null },
    IMAGE_FILENAME: { type: String, default: null }, // image for evident before
    OVERDUE_ACK:{ type: String, required: false },
    IMAGE_FILENAME_2: { type: String, default: null }, //// image for evident after
    PICTURE_EVEDENT_REQUIRE:{ type: Boolean, default: false },
    AGILE_SKIP_CHECK:{ type: Boolean, default: false },
    SORT_ITEM_BY_POSITION:{ type: Boolean, default: false },
    VALUE_ITEM_ABNORMAL: { type: Number, default: 0 },
    PUBLIC_EDIT_IN_WORKGROUP:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

const Job = mongoose.models?.Job || mongoose.model("Job", jobSchema);

export { Job, jobSchema };
