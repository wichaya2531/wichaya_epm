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
          "jobItems.updatedAt": { $ne: null }, // เปลี่ยนจาก createdAt เป็น updatedAt
          "jobs.LINE_NAME": { $ne: null },
          "workgroupInfo.WORKGROUP_NAME": { $ne: null },
          "jobs.DOC_NUMBER": { $ne: null },
          "jobItems.JOB_ITEM_NAME": { $ne: null },
        },
      },
      {
        $project: {
          _id: 0,
          WORKGROUP_NAME: "$workgroupInfo.WORKGROUP_NAME",
          LINE_NAME: "$jobs.LINE_NAME",
          DOC_NUMBER: "$jobs.DOC_NUMBER",
          JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
          jobItemsUpdatedAt: "$jobItems.updatedAt", // เปลี่ยนเป็น updatedAt
          ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE",
        },
      },
      {
        $sort: {
          jobItemsUpdatedAt: 1, // ใช้ updatedAt แทน jobItemsCreatedAt
        },
      },
    ]);

    // ลบข้อมูลที่ไม่มีค่าหรือ null ออก
    const cleanedJobValues = jobValues.filter(
      (item) =>
        item.LINE_NAME &&
        item.WORKGROUP_NAME &&
        item.JOB_ITEM_NAME &&
        item.DOC_NUMBER &&
        item.ACTUAL_VALUE &&
        item.jobItemsUpdatedAt
    );

    // console.log("Job values after aggregation:", cleanedJobValues);
    if (cleanedJobValues.length === 0) {
      console.log("No data found for the given filters.");
    }

    return NextResponse.json(cleanedJobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
