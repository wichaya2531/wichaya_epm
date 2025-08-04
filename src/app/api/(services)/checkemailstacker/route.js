'use server'
//export const runtime = 'nodejs'; // ✅ บังคับใช้ Node.js runtime
import { NextResponse } from "next/server";
import { EmailStack } from "@/lib/models/emailStacker";
//import nodemailer from "nodemailer";
import { connectToDb } from "@/app/api/mongo/index.js";

//import nodemailer from "nodemailer";

export const POST = async (req, res) => {    
    await connectToDb();
    //console.log('call service',req.body);
//    const _emailStacker=await EmailStack.find();
    const _emailStacker = await EmailStack.find({ SENT_STATUS: false }).limit(25);    //console.log('_emailStacker',_emailStacker);
    let success_counter=0;
    let error_counter=0;
    for (const element of _emailStacker) {
            const mailOptions = {
                from: "epm-system@wdc.com",
                to: element.EMAIL_TO,
                subject:element.EMAIL_SUBJECT,
                text:element.EMAIL_BODY,
            };

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_HOST_LINK}/api/send-email`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(mailOptions), // ✅ ต้อง stringify
                });

                const result = await response.json();

                if (response.ok) {
                    //console.log("✅ Email sent:", result.message);
                        // ✅ อัปเดต SENT_STATUS เป็น true
                        await EmailStack.findByIdAndUpdate(element._id, {
                            SENT_STATUS: true,
                        });                      
                    success_counter++;     
                } else {
                    error_counter++;
                    //console.error("❌ Failed to send email:", result.error || result.message);
                }
            } catch (error) {
                error_counter++;    
               // console.error("❌ Error:", error.message);
            }
    };
    //console.log('Success error_counter='+error_counter+" : success_counter="+success_counter);
    return NextResponse.json({ status: 500, error_counter:error_counter,success_counter:success_counter });
};
