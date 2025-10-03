import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { JobTemplate } from "@/lib/models/JobTemplate";
export const dynamic = "force-dynamic";

// code แบบ ดึงทีละหน่อย 

export const GET = async (req, { params }) => {
  await connectToDb();
  // รับค่า starttime และ endtime จาก query string
  const startTime = req.nextUrl.searchParams.get("starttime")+"T00:00:00Z";
  const endTime = req.nextUrl.searchParams.get("endtime")+"T23:59:59Z";
  // แปลงเป็น ISO string ถ้ามีค่า
  //const startTimeISO = startTime ? new Date(startTime).toISOString() : undefined;
  //const endTimeISO = endTime ? new Date(endTime).toISOString() : undefined;
  const { workgroup_id } = params;
  //
 // console.log("workgroup_id=>", workgroup_id, "startTime=>", startTime, "endTime=>", endTime);

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
      
      var gap=20;       // maximum record for query per round 
      var numTotal=0;
      for (let i = 1; i <= 40; i++) {        
              var jobs,schedules;
              
                // สร้าง filter สำหรับ jobs โดยใช้ startTime และ endTime ถ้ามีค่า
                const jobFilter = { WORKGROUP_ID: workgroup_id };
                if (startTime) {
                jobFilter.updatedAt = { ...jobFilter.updatedAt, $gte: new Date(startTime) };
                }
                if (endTime) {
                jobFilter.updatedAt = { ...jobFilter.updatedAt, $lte: new Date(endTime) };
                }
                jobs = await Job.find(jobFilter)
                .sort({ createdAt: -1 })
                .skip((i - 1) * gap)
                .limit(gap);
              
              //if(jobs.length<=0){
              //  break;
              //}   
                // กรอง schedules ด้วย startTime และ endTime ถ้ามีค่า
                const scheduleFilter = { WORKGROUP_ID: workgroup_id };
                if (startTime) {
                  scheduleFilter.ACTIVATE_DATE = { ...scheduleFilter.ACTIVATE_DATE, $gte: new Date(startTime) };
                }
                if (endTime) {
                  scheduleFilter.ACTIVATE_DATE = { ...scheduleFilter.ACTIVATE_DATE, $lte: new Date(endTime) };
                }
                schedules = await Schedule.find(scheduleFilter)
                .sort({ createdAt: -1 })
                .skip((i - 1) * gap)
                .limit(gap);
                if(jobs.length<=0 && schedules.length<=0){
                  break;
                }


                //console.log("i="+i+",gap="+gap+",length="+jobs.length);                
              var io=0;
              const activaterPromises = jobs.map(async (job) => {
                const user = await User.findOne({ _id: job.ACTIVATE_USER });
                const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
                const activaterName = user?.EMP_NAME || "Unknown";
                const statusName = status?.status_name || "Unknown";
                const statusColor = status?.color || "Unknown";
                
               // console.log("job.SUBMITTED_BY.EMP_NAME",job.SUBMITTED_BY.EMP_NAME);

                 // บางเรคคอร์ดใช้ฟิลด์แยกชื่อ/อีเมล
                const submit_name = {
                  EMP_NAME:  job.SUBMITTED_BY_NAME  ?? job.SUBMITTED_BY?.EMP_NAME  ?? "-",
                 // EMP_EMAIL: job.SUBMITTED_BY_EMAIL ?? job.SUBMITTED_BY?.EMP_EMAIL ?? "",
                };
                //if(job){
                //    console.log(job.PUBLIC_EDIT_IN_WORKGROUP);
                //}
                
                //  if(job.JOB_TEMPLATE_NAME.includes("wichaya_for")){
                //      console.log('job',job);
                //      io++;
                //  }

                 if(numTotal===0){
                         console.log('job',job);
                         numTotal++;
                 }

                 //console.log("job",job);
                 
                 return {
                  //...job.toObject(),
                  _id:job._id,
                  SUBMITTED_BY: submit_name,
                  LINE_NAME:job.LINE_NAME,
                  JOB_NAME:job.JOB_NAME,
                  ACTIVATE_USER:job.ACTIVATE_USER,
                  createdAt:job.createdAt,
                  ACTIVATER_NAME: activaterName,
                  STATUS_NAME: statusName,
                  STATUS_COLOR: statusColor,
                  ITEM_ABNORMAL: job.VALUE_ITEM_ABNORMAL||false,
                  VALUE_ITEM_ABNORMAL:job.VALUE_ITEM_ABNORMAL,
                  updatedAt: job.updatedAt,
                  SUBMITTED_DATE: job.SUBMITTED_DATE,
                  JOB_VERIFY: job.IMAGE_FILENAME||job.IMAGE_FILENAME_2 ? true : false,
                  LAST_GET_BY:job.LAST_GET_BY || "Unknown",
                  LAST_GET_TIME:job.LAST_GET_TIME || "Unknown",
                  TYPE:job.TYPE || "Unknown",
                  //await checkItemAbNormal(job._id),
                  //PUBLIC_EDIT_IN_WORKGROUP: job.PUBLIC_EDIT_IN_WORKGROUP||false
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
                  //REVIEWS: "",
                  //WD_TAG: "",
                  //JOB_STATUS_ID: "",                  
                  LINE_NAME: schedule.LINE_NAME,
                  JOB_APPROVERS: [],
                  JOB_NAME: schedule.JOB_TEMPLATE_NAME,
                  DOC_NUMBER: schedule.DOC_NUMBER,                  
                  //CHECKLIST_VERSION: "",
                  //WORKGROUP_ID: "",
                  ACTIVATE_USER: "Scheduler",
                  //TIMEOUT: "",
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
              
             // console.log('activaterPromises',activaterPromises);
              
              const combinedPromises = [...activaterPromises, ...schedulePromises];
              let jobsWithActivater = await Promise.all(combinedPromises);
              
              //console.log('jobsWithActivater',jobsWithActivater);

              jobsWithActivater.sort((a, b) => {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
              });
             // numTotal+=jobsWithActivater.length;
              //------------------------------------------>>
              const json = JSON.stringify(jobsWithActivater);      // แปลงเป็น string
              const chunk = encoder.encode(json + '\n'); // ใส่ newline คั่นแต่ละ batch
              controller.enqueue(chunk);
              await new Promise(resolve => setTimeout(resolve, 500)); // delay 1 วิ
      }
      //console.log("จำนวนรอบที่ทำงานทั้งหมด numTotal="+numTotal);
      controller.enqueue(encoder.encode( '" จบการส่งข้อมูล"\n'));
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
