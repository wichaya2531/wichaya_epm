import mongoose from "mongoose";

const selectLineNameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.SelectLineName ||
  mongoose.model("SelectLineName", selectLineNameSchema);
