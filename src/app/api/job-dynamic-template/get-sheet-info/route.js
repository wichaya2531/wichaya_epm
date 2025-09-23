import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import mongoose from "mongoose";
import { JobDynamic } from "@/lib/models/JobDynamic";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { user_id } = body
    try {
        const infos = await JobDynamic.find({ USER_ID: user_id })
        const spreadsheets = infos.map(info=>({
            id: info.spreadsheet_id,
            name: info.name,
        }))
        return NextResponse.json({ status: 200, spreadsheets });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};