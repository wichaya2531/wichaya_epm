import mongoose from "mongoose";

// สร้าง Schema
const emailStackerSchema = new mongoose.Schema(
  {
    EMAIL_SUBJECT: { type: String, default: null },
    EMAIL_TO: { type: String, default: null },
    EMAIL_CC: { type: String, default: null },
    EMAIL_BODY: { type: String, required: false },
    EMAIL_SENDER: { type: String, required: false },
    SENT_STATUS: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// สร้าง Model ชื่อ EmailStack
export const EmailStack = mongoose.models.EmailStack || mongoose.model("EmailStack", emailStackerSchema);
