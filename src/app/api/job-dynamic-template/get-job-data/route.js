
import { Job } from "@/lib/models/Job"
import mongoose from "mongoose"
import { NextResponse } from "next/server"

export const POST = async (req) => {
    const body = await req.json()
    const { user_id, start_date, end_date } = body
    try {
        const job_data = await Job.aggregate([{
            $match: {
                ACTIVATE_USER: mongoose.Types.ObjectId.createFromHexString(user_id),
                createdAt: {
                    $gte: new Date(start_date),
                    $lt: new Date(end_date),
                },
            },
        }, {
            $lookup: {
                from: "jobitems",
                localField: "_id",
                foreignField: "JOB_ID",
                as: "items",
            },
        }, {
            $project: {
                _id: 0,
                created_at: "$createdAt",
                wd_tag: "$WD_TAG",
                workgroup_id: "$WORKGROUP_ID",
                line_name: "$LINE_NAME",
                job_name: "$JOB_NAME",
                doc_number: "$DOC_NUMBER",
                items: 1,
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            actual_value: "$$item.ACTUAL_VALUE",
                        },
                    },
                },
            },
        },])
        return NextResponse.json({
            status: 200,
            job_data,
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