import { JobItem } from "@/lib/models/JobItem"
import { connectToDb } from "../../mongo"
import { NextResponse } from "next/server"
import { JobTemplate } from "@/lib/models/JobTemplate"
import mongoose from "mongoose"
import { Job } from "@/lib/models/Job"

export const POST = async (req) => {
    const body = await req.json()
    const { user_id, year, month } = body
    try {
        await connectToDb()
        const jobItems = await Job.aggregate([{
            $match: {
                ACTIVATE_USER: mongoose.Types.ObjectId.createFromHexString(user_id),
            },
        }, {
            $lookup: {
                from: "jobitems",
                localField: "_id",
                foreignField: "JOB_ID",
                as: "job_items",
            },
        }, {
            $unwind: "$job_items"
        }, {
            $set: {
                "job_items.status_id": "$JOB_STATUS_ID"
            }
        }, {
            $replaceRoot: {
                newRoot: "$job_items"
            }
        }, {
            $match: {
                createdAt: {
                    $gte: new Date(year, month - 1, 1),
                    $lt: new Date(year, month, 1),
                },
            }
        }, {
            $lookup: {
                from: "status",
                localField: "status_id",
                foreignField: "_id",
                as: "status",
            }
        }, {
            $unwind: "$status"
        }, {
            $project: {
                _id: 0,
                id: "$_id",
                job_item_template_id: "$JOB_ITEM_TEMPLATE_ID",
                job_item_name: "$JOB_ITEM_NAME",
                upper: "$UPPER_SPEC",
                lower: "$LOWER_SPEC",
                actual_value: "$ACTUAL_VALUE",
                comment: "$COMMENT",
                created_at: "$createdAt",
                status: "$status.status_name",
                img_file: "$IMG_ATTACH"
            },
        }, {
            $sort: {
                create_at: -1
            }
        }, {
            $group: {
                _id: '$job_item_template_id',
                latest_job_item: { $first: '$$ROOT' } 
            }
        }, {
            $replaceRoot: {
                newRoot: "$latest_job_item"
            }
        }])
        return NextResponse.json({
            status: 200,
            job_items: jobItems
        })
    }
    catch(err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        })
    }
}