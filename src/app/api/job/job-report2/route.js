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
          from: "jobtemplates", // เชื่อมโยงกับ jobtemplates
          localField: "_id",
          foreignField: "AUTHOR_ID",
          as: "jobTemplates",
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
        $unwind: {
          path: "$workgroup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$jobTemplates", // แยก jobTemplates
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            workgroupName: "$workgroup.WORKGROUP_NAME",
            templateId: "$jobTemplates._id",
          },
          jobTemplateCount: { $sum: 1 }, // นับจำนวน job templates ตาม workgroup
          templates: { $push: "$jobTemplates" }, // เก็บ jobTemplates ทั้งหมดในกลุ่ม
        },
      },
      {
        $project: {
          workgroupName: { $ifNull: ["$_id.workgroupName", "No Workgroup"] }, // เปลี่ยนค่าว่างเป็น "ไม่มีกลุ่มงาน"
          jobTemplateCount: 1,
        },
      },
      {
        $sort: { jobTemplateCount: -1 }, // เรียงลำดับตามจำนวน job templates
      },
    ]);

    console.log("Job counts with job templates by workgroup:", jobCounts);
    return NextResponse.json(jobCounts);
  } catch (error) {
    console.error("Error fetching job counts:", error);
    return NextResponse.error(error);
  }
};
