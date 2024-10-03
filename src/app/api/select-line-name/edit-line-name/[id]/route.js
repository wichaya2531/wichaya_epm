import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = params;
  const { newName: name } = await req.json(); // รับค่าจาก JSON
  await connectToDb();

  console.log("Received ID:", id); // ตรวจสอบว่า ID ถูกต้อง
  console.log("New Name:", name); // ตรวจสอบค่าที่รับมา

  const updatedLineName = await SelectLineName.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  );

  if (!updatedLineName) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(
    { message: "Line name updated", data: updatedLineName },
    { status: 200 }
  );
}
