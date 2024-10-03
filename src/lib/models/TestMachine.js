import mongoose from "mongoose";

const testMachineSchema = new mongoose.Schema({
  JOB_TEMPLATE_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobTemplate",
    required: true,
  },
  MACHINE_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true,
  },
});

export const TestMachine =
  mongoose.models?.TestMachine ||
  mongoose.model("TestMachine", testMachineSchema);
