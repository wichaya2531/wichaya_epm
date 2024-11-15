import { connectToDb } from "@/app/api/mongo/index";
import { NextResponse } from "next/server";
import SelectLineName from "@/lib/models/SelectLineName";
import { Workgroup } from "@/lib/models/Workgroup";

export const dynamic = "force-dynamic";

export const GET = async (req, res) => {
  try {
    await connectToDb();
    // ดึงข้อมูลจาก selectlinenames พร้อมกับ WORKGROUP_ID
    const lineNames = await SelectLineName.find({}, "name WORKGROUP_ID");
    // ตรวจสอบข้อมูลที่ดึงมา
    // console.log("Line Names with Workgroup ID:", lineNames);
    // ดึงข้อมูลจาก workgroups โดยใช้ WORKGROUP_ID ใน SelectLineName
    const workgroupIds = lineNames.map((line) => line.WORKGROUP_ID);
    const workgroups = await Workgroup.find(
      { _id: { $in: workgroupIds } },
      "WORKGROUP_NAME"
    );
    // ตรวจสอบข้อมูล workgroups ที่ดึงมา
    // console.log("Workgroups Data:", workgroups);
    // จัดทำข้อมูลให้ส่งออกผลลัพธ์ที่ต้องการ
    const result = lineNames.map((line) => {
      const workgroup = workgroups.find(
        (wg) => wg._id.toString() === line.WORKGROUP_ID
      );
      return {
        LINE_NAME: line.name,
        WORKGROUP_NAME: workgroup ? workgroup.WORKGROUP_NAME : null,
      };
    });
    // console.log("Result Data:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
