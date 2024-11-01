import { connectToDb } from "@/app/api/mongo/index";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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
          from: "jobitems",
          localField: "jobs._id",
          foreignField: "JOB_ID",
          as: "jobItems",
        },
      },
      {
        $lookup: {
          from: "workgroups",
          localField: "_id",
          foreignField: "USER_LIST",
          as: "workgroup",
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "ROLE",
          foreignField: "_id",
          as: "roleData",
        },
      },
      {
        $unwind: {
          path: "$roleData",
          preserveNullAndEmptyArrays: true,
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
          role: "$roleData.ROLE_NAME",
          jobCount: { $size: "$jobs" },
          team: "$TEAM",
          JOB_NAME: "$jobs.JOB_NAME",
          LINE_NAME: "$jobs.LINE_NAME",
          createdAt: "$jobs.createdAt",
          workgroupName: {
            $ifNull: ["$workgroup.WORKGROUP_NAME", "No Workgroup"],
          },
          jobItemsCreatedAt: "$jobItems.createdAt",
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
