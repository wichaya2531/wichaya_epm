import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
  {
    ACTION_NAME: { type: String, required: true },
  },
  { timestamps: true }
);

export const Action =
  mongoose.models?.Action || mongoose.model("Action", actionSchema);
