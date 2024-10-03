import mongoose from "mongoose";

const testLocationSchema = new mongoose.Schema(
  {
    LocationName: { type: String, required: true },
    LocationTitle: { type: String, required: true },
  },
  { timestamps: true }
);

export const TestLocation =
  mongoose.models?.TestLocation ||
  mongoose.model("TestLocation", testLocationSchema);
