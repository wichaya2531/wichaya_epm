import { User } from '@/lib/models/User.js';
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import fs from 'fs';
import path from 'path';

export const PUT = async (req) => {
  await connectToDb();
  const form = await req.formData();

  try {
    const user_id   = form.get("user_id");
    const mode      = form.get("mode"); // "info" | "password"
    const password  = form.get("password");
    const file      = form.get("file");

    const user = await User.findById(user_id);
    if (!user) {
      return NextResponse.json({ status: 404, error: "User not found" });
    }

    // ── Mode: เปลี่ยน Password อย่างเดียว ──────────────────────────
    if (mode === "password") {
      if (!password) {
        return NextResponse.json({ status: 400, error: "Password is required" });
      }
      user.PASSWORD = password;
      await user.save();
      return NextResponse.json({ status: 200 });
    }

    // ── Mode: อัปเดต Information (+ รูปโปรไฟล์) ──────────────────
    const emp_number = form.get("emp_number");
    const emp_name   = form.get("emp_name");
    const email      = form.get("email");
    const username   = form.get("username");
    const team       = form.get("team");

    // ตรวจสอบ username ซ้ำ (ยกเว้น user ตัวเอง)
    const duplicate = await User.findOne({ USERNAME: username, _id: { $ne: user_id } });
    if (duplicate) {
      return NextResponse.json({ status: 400, error: "Username already exists" });
    }

    user.EMP_NUMBER = emp_number || user.EMP_NUMBER;
    user.EMP_NAME   = emp_name   || user.EMP_NAME;
    user.EMAIL      = email      || user.EMAIL;
    user.USERNAME   = username   || user.USERNAME;
    user.TEAM       = team       || user.TEAM;

    // อัปเดตรูปเฉพาะเมื่อมีไฟล์ส่งมา
    if (file && file.size > 0) {
      const buffer        = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split(".").pop();
      const filename      = `${user_id}.${fileExtension}`;
      const filePath      = path.join(process.cwd(), "public", "user-profile", filename);
      fs.writeFileSync(filePath, buffer);
      user.USER_IMAGE = `/user-profile/${filename}`;
    }

    await user.save();
    return NextResponse.json({ status: 200 });

  } catch (err) {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.error("Error Code: 013 —", err);
    }
    return NextResponse.json({ status: 500, error: err.message });
  }
};
