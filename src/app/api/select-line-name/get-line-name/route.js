"use server";
import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";
import { NextResponse } from "next/server"; // นำเข้า NextResponse

export const GET = async (req) => {
  console.log("use GET line name");
  await connectToDb();

  try {
    const selectLineNames = await SelectLineName.find();
    return NextResponse.json({ status: 200, selectLineNames });
  } catch (err) {
    console.error("Error fetching line names:", err);
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
