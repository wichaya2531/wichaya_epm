// app/api/email-group/by-workgroup/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup"; // ✅ หรือ default export ตามที่คุณใช้จริง

function isValidObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

// ✅ รองรับทั้ง GET และ POST
// GET  : /api/email-group/by-workgroup?workgroup_id=xxxx
// POST : body { workgroup_id: "xxxx" }

export async function GET(req) {
  try {
    await connectToDb();

    const { searchParams } = new URL(req.url);
    const workgroup_id = searchParams.get("workgroup_id");

    if (!isValidObjectId(workgroup_id)) {
      return NextResponse.json(
        { status: 400, error: "Invalid or missing workgroup_id" },
        { status: 400 }
      );
    }

    const emailGroups = await EmailGroup.find({ workgroup_id })
      .select("_id EMAIL_GROUP_NAME workgroup_id USER_LIST createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return NextResponse.json(
      { status: 200, emailGroups },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 500, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json().catch(() => ({}));
    const workgroup_id = body?.workgroup_id;

    if (!isValidObjectId(workgroup_id)) {
      return NextResponse.json(
        { status: 400, error: "Invalid or missing workgroup_id" },
        { status: 400 }
      );
    }

    const emailGroups = await EmailGroup.find({ workgroup_id })
      .select("_id EMAIL_GROUP_NAME workgroup_id USER_LIST createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return NextResponse.json(
      { status: 200, emailGroups },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 500, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
