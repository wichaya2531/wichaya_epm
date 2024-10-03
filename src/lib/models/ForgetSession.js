import mongoose from "mongoose";

const forgetSessionSchema = new mongoose.Schema(
  {
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const ForgetSession =
  mongoose.models?.ForgetSession ||
  mongoose.model("ForgetSession", forgetSessionSchema);

export { ForgetSession, forgetSessionSchema };
