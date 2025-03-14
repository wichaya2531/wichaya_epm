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

    //console.log("username", ":" + a_username + ":");
    //return NextResponse.json({ status: 500 })

    await new_user.save();

    // เพิ่มผู้ใช้เข้า Workgroup
    workgroup.USER_LIST.push(new_user._id);
    await workgroup.save();

    // ตรวจสอบว่าเปิดการแจ้งเตือนผู้ใช้ใหม่หรือไม่
    if (process.env.NEXT_PUBLIC_NOTIFY_NEW_USER === "true") {
      // ค้นหาว่ามี workgroup_id นี้ในฐานข้อมูล Workgroup
      console.log("Searching for workgroup with workgroup_id:", workgroup_id); // เพิ่มการตรวจสอบ workgroup_id
      const workgroup = await Workgroup.findById(workgroup_id);

      if (!workgroup) {
        console.log("Workgroup not found");
        return;
      }

      // ค้นหาผู้ใช้ที่มี workgroup_id เดียวกันจาก USER_LIST ของ Workgroup
      const userIdsInWorkgroup = workgroup.USER_LIST;
      console.log("Users in this workgroup:", userIdsInWorkgroup);

      // ค้นหาผู้ใช้ที่มี ROLE เป็น Admin ใน Workgroup เดียวกัน
      const admins = await User.find({
        _id: { $in: userIdsInWorkgroup }, // ค้นหาผู้ใช้ที่มี user_id ใน USER_LIST
        ROLE: "662884f794ded7042143d843", // Admin role
      });

      console.log("Admin users found:", admins); // ตรวจสอบข้อมูลผู้ใช้ Admin

      if (admins.length > 0) {
        // ดึงอีเมลของผู้ใช้ Admin ที่พบ
        const adminEmails = admins.map((admin) => admin.EMAIL);

        // แสดงอีเมลที่ได้รับการแจ้งเตือนใน console
        console.log("Admin email addresses:", adminEmails); // แสดงรายชื่อผู้รับอีเมล

        // สร้างหัวข้อและเนื้อหาของอีเมล
        const subject = "New User Added";
        const text = `A new user named ${new_user.EMP_NAME} has been added to the workgroup.`;

        // ส่งอีเมลแจ้งเตือนไปยังผู้ใช้ Admin
        await sendEmail({
          to: adminEmails.join(", "), // ส่งไปยังอีเมลทั้งหมด
          subject,
          text,
        });
      } else {
        console.log("No Admin users found in this workgroup.");
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
