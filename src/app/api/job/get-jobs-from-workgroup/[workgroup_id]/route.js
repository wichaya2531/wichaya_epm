import { Job } from "@/lib/models/Job";
import { NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { JobTemplate } from "@/lib/models/JobTemplate";
export const dynamic = "force-dynamic";
export const GET = async (req, { params }) => {
  await connectToDb();

  const { workgroup_id } = params;
  //console.log("workgroup_id=>",workgroup_id);
  if (workgroup_id === "undefined") {
    return NextResponse.json({
      status: 400,
      error: "Workgroup ID is required",
    });
  } 
  

  
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      
      var gap=500;       // maximum record for query per round 
      
      for (let i = 1; i <= 100; i++) {        
              var jobs,schedules;
              jobs = await Job.find({ WORKGROUP_ID: workgroup_id }).sort({ createdAt: -1 }).skip((i - 1) * gap).limit(gap);//.limit(2000);              
              if(jobs.length<=0){
                break;
              }   
              schedules = await Schedule.find({ WORKGROUP_ID: workgroup_id }).sort({ createdAt: -1 }).skip((i - 1) * gap).limit(gap);//.limit(2000);
              //console.log("i="+i+",gap="+gap+",length="+jobs.length);                

              const activaterPromises = jobs.map(async (job) => {
                const user = await User.findOne({ _id: job.ACTIVATE_USER });
                const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
                const activaterName = user?.EMP_NAME || "Unknown";
                const statusName = status?.status_name || "Unknown";
                const statusColor = status?.color || "Unknown";
          
                return {
                  ...job.toObject(),
                  ACTIVATER_NAME: activaterName,
                  STATUS_NAME: statusName,
                  STATUS_COLOR: statusColor,
                };
              });
          
              const schedulePromises = schedules.map(async (schedule) => {
                //console.log("schedule",schedule);
                const status = await Status.findOne({ status_name: schedule.STATUS });
                const statusColor = status?.color || "Unknown";
          
                const LineName = await JobTemplate.findOne({
                  JobTemplateCreateID: schedule.JOB_TEMPLATE_CREATE_ID,
                });
          
                const Line_Name = LineName?.LINE_NAME || "Unknown";
                return {
                  _id: schedule._id,//schedule.JOB_TEMPLATE_ID,
                  REVIEWS: "",
                  WD_TAG: "",
                  JOB_STATUS_ID: "",
                  LINE_NAME: schedule.LINE_NAME,
                  JOB_APPROVERS: [],
                  JOB_NAME: schedule.JOB_TEMPLATE_NAME,
                  DOC_NUMBER: schedule.DOC_NUMBER,
                  CHECKLIST_VERSION: "",
                  WORKGROUP_ID: "",
                  ACTIVATE_USER: "Scheduler",
                  TIMEOUT: "",
                  createdAt: new Date(schedule.ACTIVATE_DATE).toISOString(),
                  //submitedAt:new Date().toISOString(),
                  updatedAt: schedule.updatedAt,
                  ACTIVATER_NAME: "Scheduler",
                  STATUS_NAME: schedule.STATUS,
                  STATUS_COLOR: statusColor,
                  JOB_TEMPLATE_CREATE_ID: schedule.JOB_TEMPLATE_CREATE_ID,
                  JOB_TEMPLATE_NAME: schedule.JOB_TEMPLATE_NAME,
                  ACTIVATE_DATE: schedule.ACTIVATE_DATE,
                  SCHEDULE_STATUS: schedule.STATUS,
                };
              });
          
              const combinedPromises = [...activaterPromises, ...schedulePromises];
              let jobsWithActivater = await Promise.all(combinedPromises);
          
              jobsWithActivater.sort((a, b) => {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
              });
              //------------------------------------------>>
              const json = JSON.stringify(jobsWithActivater);      // แปลงเป็น string
              const chunk = encoder.encode(json + '\n'); // ใส่ newline คั่นแต่ละ batch
              controller.enqueue(chunk);
              await new Promise(resolve => setTimeout(resolve, 500)); // delay 1 วิ
      }

      controller.enqueue(encoder.encode('"A จบการส่งข้อมูล"\n'));
      controller.close();

    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    }
  });
  
  //-------------------------->>>>

  try {


    const lrv_Date = new Date();
    lrv_Date.setDate(lrv_Date.getDate() - 7);


    const jobs = await Job.find({ WORKGROUP_ID: workgroup_id, updatedAt: { $gte: lrv_Date } });//.limit(2000);
    const schedules = await Schedule.find({ WORKGROUP_ID: workgroup_id , updatedAt: { $gte: lrv_Date }});//.limit(2000);
    const activaterPromises = jobs.map(async (job) => {
      const user = await User.findOne({ _id: job.ACTIVATE_USER });
      const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
      const activaterName = user?.EMP_NAME || "Unknown";
      const statusName = status?.status_name || "Unknown";
      const statusColor = status?.color || "Unknown";

      return {
        ...job.toObject(),
        ACTIVATER_NAME: activaterName,
        STATUS_NAME: statusName,
        STATUS_COLOR: statusColor,
      };
    });

    const schedulePromises = schedules.map(async (schedule) => {
      //console.log("schedule",schedule);
      const status = await Status.findOne({ status_name: schedule.STATUS });
      const statusColor = status?.color || "Unknown";

      const LineName = await JobTemplate.findOne({
        JobTemplateCreateID: schedule.JOB_TEMPLATE_CREATE_ID,
      });

      const Line_Name = LineName?.LINE_NAME || "Unknown";
      //console.log("XXXX----XXXX",LineName);
      return {
        _id: schedule._id,//schedule.JOB_TEMPLATE_ID,
        REVIEWS: "",
        WD_TAG: "",
        JOB_STATUS_ID: "",
        LINE_NAME: schedule.LINE_NAME,
        JOB_APPROVERS: [],
        JOB_NAME: schedule.JOB_TEMPLATE_NAME,
        DOC_NUMBER: schedule.DOC_NUMBER,
        CHECKLIST_VERSION: "",
        WORKGROUP_ID: "",
        ACTIVATE_USER: "Scheduler",
        TIMEOUT: "",
        createdAt: new Date(schedule.ACTIVATE_DATE).toISOString(),
        //submitedAt:new Date().toISOString(),
        updatedAt: schedule.updatedAt,
        ACTIVATER_NAME: "Scheduler",
        STATUS_NAME: schedule.STATUS,
        STATUS_COLOR: statusColor,
        JOB_TEMPLATE_CREATE_ID: schedule.JOB_TEMPLATE_CREATE_ID,
        JOB_TEMPLATE_NAME: schedule.JOB_TEMPLATE_NAME,
        ACTIVATE_DATE: schedule.ACTIVATE_DATE,
        SCHEDULE_STATUS: schedule.STATUS,
      };
    });

    const combinedPromises = [...activaterPromises, ...schedulePromises];
    let jobsWithActivater = await Promise.all(combinedPromises);

    jobsWithActivater.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    //console.log(jobsWithActivater);

    return NextResponse.json({ status: 200, jobs: jobsWithActivater });
  } catch (err) {
    console.log("Error", err);
    return NextResponse.json({ status: 500, error: err.message });
  }
};
