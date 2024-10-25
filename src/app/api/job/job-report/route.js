// pages/api/countJobsByUser.js
import { connectToDb } from "@/app/api/mongo/index";
import { Job } from "@/lib/models/Job";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @method GET
 * @returns NextResponse
 * @description Find All Prompts and return
 */

export const GET = async (req, res) => {
  try {
    await connectToDb();

    const jobCounts = await User.aggregate([
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
          from: "workgroups", // เชื่อมต่อกับกลุ่มงาน
          localField: "_id",
          foreignField: "USER_LIST", // เชื่อมต่อกับ USER_LIST ใน workgroup
          as: "workgroup",
        },
      },
      {
        $unwind: {
          path: "$workgroup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userName: "$EMP_NAME",
          jobCount: { $size: "$jobs" },
          team: "$TEAM",
          JOB_NAME: "$jobs.JOB_NAME",
          LINE_NAME: "$jobs.LINE_NAME",
          createdAt: "$jobs.createdAt",
          workgroupName: {
            $ifNull: ["$workgroup.WORKGROUP_NAME", "ไม่มีกลุ่มงาน"],
          }, // แสดงกลุ่มงาน
        },
      },
      {
        $sort: { jobCount: -1 },
      },
    ]);

    console.log("Job counts with additional fields:", jobCounts);

    return NextResponse.json(jobCounts);
  } catch (error) {
    console.error("Error fetching job counts:", error);
    return NextResponse.error(error);
  }
};
