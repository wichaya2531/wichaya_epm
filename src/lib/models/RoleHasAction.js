import mongoose from "mongoose";

const roleHasActionSchema = new mongoose.Schema({
  ROLE_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  ACTION_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Action",
    required: true,
  },
});

export const RoleHasAction =
  mongoose.models?.RoleHasAction ||
  mongoose.model("RoleHasAction", roleHasActionSchema);
