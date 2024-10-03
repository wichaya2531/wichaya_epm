import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    TITLE: { type: String, required: true },
    DETAIL: { type: String, default: "" },
    //array of objects
    LINK: { type: Array, default: [] },
    ACTION_LIST: { type: Array, default: [] },
    LOGO_PATH: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Card = mongoose.models?.Card || mongoose.model("Card", cardSchema);
