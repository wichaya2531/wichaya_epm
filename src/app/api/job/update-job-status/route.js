import { NextResponse } from "next/server";
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { User } from "@/lib/models/User";

//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
import { once } from "events";
//---------------------------------------------->>

export const PUT = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { JOB_ID } = body;
  const { user_id } = body; 
  //console.log("JOB_ID", JOB_ID);
  //console.log("USER_ID", user_id);
  const user = await User.findOne({ _id: user_id });
  //console.log("user", user);
  //return NextResponse.json({ status: 200 });
  const msgPck=`{\'JOB_ID\':\'${JOB_ID}\'}`;
    try{
       const job = await Job.findOne({ _id: JOB_ID });
      //console.log('workgroup_id',workgroup_id);
      //console.log('isJob',isJob);
      //console.log('findSchedual',findSchedual);
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
          //const msg=`{\'JOB_ID\':\'${JOB_ID}\',\'EVENT\':\'UPDATE-JOB\'}`;
          //msg = msg.replaceAll('"', "\""); 
          //console.log('msg',msg);
          await publishAsync(mqttClient,job.WORKGROUP_ID, msgPck); // ✅ รอให้ publish เสร็จ
          // ปิด connection แบบรอส่งค้างให้ครบ
          await new Promise((resolve) => mqttClient.end(false, resolve));
  }catch(err){
        console.log("MQTT error ",err);
        console.log(".... error");
  }


  try {

    const job = await Job.findOne({ _id: JOB_ID });
    //console.log("monitor job ", job);

    const jobStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
    const jobStatusName = jobStatus.status_name;
    const ongoing_status = await Status.findOne({ status_name: "ongoing" });
    
    // Update the job status to ongoing if the current status is new
    if (jobStatusName === "new" || jobStatusName === "renew") {
      job.JOB_STATUS_ID = ongoing_status._id;
      job.LAST_GET_BY = user.EMP_NAME || "Unknown"; // Set LAST_GET to current date and time
      job.LAST_GET_TIME = new Date();
      await job.save();
    }

    return NextResponse.json({ status: 200 ,infojson:job});
  } catch (err) {
     if(process.env.NEXT_PUBLIC_DEBUG=="true"){
            console.log("Error Code : 037");
            console.log('JOB_ID',JOB_ID);
     }
    console.error("Error occurred:", err); // Log the error
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
