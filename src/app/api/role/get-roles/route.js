
import { Role } from "@/lib/models/Role.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req) => {
  await connectToDb();
  try {
    const roles = await Role.find();
    return NextResponse.json({ roles, status: 200 });
  } catch (err) {
    return NextResponse.json({
      message: "Read all roles failed",
      file: __filename,
      error: err.message,
      status: 500,
    });
  }
};
