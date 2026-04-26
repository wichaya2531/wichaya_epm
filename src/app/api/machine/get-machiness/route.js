// app/api/machine/get-machines/route.js

import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo";
import { Machine } from "@/lib/models/Machine";

export async function GET(req) {
  await connectToDb();
  const { searchParams } = new URL(req.url);
  //const workgroup_id = searchParams.get("workgroup_id");
  //const filter = searchParams.get("filter") || "";

  const machines = await Machine.find({
    //workgroup_id,
    // ใส่เงื่อนไข filter ตามโจทย์จริงของคุณ
  }).lean();

  return NextResponse.json(machines);  // ส่งเป็น JSON array ปกติ
}