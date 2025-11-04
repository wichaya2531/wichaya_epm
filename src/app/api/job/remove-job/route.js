import { NextResponse } from "next/server.js";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";

//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
import { once } from "events";
//---------------------------------------------->>

export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  // ✅ ตรวจสอบและแปลง job_ids ให้เป็น array เสมอ
  let job_ids = body.job_ids;

  //console.log('job_ids',job_ids);

  if (!job_ids) {
   // console.log("❌ Missing job_ids");
    return NextResponse.json({ status: 400, error: "Missing job_ids" });
  }
  if (!Array.isArray(job_ids)) {
    job_ids = [job_ids]; // แปลง single id ให้เป็น array
  }
  if (job_ids.length === 0) {
    //console.log("❌ Invalid job_ids:", job_ids);
    return NextResponse.json({ status: 400, error: "Invalid job_ids" });
  }
  //console.log("✅ Received job_ids to delete:", job_ids);
  const findSchedual=await Schedule.findById(job_ids);
  const isJob=await Job.findById(job_ids);
  //console.log('find_job',find_job);
 
 // const _schedual=await Schedule.findById(job_ids);
  //console.log('find_job',find_job);
  //if (!isJob) {
        //console.log('is schedual',job_ids);
  //      const findSchedual=await Schedule.findById(job_ids);
        //console.log('findSchedual',findSchedual);
 // }  
          try{
              var workgroup_id="";
              if(isJob){
                  workgroup_id=isJob.WORKGROUP_ID;
              }else{
                  workgroup_id=findSchedual.WORKGROUP_ID;
              }
              if (typeof workgroup_id === 'object' && workgroup_id !== null) {
                // ตรวจสอบว่าเป็น ObjectId ของ MongoDB จริง ๆ
                if (workgroup_id.toString) {
                  workgroup_id = workgroup_id.toString();
                }
              }
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
                      //console.log("MQTT ===>>"+job.WORKGROUP_ID);
                      await publishAsync(mqttClient,workgroup_id, "refresh"); // ✅ รอให้ publish เสร็จ
                  // ปิด connection แบบรอส่งค้างให้ครบ
                  await new Promise((resolve) => mqttClient.end(false, resolve));
          }catch(err){
                console.log("MQTT error ",err);
                console.log(".... error");
          }

  try {
    await Promise.all(
      job_ids.map(async (job_id) => {
        if (!job_id) {
         // console.log("⚠️ Skipping invalid job_id:", job_id);
          return;
        }
       // console.log(`🗑️ Deleting job: ${job_id}`);
        // ลบ schedule ที่เกี่ยวข้อง

        //console.log('user wat to delete job_id ',job_id);
        await Schedule.findOneAndDelete({ _id: job_id });
        // ลบการ Activate ของ Job
        await JobTemplateActivate.findOneAndDelete({ JOB_ID: job_id });
        // หา JobItem ที่เกี่ยวข้อง
        const jobItems = await JobItem.find({ JOB_ID: job_id });
        // console.log(
        //   `🔍 Found ${jobItems.length} job items for job_id: ${job_id}`
        // );
        // ลบ JobItemTemplateActivate ที่เกี่ยวข้อง
        await Promise.all(
          jobItems.map(async (jobItem) => {
            // console.log(
            //   `🗑️ Deleting JobItemTemplateActivate for JOB_ITEM_ID: ${jobItem._id}`
            // );
            await JobItemTemplateActivate.findOneAndDelete({
              JOB_ITEM_ID: jobItem._id,
            });
          })
        );
        // ลบ JobItem ทั้งหมดที่เกี่ยวข้อง
        await JobItem.deleteMany({ JOB_ID: job_id });
        // ลบ Job จริง ๆ
        await Job.findByIdAndDelete(job_id);
      })
    );
    //console.log("✅ Jobs deleted successfully:", job_ids);

    return NextResponse.json({
      status: 200,
      message: "Jobs deleted successfully",
    });
  } catch (err) {
    //console.log("❌ Error deleting jobs:", err);
     if(process.env.NEXT_PUBLIC_DEBUG=="true"){
            console.log("Error Code : 033");
     }
    return NextResponse.json({ status: 500, error: err.message });
  }
};
