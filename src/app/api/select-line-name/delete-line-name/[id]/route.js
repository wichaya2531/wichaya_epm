import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  console.log(" ude delete line name");
  const { id } = params;
  await connectToDb();

  const deletedLineName = await SelectLineName.deleteOne({ _id: id });
  if (deletedLineName.deletedCount === 0) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Line name removed" }, { status: 200 });
}
