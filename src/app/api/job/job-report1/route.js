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
        $lookup: {
          from: "jobitems",
          localField: "jobs._id",
          foreignField: "JOB_ID",
          as: "jobItems",
        },
      },
      {
        $unwind: {
          path: "$jobs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$jobItems",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "workgroups",
          let: { workgroupId: "$jobs.WORKGROUP_ID" }, // ใช้ let เพื่อเก็บ WORKGROUP_ID
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$workgroupId" }], // แปลง WORKGROUP_ID เป็น ObjectId
                },
              },
            },
            {
              $project: {
                WORKGROUP_NAME: 1, // ดึงเฉพาะ WORKGROUP_NAME
              },
            },
          ],
          as: "workgroupInfo",
        },
      },
      {
        $unwind: {
          path: "$workgroupInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "jobItems.ACTUAL_VALUE": { $ne: null },
          "jobs.LINE_NAME": { $ne: null }, // ตรวจสอบว่า LINE_NAME ไม่เป็นค่าว่าง
          "jobItems.createdAt": { $ne: null }, // ตรวจสอบว่า jobItemsCreatedAt ไม่เป็นค่าว่าง
          "workgroupInfo.WORKGROUP_NAME": { $ne: null }, // ตรวจสอบว่า WORKGROUP_NAME ไม่เป็นค่าว่าง
        },
      },
      {
        $group: {
          _id: {
            lineName: "$jobs.LINE_NAME",
            jobItemCreatedAt: "$jobItems.createdAt",
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
          jobItemCreatedAt: 1, // เรียงตามวันที่จากเก่าไปใหม่
          lineName: 1, // เรียงตาม LINE_NAME
        },
      },
      {
        $project: {
          _id: 0,
          LINE_NAME: "$_id.lineName",
          jobItemsCreatedAt: "$_id.jobItemCreatedAt",
          ACTUAL_VALUE: "$actualValue",
          WORKGROUP_NAME: "$workgroupName", // ใช้ workgroupName ที่สร้างขึ้น
        },
      },
    ]);

    console.log("Job values with actual values:", jobValues);
    return NextResponse.json(jobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
