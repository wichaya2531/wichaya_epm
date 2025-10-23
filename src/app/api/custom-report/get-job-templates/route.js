import { JobItemTemplate } from "@/lib/models/JobItemTemplate"
import { JobTemplate } from "@/lib/models/JobTemplate"
import { Workgroup } from "@/lib/models/Workgroup"
import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { connectToDb } from "../../mongo"

export const POST = async (req) => {
    const body = await req.json()
    const { user_id } = body
    try {
        await connectToDb()
        const jobTemplates = await JobTemplate.aggregate([{
            $match: {
                AUTHOR_ID: user_id
            }
        }, {
            $project: {
                _id: 0,
                id: "$_id",
                name: "$JOB_TEMPLATE_NAME",
            }
        }, {
            $lookup: {
                from: "jobitemtemplates",
                localField: "id",
                foreignField: "JOB_TEMPLATE_ID",
                as: "job_item_templates",
                pipeline: [{
                    $project: {
                        _id: 0,
                        id: "$_id",
                        name: "$JOB_ITEM_TEMPLATE_NAME"
                    }
                }]
            }
        }])
        
        // const jobTemplates = await JobTemplate.aggregate([{
        //     $addFields: {
        //         workgroup_obj_id: {
        //             $toObjectId: "$WORKGROUP_ID"
        //         }
        //     }
        // }, {
        //     $lookup: {
        //         from: "workgroups",
        //         localField: "workgroup_obj_id",
        //         foreignField: "_id",
        //         as: "workgroup",
        //     }
        // }, {
        //     $unset: "workgroup_obj_id"
        // }, {
        //     $unwind: "$workgroup"
        // }, {
        //     $match: {
        //         "workgroup.USER_LIST": mongoose.Types.ObjectId.createFromHexString(user_id)
        //     }
        // }, {
        //     $unset: "workgroup"
        // }, {
        //     $project: {
        //         _id: 0,
        //         id: "$_id",
        //         name: "$JOB_TEMPLATE_NAME",
        //     }
        // }, {
        //     $lookup: {
        //         from: "jobitemtemplates",
        //         localField: "id",
        //         foreignField: "JOB_TEMPLATE_ID",
        //         as: "job_item_templates",
        //         pipeline: [{
        //             $project: {
        //                 _id: 0,
        //                 id: "$_id",
        //                 name: "$JOB_ITEM_TEMPLATE_NAME"
        //             }
        //         }]
        //     }
        // }])
        return NextResponse.json({
            status: 200,
            job_templates: jobTemplates
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