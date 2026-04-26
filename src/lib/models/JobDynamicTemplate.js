import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
    // width: {
    //     type: Number,
    //     required: false,
    // },
    // _id: false,
})

const rowSchema = new mongoose.Schema({
    // height: {
    //     type: Number,
    //     required: false,
    // },
    // _id: false,
})

const ColorSchema = new mongoose.Schema({
    r: {
        type: Number,
        required: true,
    },
    g: {
        type: Number,
        required: true,
    },
    b: {
        type: Number,
        required: true,
    },
    a: {
        type: Number,
        required: true,
    },
})

const BorderStyleSchema = new mongoose.Schema({
    width: {
        type: Number,
        required: true,
    },
    style: {
        type: String,
        required: true,
    },
    color: {
        type: ColorSchema,
        required: true,
    },
})

const BorderSchema = new mongoose.Schema({
    top: {
        type: BorderStyleSchema,
        required: false,
    },
    right: {
        type: BorderStyleSchema,
        required: false,
    },
    bottom: {
        type: BorderStyleSchema,
        required: false,
    },
    left: {
        type: BorderStyleSchema,
        required: false,
    },
})

const StyleSchema = new mongoose.Schema({
    font_size: {
        type: Number,
        required: false,
    },
    text_bold: {
        type: Boolean,
        required: false,
    },
    text_align: {
        type: String,
        required: false,
    },
    text_vertical_align: {
        type: String,
        required: false,
    },
    background_color: {
        type: ColorSchema,
        required: false,
    },
    font_color: {
        type: ColorSchema,
        required: false,
    },
    border: {
        type: BorderSchema,
        required: false,
    },
})

const CoordinateSchema = new mongoose.Schema({
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
})

const cellSchema = new mongoose.Schema({
    value: {
        type: String,
        required: false,
    },
    style: {
        type: StyleSchema,
        required: false,
    },
    from: {
        type: CoordinateSchema,
        required: false,
    },
    expand_x: {
        type: Number,
        required: false,
    },
    expand_y: {
        type: Number,
        required: false,
    },
})

const jobDynamicTemplateSchema = new mongoose.Schema({
    cells: {
        type: [[cellSchema]],
        required: true,
    },
    cols_width: {
        type: [Number],
    },
    rows_height: {
        type: [Number],
    },
}, {
    timestamps: true
});

export const JobDynamicTemplate =
  mongoose.models?.JobDynamicTemplate ||
  mongoose.model("JobDynamicTemplate", jobDynamicTemplateSchema);
