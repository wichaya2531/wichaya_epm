import {connectToDb} from "@/app/api/mongo";
import {CustomReportProfile} from "@/lib/models/CustomReportProfile";
import {CustomReportTable} from "@/lib/models/CustomReportTable";
import {NextResponse} from "next/server";
import mongoose from "mongoose";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { profile_id } = body
    try {
        const profile_tables = await CustomReportProfile.aggregate([{
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(profile_id),
            }
        }, {
            $unwind: "$custom_report_table_ids"
        }, {
            $project: {
                _id: 0,
                id: "$custom_report_table_ids"
            }
        }, {
            $lookup: {
                from: "customreporttables",
                localField: "id",
                foreignField: "_id",
                as: "table",
            }
        }, {
            $project: {
                table: 1
            }
        }, {
            $unwind: "$table"
        }, {
            $replaceRoot: {
                newRoot: "$table"
            }
        }, {
            $project: {
                _id: 0,
                id: "$_id",
                cells: 1,
                cols_width: 1,
                rows_height: 1,
                merged_cells: 1,
                position: 1,
            }
        }])
        return NextResponse.json({
            profile_tables,
            status: 200,
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
