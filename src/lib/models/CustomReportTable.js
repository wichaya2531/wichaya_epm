import mongoose from "mongoose";

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
}, {
    _id: false,
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
}, {
    _id: false,
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
}, {
    _id: false,
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
    rotate: {
        type: Number,
        required: false,
    }
}, {
    _id: false,
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
}, {
    _id: false,
})

const CellSchema = new mongoose.Schema({
    value: {
        type: String,
        required: false,
    },
    style: {
        type: StyleSchema,
        required: false,
    },
    image_id: {
        type: String,
        required: false,
    },
}, {
    _id: false,
})

const MergedCellsSchema = new mongoose.Schema({
    start: {
        type: CoordinateSchema,
        required: true,
    },
    end: {
        type: CoordinateSchema,
        required: true,
    },
}, {
    _id: false,
})

const customReportTableSchema = new mongoose.Schema({
    cells: {
        type: [[CellSchema]],
        required: true,
    },
    cols_width: {
        type: [Number],
        required: true,
    },
    rows_height: {
        type: [Number],
        required: true,
    },
    merged_cells: {
        type: [MergedCellsSchema],
        required: true,
    },
    position: {
        type: CoordinateSchema,
        required: true,
    },
}, {
    timestamps: true
});

export const CustomReportTable =
    mongoose.models?.CustomReportTable ||
    mongoose.model("CustomReportTable", customReportTableSchema);
