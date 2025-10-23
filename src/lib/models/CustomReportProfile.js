import mongoose from "mongoose";

const customReportProfileSchema = new mongoose.Schema({
    USER_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    custom_report_table_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "CustomReportTable",
        required: true
    },
    width: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true
});

export const CustomReportProfile =
    mongoose.models?.CustomReportProfile ||
    mongoose.model("CustomReportProfile", customReportProfileSchema);
