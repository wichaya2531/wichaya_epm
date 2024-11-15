import { connectToDb } from "@/app/api/mongo/index";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const GET = async (req, res) => {
  try {
    await connectToDb();
    const jobValues = await User.aggregate([
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "ACTIVATE_USER",
          as: "jobs",
        },
      },
      {
        $unwind: {
          path: "$jobs",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "jobitems",
          localField: "jobs._id",
          foreignField: "JOB_ID",
          as: "jobItems",
        },
      },
      {
        $unwind: {
          path: "$jobItems",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "workgroups",
          let: { workgroupId: "$jobs.WORKGROUP_ID" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$workgroupId" }],
                },
              },
            },
            {
              $project: {
                WORKGROUP_NAME: 1,
              },
            },
          ],
          as: "workgroupInfo",
        },
      },
      {
        $unwind: {
          path: "$workgroupInfo",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "jobItems.ACTUAL_VALUE": { $ne: null },
          "jobItems.createdAt": { $ne: null },
          "jobs.LINE_NAME": { $ne: null },
          "workgroupInfo.WORKGROUP_NAME": { $ne: null },
          "jobs.DOC_NUMBER": { $ne: null },
          "jobItems.JOB_ITEM_NAME": { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            lineName: "$jobs.LINE_NAME",
            jobItemCreatedAt: "$jobItems.createdAt",
            jobItemName: "$jobItems.JOB_ITEM_NAME",
            docNumber: "$jobs.DOC_NUMBER",
          },
          actualValue: { $first: "$jobItems.ACTUAL_VALUE" },
          workgroupName: {
            $first: {
              $ifNull: ["$workgroupInfo.WORKGROUP_NAME", "Unknown"],
            },
          },
        },
      },
      {
        $sort: {
          jobItemCreatedAt: 1,
          lineName: 1,
        },
      },
      {
        $project: {
          _id: 0,
          LINE_NAME: "$_id.lineName",
          jobItemsCreatedAt: "$_id.jobItemCreatedAt",
          JOB_ITEM_NAME: "$_id.jobItemName",
          DOC_NUMBER: "$_id.docNumber",
          ACTUAL_VALUE: "$actualValue",
          WORKGROUP_NAME: "$workgroupName",
        },
      },
    ]);
    // console.log("Job values after aggregation:", jobValues);
    if (jobValues.length === 0) {
      console.log("No data found for the given filters.");
    }
    return NextResponse.json(jobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
