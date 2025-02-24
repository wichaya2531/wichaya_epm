import { Machine } from "@/lib/models/Machine";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, { params }) => {
  await connectToDb();
  const { id } = params; // ดึง id ของเครื่องจาก URL parameter
  const { wd_tag, machine_name } = await req.json(); // รับข้อมูลจาก body

  try {
    // ค้นหาเครื่องตาม id
    const machine = await Machine.findById(id);
    if (!machine) {
      return NextResponse.json(
        { status: 404, message: "Machine not found" },
        { status: 404 }
      );
    }

    // อัปเดตค่า wd_tag และ machine_name
    machine.WD_TAG = wd_tag || machine.WD_TAG; // หากไม่ได้รับค่า wd_tag ใหม่ ให้ใช้ค่าเดิม
    machine.MACHINE_NAME = machine_name || machine.MACHINE_NAME; // หากไม่ได้รับค่าใหม่ ให้ใช้ค่าเดิม

    await machine.save(); // บันทึกการอัปเดต

    return NextResponse.json({ status: 200, machine });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: error.message,
    });
  }
};
