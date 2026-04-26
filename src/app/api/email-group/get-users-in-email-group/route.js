import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup";

export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json();
    const email_group_id = body?.email_group_id;

    if (!email_group_id || !mongoose.Types.ObjectId.isValid(email_group_id)) {
      return NextResponse.json(
        { status: 400, message: "Invalid email_group_id" },
        { status: 400 }
      );
    }

    const emailGroup = await EmailGroup.findById(email_group_id)
      .populate(
        "USER_LIST",
        "name email username USER_NAME USER_EMAIL EMP_NAME"
      )
      .lean();

    if (!emailGroup) {
      return NextResponse.json(
        { status: 404, message: "Email group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 200, emailGroup },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 500, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
