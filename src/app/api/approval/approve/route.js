import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";
import { Status } from "@/lib/models/Status.js";
import { NextResponse } from 'next/server';
import { JobApproves } from "@/lib/models/JobApprove";
import { User } from "@/lib/models/User.js";

//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
import { once } from "events";
//---------------------------------------------->>

export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { job_id, user_id, isApproved, comment,disapprove_reason } = body;

    try {
        const renew = await Status.findOne({ status_name: 'renew' });
        const complete = await Status.findOne({ status_name: 'complete' });
        const job = await Job.findOne({ _id: job_id });
        if ( !isApproved ) {
            // กรณีที่ เป็นการ Disapprove
            job.JOB_STATUS_ID = renew._id;
            job.DISAPPROVE_REASON=disapprove_reason;
            await job.save();
        }
        else {
            // กรณีการ Approve
            job.JOB_STATUS_ID = complete._id;
            job.JOB_APPROVERS=[user_id];   // ระบุข้อมูล  user ที่ Approve งานนั้น
            await job.save(); 
        }

        const jobApprove = new JobApproves({
            JOB: job,
            USER_ID: user_id,
            IS_APPROVE: isApproved,
            COMMENT: comment,
        });

        await jobApprove.save();
        

        try{
                    const MQTT_URL = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQT_URL; // แล้วแต่คุณตั้ง env
                    const MQTT_USERNAME = process.env.MQTT_USERNAME || process.env.NEXT_PUBLIC_MQT_USERNAME;
                    const MQTT_PASSWORD = process.env.MQTT_PASSWORD || process.env.NEXT_PUBLIC_MQT_PASSWORD;
        
                    function connectMqtt() {
                      const client = mqtt.connect(MQTT_URL, {
                        username: MQTT_USERNAME,
                        password: MQTT_PASSWORD,
                        reconnectPeriod: 0, // ฟังก์ชันสั้น ๆ ไม่ต้อง reconnect
                      });
                      return client;
                    }
        
                    function publishAsync(client, topic, payload, opts = { qos: 1, retain: false }) {
                      return new Promise((resolve, reject) => {
                        client.publish(topic, payload, opts, (err) => (err ? reject(err) : resolve()));
                      });
                    }
                    // ------------------------------------------------        
                    // ... ใน POST handler ของคุณ (ท้าย ๆ ก่อน return)        
                   // console.log("workgroup id ที่ต้องส่ง  mqtt update ", workgroup_id_list);        
                    // สร้าง client และรอ connected
                    const mqttClient = connectMqtt();
                    await once(mqttClient, "connect"); // ✅ รอให้เชื่อมต่อก่อน        
                    // ส่งทีละอัน (แปลง ObjectId → string)
                        //console.log("MQTT ===>>"+job.WORKGROUP_ID);
                        const msgPck=`{\'JOB_ID\':\'${job_id}\'}`;
                        await publishAsync(mqttClient,job.WORKGROUP_ID, msgPck); // ✅ รอให้ publish เสร็จ
        
                    // ปิด connection แบบรอส่งค้างให้ครบ
                    await new Promise((resolve) => mqttClient.end(false, resolve));
              
            }catch(err){
                  console.log("MQTT error ",err);
                  console.log("schedual-checker error");
            }    


        return NextResponse.json({ status: 200,  message: isApproved ? "Job has been approved" : "Job has been rejected" });
    }
    catch (err) {
        if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 010");
        }
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}