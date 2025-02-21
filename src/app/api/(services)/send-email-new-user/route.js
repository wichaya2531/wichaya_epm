import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  try {
    console.log("Sending email to:", to); // แสดงรายชื่อผู้รับ
    console.log("Subject:", subject); // แสดงหัวข้ออีเมล
    console.log("Text:", text); // แสดงเนื้อหาของอีเมล

    const transporter = nodemailer.createTransport({
      host: "mailrelay.wdc.com",
      port: 25,
      secure: false, // No authentication required
      tls: {
        rejectUnauthorized: false, // Ignore expired certificates
      },
    });

    // ส่งอีเมล
    let info = await transporter.sendMail({
      from: {
        name: "Epm System",
        address: process.env.EMAIL_USER,
      },
      to, // รายชื่อผู้รับ
      subject, // หัวข้ออีเมล
      text, // ข้อความในอีเมล
    });

    console.log("Email sent successfully:", info); // แสดงผลลัพธ์การส่งอีเมล

    return NextResponse.json({ status: 200, message: "Email sent" });
  } catch (error) {
    console.error("Error sending email:", error); // แสดงข้อผิดพลาดหากมีการส่งไม่สำเร็จ
    return NextResponse.json({ status: 500, error: error.message });
  }
};
