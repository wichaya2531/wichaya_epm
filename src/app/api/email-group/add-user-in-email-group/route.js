import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup";

export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json();
    const userRaw = body?.user_id;
    const groupRaw = body?.email_group_id;

    if (!userRaw || !mongoose.Types.ObjectId.isValid(userRaw)) {
      return NextResponse.json(
        { status: 400, message: "Invalid user_id" },
        { status: 400 }
      );
    }

    if (!groupRaw || !mongoose.Types.ObjectId.isValid(groupRaw)) {
      return NextResponse.json(
        { status: 400, message: "Invalid email_group_id" },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(userRaw);
    const groupId = new mongoose.Types.ObjectId(groupRaw);

    // ✅ กันซ้ำด้วย $addToSet
    const updated = await EmailGroup.findByIdAndUpdate(
      groupId,
      { $addToSet: { USER_LIST: userId } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { status: 404, message: "Email group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 200, emailGroup: updated },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 500, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
