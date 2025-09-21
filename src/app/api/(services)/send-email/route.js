import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const POST = async (req, res) => {
  const body = await req.json();
  // console.log('from', body.from);
  // console.log('to', body.to);
  // console.log('subject', body.subject);
  // console.log('text', body.text);

  try {    
          if(body.to.length<5){
                return NextResponse.json({status: 200 , message: "email is invalid" });
          }
           const transporter = nodemailer.createTransport({
           host: "mailrelay.wdc.com", // หรือ SMTP ของผู้ให้บริการอื่น
           port: 465, // 587 สำหรับ TLS, 465 สำหรับ SSL
           secure: false,
                   // auth: {
                   //   user: process.env.EMAIL_USER,
                   //   pass: process.env.EMAIL_PASS, // อาจต้องใช้ App Password
                   //},
           });

          const mailOptions = {
            from: body.from || "epm-system@wdc.com",
            to: body.to,
            subject: body.subject,
            text: body.text,
          };
          await transporter.sendMail(mailOptions);    
    return NextResponse.json({ status: 200, message: "Email sent" });
  } catch (error) {
    //console.error(error);
    console.error("Error sending email ");
    return NextResponse.json({ status: 500, error: error.message });
  }
};
