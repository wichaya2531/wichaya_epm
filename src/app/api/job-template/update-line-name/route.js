import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobTemplate } from "@/lib/models/JobTemplate";

export const PUT = async (req) => {
  await connectToDb();

  const body = await req.json();
  const { jobTemplateID, line_name } = body;

  try {
    // ค้นหา JobTemplate ตาม jobTemplateID
    const jobTemplate = await JobTemplate.findById(jobTemplateID);

    if (!jobTemplate) {
      return NextResponse.json({
        status: 404,
        message: "JobTemplate not found",
      });
    }

    // อัปเดตค่า LINE NAME เท่านั้น
    jobTemplate.LINE_NAME = line_name;

    await jobTemplate.save(); // บันทึกการเปลี่ยนแปลง

    return NextResponse.json({
      status: 200,
      message: "Line name updated successfully",
      jobTemplate, // สามารถส่งข้อมูลที่อัปเดตกลับได้ถ้าต้องการ
    });
  } catch (err) {
    console.log("Update Line Name Error=>", err);
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
