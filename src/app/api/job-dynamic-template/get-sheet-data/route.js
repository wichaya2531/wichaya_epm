import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobDynamic } from "@/lib/models/JobDynamic";
import { JobDynamicTemplate } from "@/lib/models/JobDynamicTemplate";
import mongoose from "mongoose";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { spreadsheet_id } = body
    try {
        const sheet = await JobDynamicTemplate.findById(spreadsheet_id)
        const { cells, cols_width, rows_height } = sheet
        return NextResponse.json({
            status: 200,
            spreadsheet: {
                cells,
                cols_width,
                rows_height,
            }
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};