import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export const POST = async (req, res) => {
  //console.log("email receive GET",req.query);
  const data = await req.json(); // อ่าน body ของ request


  // ทำสิ่งที่คุณต้องการกับข้อมูลนี้ เช่น ส่งอีเมล หรือบันทึกลงฐานข้อมูล
  /*console.log('Received email:', data.email);
  console.log('Subject:', data.subject);
  console.log('Body:', data.body);
  console.log('Mail Sender:', data.mailsender);
  console.log('Name Sender:', data.namesender);
  
  return NextResponse.json({status: 200 , message: "Pending..." });
  */

  if(data.email.length<5){
      return NextResponse.json({status: 200 , message: "test is OK" });
  }


  try {
    // ตั้งค่า SMTP Server
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
      from: data.mailsender,
      to: data.email,
      subject:data.subject,
      text:data.body,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({status: 200 , message: "test is OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({status: 200 , message: error });
  }
   
};