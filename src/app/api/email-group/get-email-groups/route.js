import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup";

export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json();
    const workgroupRaw = body?.workgroup_id;

    if (!workgroupRaw || !mongoose.Types.ObjectId.isValid(workgroupRaw)) {
      return NextResponse.json(
        { status: 400, message: "Invalid workgroup_id", emailGroups: [] },
        { status: 400 }
      );
    }

    const workgroup_id = new mongoose.Types.ObjectId(workgroupRaw);

    const emailGroups = await EmailGroup
      .find({ workgroup_id })
      .sort({ EMAIL_GROUP_NAME: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      { status: 200, emailGroups },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 500,
        message: err?.message || "Internal server error",
        emailGroups: [],
      },
      { status: 500 }
    );
  }
}
