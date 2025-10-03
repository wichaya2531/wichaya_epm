
import { Job } from "@/lib/models/Job"
import mongoose from "mongoose"
import { NextResponse } from "next/server"

export const POST = async (req) => {
    const body = await req.json()
    const { user_id, start_date, end_date } = body
    console.log(user_id)
    try {
        // const job_data =await Job.find({
        //     ACTIVATE_USER: mongoose.Types.ObjectId.createFromHexString(user_id),
        // })
        
        const job_data = await Job.aggregate([{
            $match: {
                ACTIVATE_USER: mongoose.Types.ObjectId.createFromHexString(user_id),
                createdAt: {
                    $gte: new Date(start_date),
                    $lt: new Date(end_date),
                }
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
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            actual_value: "$$item.ACTUAL_VALUE",
                        }
                    }
                }
            }
        // }, {
        //     $unwind: "$items",
        // }, {
        //     $addFields: {
        //         created_at: "$createdAt"
        //     }
        // }, {
        //     $project: {
        //         _id: 0,
        //         // item_title: "$JOB_ITEM_TITLE",
        //         // item_name: "$JOB_ITEM_NAME",
        //         actual_value: "$items.ACTUAL_VALUE",

        //         created_at: "$createdAt",
        //     }
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