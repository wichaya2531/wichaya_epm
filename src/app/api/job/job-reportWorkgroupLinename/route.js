import { connectToDb } from "@/app/api/mongo/index";
import { NextResponse } from "next/server";
import SelectLineName from "@/lib/models/SelectLineName";
import { Workgroup } from "@/lib/models/Workgroup";

export const dynamic = "force-dynamic";

export const GET = async (req, res) => {
  try {
    await connectToDb();

    // ดึงข้อมูลจาก selectlinenames (แยกจาก workgroups)
    const lineNames = await SelectLineName.distinct("name"); // ดึงค่าที่ไม่ซ้ำจากฟิลด์ name

    // ดึงข้อมูลจาก workgroups (แยกจาก selectlinenames)
    const workgroupNames = await Workgroup.distinct("WORKGROUP_NAME"); // ดึงค่าที่ไม่ซ้ำจากฟิลด์ WORKGROUP_NAME

    // ส่งผลลัพธ์แยกต่างหาก
    return NextResponse.json({
      LINE_NAMES: lineNames,
      WORKGROUP_NAMES: workgroupNames,
    });
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
