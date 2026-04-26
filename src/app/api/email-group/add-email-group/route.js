import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup";

export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json();

    const EMAIL_GROUP_NAME = String(body?.EMAIL_GROUP_NAME || "").trim();
    const workgroupRaw = body?.workgroup_id;

    if (!EMAIL_GROUP_NAME) {
      return NextResponse.json(
        { status: 400, message: "Please enter a name" },
        { status: 400 }
      );
    }

    if (!workgroupRaw || !mongoose.Types.ObjectId.isValid(workgroupRaw)) {
      return NextResponse.json(
        { status: 400, message: "Invalid workgroup_id" },
        { status: 400 }
      );
    }

    const workgroup_id = new mongoose.Types.ObjectId(workgroupRaw);

    // USER_LIST optional (ส่งมาก็ได้ ไม่ส่งมาก็ได้)
    let USER_LIST = Array.isArray(body?.USER_LIST) ? body.USER_LIST : [];
    USER_LIST = USER_LIST
      .filter(Boolean)
      .map(String)
      .filter((x) => mongoose.Types.ObjectId.isValid(x))
      .map((x) => new mongoose.Types.ObjectId(x));

    // remove duplicates
    USER_LIST = Array.from(new Set(USER_LIST.map((x) => x.toString()))).map(
      (x) => new mongoose.Types.ObjectId(x)
    );

    const created = await EmailGroup.create({
      EMAIL_GROUP_NAME,
      workgroup_id,
      USER_LIST,
    });

    return NextResponse.json(
      { status: 200, emailGroup: created },
      { status: 200 }
    );
  } catch (err) {
    // duplicate key (EMAIL_GROUP_NAME + workgroup_id)
    if (err?.code === 11000) {
      return NextResponse.json(
        { status: 409, message: "Email group name already exists in this workgroup" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: 500, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
