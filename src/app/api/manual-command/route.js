'use server'
//export const runtime = 'nodejs'; // ✅ บังคับใช้ Node.js runtime
import { NextResponse } from "next/server";
import { EmailStack } from "@/lib/models/emailStacker";
//import nodemailer from "nodemailer";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library

//import nodemailer from "nodemailer";

export const GET = async (req, res) => {    
    await connectToDb();
    
        const sch = await Schedule.aggregate([
        {
            $match: {
            WORKGROUP_ID: new ObjectId("668231029126e67f6a310d06"),
            JOB_TEMPLATE_NAME: { $regex: "Hybond KPOV Daily PM", $options: "i" }
            }
        },
        {
            $addFields: {
            hour_bkk: {
                $hour: {
                date: "$ACTIVATE_DATE",
                timezone: "Asia/Bangkok"
                }
            },
            minute_bkk: {
                $minute: {
                date: "$ACTIVATE_DATE",
                timezone: "Asia/Bangkok"
                }
            }
            }
        },
        {
            $match: {
            hour_bkk: 7,
            minute_bkk: 0
            }
        }
        ]);//.limit(500);
       // console.log('sch count before',sch.length);

        // แยก _id ออกมาเป็น array
        const idsToDelete = sch.map((doc) => doc._id);
        //console.log('idsToDelete',idsToDelete);
        // ลบทั้งหมดในครั้งเดียว
        const result = await Schedule.deleteMany({
            _id: { $in: idsToDelete }
        });
        console.log(`Deleted ${result.deletedCount} documents`);


    return NextResponse.json({ status: 200  });

}