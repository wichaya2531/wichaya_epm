import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  status_name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
});

export const Status =
  mongoose.models?.Status || mongoose.model("Status", statusSchema);
