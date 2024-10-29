import { connectToDb } from "@/app/api/mongo/index";
import { Job } from "@/lib/models/Job";
import { User } from "@/lib/models/User";
import { Role } from "@/lib/models/Role"; // นำเข้าคอลเลกชัน Role
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
          from: "workgroups",
          localField: "_id",
          foreignField: "USER_LIST",
          as: "workgroup",
        },
      },
      {
        $lookup: {
          from: "roles", // เชื่อมต่อกับคอลเลกชัน role
          localField: "ROLE", // ใช้ฟิลด์ ROLE จาก User
          foreignField: "_id", // เชื่อมต่อกับ _id ใน role
          as: "roleData",
        },
      },
      {
        $unwind: {
          path: "$roleData",
          preserveNullAndEmptyArrays: true, // ให้ทำงานแม้ไม่มีข้อมูลใน role
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
          role: "$roleData.ROLE_NAME", // ดึง ROLE_NAME จาก roleData
          jobCount: { $size: "$jobs" },
          team: "$TEAM",
          JOB_NAME: "$jobs.JOB_NAME",
          LINE_NAME: "$jobs.LINE_NAME",
          createdAt: "$jobs.createdAt",
          workgroupName: {
            $ifNull: ["$workgroup.WORKGROUP_NAME", "ไม่มีกลุ่มงาน"],
          },
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
