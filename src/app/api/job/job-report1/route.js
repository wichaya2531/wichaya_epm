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
          localField: "jobs._id", // เชื่อมตาม JOB_ID
          foreignField: "JOB_ID",
          as: "jobItems",
        },
      },
      {
        $unwind: {
          path: "$jobs",
          preserveNullAndEmptyArrays: true, // ถ้าหากไม่มี jobs ก็ให้แสดง null
        },
      },
      {
        $unwind: {
          path: "$jobItems",
          preserveNullAndEmptyArrays: true, // ถ้าหากไม่มี jobItems ก็ให้แสดง null
        },
      },
      {
        $match: {
          "jobItems.ACTUAL_VALUE": { $ne: null }, // กรองแค่ ACTUAL_VALUE ที่ไม่เป็น null
        },
      },
      {
        $group: {
          _id: {
            lineName: "$jobs.LINE_NAME", // กลุ่มตาม LINE_NAME
            jobItemCreatedAt: "$jobItems.createdAt",
          },
          actualValue: { $first: "$jobItems.ACTUAL_VALUE" }, // ใช้ $first เพื่อเก็บค่า ACTUAL_VALUE แรกที่พบในกลุ่ม
        },
      },
      {
        $sort: { jobItemCreatedAt: -1 }, // ถ้าต้องการเรียงตาม jobItemsCreatedAt
      },
      {
        $project: {
          _id: 0, // ไม่แสดง _id
          LINE_NAME: "$_id.lineName",
          jobItemsCreatedAt: "$_id.jobItemCreatedAt",
          ACTUAL_VALUE: "$actualValue",
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
