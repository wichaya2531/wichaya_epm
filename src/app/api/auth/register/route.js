import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Workgroup } from "@/lib/models/Workgroup.js";
import { Role } from "@/lib/models/Role.js";
import { sendEmail } from "../../(services)/send-email-new-user/route";

export const POST = async (req, res) => {
  await connectToDb();
  const {
    emp_number,
    emp_name,
    email,
    username,
    password,
    team,
    workgroup_id,
  } = await req.json();

  try {
    //if username already exists

    var a_username = username.trim();
    var a_password = password.trim();
    var a_emp_number = emp_number.trim();

    const user = await User.findOne({
      USERNAME: a_username,
    });

    if (user) {
      return NextResponse.json({ status: 400, duplicateField: "Username" });
    }

    // ตรวจสอบว่า Workgroup ที่เลือกมีอยู่จริง
    const workgroup = await Workgroup.findById(workgroup_id);
    if (!workgroup) {
      return NextResponse.json({ status: 400, message: "Invalid Workgroup" });
    }

    const new_user = new User({
      EMP_NUMBER: a_emp_number,
      EMP_NAME: emp_name,
      EMAIL: email,
      USERNAME: a_username,
      PASSWORD: a_password,
      TEAM: team,
      workgroup_id, // บันทึก workgroup_id
      ROLE: "662f6bc9b198fbd46d07b7cb", // กำหนด ROLE เป็น "Checker"
    });

    console.log("username", ":" + a_username + ":");
    //return NextResponse.json({ status: 500 })

    await new_user.save();

    // เพิ่มผู้ใช้เข้า Workgroup
    workgroup.USER_LIST.push(new_user._id);
    await workgroup.save();

    // ตรวจสอบว่ามีการเปิดการแจ้งเตือนหรือไม่
    if (process.env.NEXT_PUBLIC_NOTIFY_NEW_USER === "true") {
      // ค้นหาผู้ใช้ใน Workgroup เดียวกันที่มี ROLE เป็น Admin
      const admins = await User.find({
        workgroup_id,
        ROLE: "662884f794ded7042143d843", // Admin role
      });

      // แสดงข้อมูล Admin ที่จะได้รับการแจ้งเตือน
      console.log("Admin users found:", admins);

      // ส่งอีเมลให้กับ Admin ทุกคน
      const adminEmails = admins.map((admin) => admin.EMAIL);
      const subject = "New User Added";
      const text = `A new user named ${new_user.EMP_NAME} has been added to the workgroup.`;

      console.log("Sending email to admins:", adminEmails); // แสดงรายชื่อผู้รับ

      // ส่งอีเมลไปยัง Admin ทุกคน
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails.join(", "), // ส่งอีเมลไปยัง Admin ทุกคน
          subject,
          text,
        });
      }
    }

    return NextResponse.json({
      status: 200,
      message: "User created successfully",
      user: new_user,
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
