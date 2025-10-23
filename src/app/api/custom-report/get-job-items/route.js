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
            $project: {
                _id: 0,
                id: "$_id",
                job_item_template_id: "$JOB_ITEM_TEMPLATE_ID",
                actual_value: "$ACTUAL_VALUE",
                comment: "$COMMENT",
                created_at: "$createdAt",
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
        // const jobItems = await JobTemplate.aggregate([{
        //     $addFields: {
        //         workgroup_obj_id: {
        //             $toObjectId: "$WORKGROUP_ID"
        //         }
        //     }
        // }, {
        //     $project: {
        //         workgroup_obj_id: 1,
        //     }
        // }, {
        //     $lookup: {
        //         from: "workgroups",
        //         let: { workgroupObjId: "$workgroup_obj_id" },
        //         pipeline: [
        //           { $match: { $expr: { $eq: ["$_id", "$$workgroupObjId"] } } },
        //           { $project: { _id: 1, USER_LIST: 1 } }
        //         ],
        //         as: "workgroup",
        //     },
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
        //     $lookup: {
        //         from: "jobitemtemplates",
        //         let: { jobTemplateId: "$_id" },
        //         pipeline: [{
        //             $match: {
        //                 $expr: {
        //                     $eq: [
        //                         "$JOB_TEMPLATE_ID",
        //                         "$$jobTemplateId"
        //                     ]
        //                 }
        //             }
        //         },{
        //             $project: {
        //                 _id: 1
        //             }
        //         }],
        //         as: "job_item_templates",
        //     },
        // }, {
        //     $unwind: "$job_item_templates"
        // }, {
        //     $replaceRoot: {
        //         newRoot: { job_item_templates_id: "$job_item_templates._id" }
        //     }
        // }, {
        //     $lookup: {
        //         from: "jobitems",
        //         let: { jobItemTemplateId: "$job_item_templates_id" },
        //         pipeline: [{
        //             $match: {
        //                 $expr: {
        //                     $eq: [
        //                         "$JOB_ITEM_TEMPLATE_ID",
        //                         "$$jobItemTemplateId"
        //                     ]
        //                 }
        //             }
        //         }, {
        //             $project: {
        //                 _id: 0,
        //                 id: "$_id",
        //                 actual_value: "$ACTUAL_VALUE",
        //                 comment: "$COMMENT",
        //                 created_at: "$createdAt"
        //             }
        //         }],
        //         as: "job_item"
        //     }
        // }, {
        //     $unwind: "$job_item"
        // }, {
        //     $replaceWith: {
        //         $mergeObjects: ["$$ROOT", "$job_item"]
        //     }
        // }, {
        //     $unset: "job_item"
        // }, {
        //     $match: {
        //         created_at: {
        //             $gte: new Date(year, month - 1, 1),
        //             $lt: new Date(year, month, 1),
        //         },
        //     },
        // }])
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