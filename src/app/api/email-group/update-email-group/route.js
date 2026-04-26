// app/api/email-group/update-email-group/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/app/api/mongo/index.js";
import { EmailGroup } from "@/lib/models/EmailGroup";

const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

/**
 * POST /api/email-group/update-email-group
 * body: { _id, EMAIL_GROUP_NAME, workgroup_id }
 *
 * - เช็ค input
 * - เช็ค duplicate name ภายใต้ workgroup เดียวกัน (case-insensitive)
 * - อัปเดตชื่อกลุ่ม
 */
export async function POST(req) {
  try {
    await connectToDb();

    const body = await req.json().catch(() => ({}));
    const _id = body?._id ? String(body._id).trim() : "";
    const EMAIL_GROUP_NAME = body?.EMAIL_GROUP_NAME
      ? String(body.EMAIL_GROUP_NAME).trim()
      : "";
    const workgroup_id = body?.workgroup_id ? String(body.workgroup_id).trim() : "";

    if (!isValidObjectId(_id)) {
      return NextResponse.json(
        { status: 400, message: "Invalid _id" },
        { status: 400 }
      );
    }

    if (!EMAIL_GROUP_NAME) {
      return NextResponse.json(
        { status: 400, message: "EMAIL_GROUP_NAME is required" },
        { status: 400 }
      );
    }

    // ถ้าอยากบังคับให้ส่ง workgroup_id มาด้วย
    if (!isValidObjectId(workgroup_id)) {
      return NextResponse.json(
        { status: 400, message: "Invalid workgroup_id" },
        { status: 400 }
      );
    }

    // ✅ ตรวจว่ากลุ่มนี้มีจริง + อยู่ใน workgroup นี้จริง
    const existing = await EmailGroup.findOne({
      _id: new ObjectId(_id),
      workgroup_id: new ObjectId(workgroup_id),
    });

    if (!existing) {
      return NextResponse.json(
        { status: 404, message: "Email group not found" },
        { status: 404 }
      );
    }

    // ✅ กันชื่อซ้ำใน workgroup เดียวกัน (case-insensitive)
    const dup = await EmailGroup.findOne({
      _id: { $ne: new ObjectId(_id) },
      workgroup_id: new ObjectId(workgroup_id),
      EMAIL_GROUP_NAME: { $regex: `^${escapeRegex(EMAIL_GROUP_NAME)}$`, $options: "i" },
    }).select("_id EMAIL_GROUP_NAME");

    if (dup) {
      return NextResponse.json(
        { status: 409, message: "Email group name already exists" },
        { status: 409 }
      );
    }

    existing.EMAIL_GROUP_NAME = EMAIL_GROUP_NAME;
    await existing.save();

    return NextResponse.json(
      {
        status: 200,
        message: "Updated",
        emailGroup: {
          _id: String(existing._id),
          EMAIL_GROUP_NAME: existing.EMAIL_GROUP_NAME,
          workgroup_id: String(existing.workgroup_id),
          USER_LIST: (existing.USER_LIST || []).map((x) => String(x)),
          updatedAt: existing.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 500, message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
