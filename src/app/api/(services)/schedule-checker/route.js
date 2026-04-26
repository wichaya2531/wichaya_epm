import { Job } from "@/lib/models/Job";
import { NextResponse } from "next/server";
import { Status } from "@/lib/models/Status";
import { addHours, addDays, addMonths } from "date-fns";
import { connectToDb } from "@/app/api/mongo/index.js";
import {
  ActivateJobTemplate,
  getRevisionNo,
  sendEmails,
} from "@/lib/utils/utils";
import { Schedule } from "@/lib/models/Schedule";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Approves } from "@/lib/models/Approves";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItem } from "@/lib/models/JobItem";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { Workgroup } from "@/lib/models/Workgroup";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
import { Notified, Notifies } from "@/lib/models/Notifies.js";
import { User } from "@/lib/models/User.js";
import { sendEmailsOverdude } from "@/lib/utils/sendemailoverdude";
//import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { EmailStack } from "@/lib/models/emailStacker";
import { ConstructionOutlined } from "@mui/icons-material";
import { trusted } from "mongoose";



async function getEmailfromUserID(userID) {
  try {
    const user = await User.findOne({ _id: new ObjectId(userID) });
    return user ? user.EMAIL : null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// async function getOverdueList(jobs) {
//    console.log("jobs",jobs);
//    //678084a22b28e758d534aa24
//    try {
//      const notifiesoverdues = await NotifiesOverdue.findOne({JOB_TEMPLATE_ID:jobs.JOB_TEMPLATE_ID});
//console.log("notifiesoverdues",notifiesoverdues);
//   //   return user ? user.EMAIL : null;
//    } catch (error) {
//      console.error("Error:", error);
//   //   return null;
//    }
//     //console.log("Overdue Jobs Job",jobs);

// }

const saveDatatoEmailStack = async (emailList,jobDataInfo) => {
  if (process.env.WD_INTRANET_MODE === false) {
    console.log("send emailList to=>", emailList);
    return;
  }

   const emailString = emailList.join(",");

try {
  await connectToDb();

  const safeMcTag = jobDataInfo?.mc_tag || {};
  const safeWdTag =
    typeof safeMcTag === "object" && safeMcTag !== null
      ? safeMcTag.WD_TAG || ""
      : "";
  const safeMachineName =
    typeof safeMcTag === "object" && safeMcTag !== null
      ? safeMcTag.MACHINE_NAME || ""
      : typeof safeMcTag === "string"
      ? safeMcTag
      : "";

  let detailsText = "";
  if (safeWdTag || safeMachineName) {
    detailsText = `Details: ${
      safeWdTag ? `WD_TAG: ${safeWdTag}` : ""
    }${
      safeWdTag && safeMachineName ? " | " : ""
    }${
      safeMachineName ? `MACHINE_NAME: ${safeMachineName}` : ""
    }`;
  }

  const _emailStacker = new EmailStack({
          EMAIL_SUBJECT: `${jobDataInfo?.linename || "-"} : ${
            jobDataInfo?.name || "-"
          } - CheckList activated`,
          EMAIL_TO: emailString,
          EMIAL_SENDER: "epm-system@wdc.com",
          EMAIL_CC: "",
          EMAIL_BODY: `
      You have a new checklist to do. Please check the EPM system for more details.
      ${detailsText}
      Checklist Name : ${jobDataInfo?.name || "-"}
      Job Line : ${jobDataInfo?.linename || "-"}
      Activated by: ${jobDataInfo?.activatedBy || "-"}
      Timeout: ${jobDataInfo?.timeout || "-"}
      Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
      `,
        });

        await _emailStacker.save();
      } catch (err) {
        if (process.env.NEXT_PUBLIC_DEBUG == "true") {
          console.log("Error Code : 002");
          console.error("📄 Stack trace:\n", err.stack);
        }
      }
}


const convertTimeout = async (timeout, createdAt) => {
  const startDate = new Date(createdAt);
  switch (timeout) {
    case "12 hrs":
      return addHours(startDate, 12);
    case "1 days":
      return addDays(startDate, 1);
    case "3 days":
      return addDays(startDate, 3);
    case "7 days":
      return addDays(startDate, 7);
    case "15 days":
      return addDays(startDate, 15);
    case "30 days":
      return addDays(startDate, 30);
    case "3 months":
      return addMonths(startDate, 3);
    case "6 months":
      return addMonths(startDate, 6);
    case "12 months":
      return addMonths(startDate, 12);
    default:
      return addHours(startDate, 12);
  }
};

const logText = async () => {
  const currentTime = new Date();
  const totalJobs = await Job.countDocuments();
  // console.log("-----------------------------------------------------------");
  // console.log("Checking for overdue jobs: ", currentTime.toLocaleString());
  // console.log("Total Jobs Today: ", totalJobs);
  // console.log("-----------------------------------------------------------");
};

//------------------สำหรับการ เชื่อมต่อ SSE ------->>
//import { eventsBus } from "@/lib/server/eventsBus";
import { addClient, removeClient, broadcast } from "@/lib/server/sseHub";
//--------------------------------------------->>



export const POST = async (req, res) => {
  await connectToDb();
  //console.log("Checking for overdue jobs");
  // return NextResponse.json({ status: 200, file: "", error: "Job item templates not found" });

  const lrv_Date = new Date();
  lrv_Date.setDate(lrv_Date.getDate() - 3);
  
  const jobs = await Job.find({
    updatedAt: { $gte: lrv_Date }
  })

 //อ่าน users เก็บไว้ใน Array ทั้งหมด 
  const users = await User.find().select("_id EMAIL").lean();
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u.EMAIL;
      return acc;
    }, {});
   

    const jobItemTemplatess = await JobItemTemplate.find()
    .select(`
      _id
      JOB_ITEM_TEMPLATE_TITLE
      JOB_ITEM_TEMPLATE_NAME
      JobItemTemplateCreateID
      JOB_TEMPLATE_ID
      UPPER_SPEC
      LOWER_SPEC
      TEST_METHOD
      TEST_LOCATION_ID
      INPUT_TYPE
      pos
    `)
    .lean();


  //console.log('jobItemTemplateMap',jobItemTemplateMap);
  //console.log('ค้นหา Item ',jobItemTemplateMap['688cdabff0e066c0f49f597d']);


  const now = new Date();
 // return NextResponse.json({ status: 200 });
  
  const overdue_check=false;
  if (overdue_check) {
              try {
              //console.log("------Checking for Overdue Jobs--------");
              const overdueStatus = await Status.findOne({ status_name: "overdue" });
              //console.log('overdueStatus',overdueStatus);
            // console.log('lrv_Date-3 คือเวลา ',lrv_Date);
            // console.log('จำนวนงานทั้งหมดที่เจอในระบบ' , jobs.length);

              // ทำการตรวจสอบและเปลี่ยนสถานะของงาน

              var num=0;

              const checkOverdue = jobs.map(async (job) => {
                        const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
                        const statusName = status?.status_name || "Unknown";
                        const jobCreationTime = new Date(job.createdAt);
                        const jobExpiryTime = await convertTimeout(job.TIMEOUT, job.createdAt);

                        // if (num===0) {
                        //      console.log('infomation _id',job._id);
                        //      console.log('infomation TIMEOUT',job.TIMEOUT);
                        //      console.log('jobExpiryTime',jobExpiryTime);
                        //      console.log('All Infomation ',job);
                        // }   
                        // num++;
                        // return NextResponse.json({ status: 200 });
                        // ตรวจสอบว่าเวลาปัจจุบันเกินเวลาที่กำหนดแล้ว และงานยังไม่ได้มีสถานะเป็น "overdue" หรือ "complete"
                        if (
                          now > jobExpiryTime &&
                          statusName !== "overdue" &&
                          statusName !== "complete" && statusName !== "waiting for approval"
                        ) {
                          // เปลี่ยนสถานะเป็น "overdue"
                          job.JOB_STATUS_ID = overdueStatus._id;

                          if (job.LINE_NAME === undefined) {
                            job.LINE_NAME = "Unknown";
                          }
                          //    getOverdueList(job);
                          //console.log("Notify Overdue List : ",job.OVERDUE_NOTIFYS);

                          //console.log('ค้นพบเจองานที่ Overdue!!',job);  
                          //return NextResponse.json({ status: 200 });

                          let overdueEmailList = [];
                          if (job.OVERDUE_NOTIFYS && Array.isArray(job.OVERDUE_NOTIFYS)) {
                            for (const overdueListId of job.OVERDUE_NOTIFYS) {
                              const email = await getEmailfromUserID(overdueListId); // ใช้ getEmailfromUserID ดึงอีเมล
                              if (email) {
                                overdueEmailList.push(email); // เก็บอีเมลในรายการ
                              }
                            }
                          }

                          //console.log("overdueEmailList",overdueEmailList);

                          //return NextResponse.json({ status: 200 });

                          //บันทึกงานที่เปลี่ยนสถานะ
                          await job.save();

                          // ดึงข้อมูลผู้อนุมัติจาก JOB_APPROVERS
                          let emailList = [];
                          if (job.JOB_APPROVERS && Array.isArray(job.JOB_APPROVERS)) {
                            for (const approverId of job.JOB_APPROVERS) {
                              const email = await getEmailfromUserID(approverId); // ใช้ getEmailfromUserID ดึงอีเมล
                              if (email) {
                                emailList.push(email); // เก็บอีเมลในรายการ
                              }
                            }
                          }

                          // ตรวจสอบว่าเราได้อีเมลล์จาก ACTIVATE_USER หรือไม่
                          const activater = await User.findOne({ _id: job.ACTIVATE_USER }).select(
                            "EMAIL"
                          );
                          if (activater && activater.EMAIL) {
                            emailList.push(activater.EMAIL); // ใส่อีเมลของผู้สร้างงาน
                          }

                          // ตรวจสอบว่า emailList มีข้อมูลหรือไม่
                          if (overdueEmailList.length > 0) {
                            //emailList = [...new Set(emailList)]; // กำจัดอีเมลที่ซ้ำกัน
                            //console.log("OVERDUE send emailList to=>", overdueEmailList); // แสดง emailList ที่จะส่ง
                            // ส่งอีเมลไปยังผู้อนุมัติและผู้สร้างงาน
                            //await sendEmailsOverdude(overdueEmailList, job); // ฟังก์ชันการส่งอีเมล ปิดเพื่อทดสอบ
                          } else {
                                //console.log("No email found for the approver."); // กรณีที่ไม่พบอีเมลล์
                          }
                        }

                        // ดึงสถานะสุดท้ายของงาน
                        const finalStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
                        const finalStatusName = finalStatus?.status_name || "Unknown";

                        return {
                          jobID: job._id,
                          jobName: job.JOB_NAME,
                          STATUS_NAME: finalStatusName,
                        };
              });

              await Promise.all(checkOverdue);
            } catch (error) {
              console.error("Check Overdue Error: ", error);
            }

  }
  
  //-------------------------ค้นหา Schedual-------------------------
  try {
    // console.log("-------Checking for active by schedual--------");
    // const today = new Date(); // วันที่ปัจจุบัน
    // const startDate = new Date(today); // สำเนาวันที่ปัจจุบัน
    // startDate.setDate(today.getDate() - 1); // ลบ 1 วัน

    // const endDate = new Date(today); // สำเนาวันที่ปัจจุบัน
    // endDate.setDate(today.getDate()); // เพิ่ม 1 วัน

    // const scheduler = await Schedule.find({
    //   /*EMP_NAME: 'scheduler',*/
    //   ACTIVATE_DATE: {
    //     $gte: startDate, // วันเริ่มต้น (1 วันก่อนหน้า)
    //     $lte: endDate, // วันสิ้นสุด (1 วันถัดไป)
    //   },
    // });

    // console.log("scheduler=>",scheduler);

    //console.log("-------Checking for active by schedule (±60 minutes)--------");
    
    const baseDate = new Date();//เวลาปัจจุบัน
    //const baseDate = new Date(2026, 2, 1, 0, 0, 0); // กำหนดเวลาใดๆ   เดือน ต้อง-1 เสมอ

    //const now = new Date(); // เวลาปัจจุบัน
    const startTime = new Date(baseDate); // สำเนาเวลาปัจจุบัน
    startTime.setMinutes(startTime.getMinutes() - 60); // ลบ 60 นาที
    console.log('startTime',startTime);
    
    const endTime = new Date(baseDate); // สำเนาเวลาปัจจุบัน
    endTime.setMinutes(startTime.getMinutes() + 60); // เพิ่ม 60 นาที
    console.log('endTime',endTime);
    //console.log("scheduler startTime:",startTime);  
    //console.log("scheduler endTime:",endTime);  
    // console.time("schedual-check-start");

    const scheduler = await Schedule.find({
      //_id:new ObjectId('685bafc08b0fe0aeab1b128c'),
      //WORKGROUP_ID:"66a083975eb2368f98ece93e",  คัดกรองเอาเฉพาะ กลุ่ม ESD-RT
       ACTIVATE_DATE: {
         $gte: startTime, // เวลาที่มากกว่าหรือเท่ากับ startTime (60 นาทีก่อนหน้า)
         $lte: endTime, // เวลาที่น้อยกว่าหรือเท่ากับ endTime (60 นาทีถัดไป)
       },
      STATUS:"plan", 
    }).limit(120);
      
    console.log("scheduler ที่ค้นหาเจอ=>", scheduler.length);
    //  console.log("***********schedual ที่ค้นเจอ**********************");
    //          console.log('scheduler',scheduler);
    //  console.log("************************************************");
    
    //return NextResponse.json({ status: 200 });// เปิด เพื่อทำการทดสอบ
    
    var workgroup_id_list=new Array();

    scheduler.map(async (schedulers) => {
      
      const activateDate = schedulers.ACTIVATE_DATE;
      
      if (!workgroup_id_list.some(id => String(id) === String(schedulers.WORKGROUP_ID))) {
        workgroup_id_list.push(schedulers.WORKGROUP_ID);
      }

        const jobTemplate = await JobTemplate.findOne({
          //JobTemplateCreateID: schedulers.JOB_TEMPLATE_CREATE_ID,
          _id:schedulers.JOB_TEMPLATE_ID
        });


        //console.log('jobTemplate ที่ค้นเจอ ',jobTemplate);
        if (!jobTemplate) {
          console.log(
            " Job template not found :" + schedulers.JOB_TEMPLATE_CREATE_ID
          );
          //return NextResponse.json({ status: 404, file : __filename, error : " Job template not found " });
          return;
        }


      
        //1.2 find approvers where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid  1 job template can have multiple approvers

      
       const _JobTemplate=await JobTemplate.findById(schedulers.JOB_TEMPLATE_ID);
     
        const approvers = await Approves.find({
          JOB_TEMPLATE_ID: schedulers.JOB_TEMPLATE_ID,
          JobTemplateCreateID: _JobTemplate.JobTemplateCreateID,
        });
        if (!approvers) {
          console.log("ไม่พบผู้ Approve");
          return;
        }

        const newID = await Status.findOne({ status_name: "new" });
        if (!newID) {
          console.log("Status not found :" + schedulers.JOB_TEMPLATE_CREATE_ID);
          return;
        }
      
        //1.3 create job
        const job = new Job({
          JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
          JOB_TEMPLATE_ID: jobTemplate._id, // ต้องระบุเพื่อให้รู้ว่า job นี้มาจาก job template ไหน
          JOB_STATUS_ID: newID._id,
          DOC_NUMBER: jobTemplate.DOC_NUMBER,
          CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
          WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
          ACTIVATE_USER: schedulers._id,
          JOB_APPROVERS: approvers.map((approverss) => approverss.USER_ID),
          TIMEOUT: jobTemplate.TIMEOUT,
          LINE_NAME: schedulers.LINE_NAME,
          WD_TAG: schedulers?.MC_TAG?.WD_TAG || "",
          PICTURE_EVEDENT_REQUIRE: jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
          AGILE_SKIP_CHECK : jobTemplate.AGILE_SKIP_CHECK || false,
          SORT_ITEM_BY_POSITION : jobTemplate.SORT_ITEM_BY_POSITION || false,
          PROFILE_GROUP: schedulers.PROFILE_GROUP || "Unknown",
        
          createdAt: activateDate, //แบบระบุเวลา
          updatedAt: activateDate, //แบบระบุเวลา

        });        
        // await job.save(); // แบบไม่ระบุเวลา
        await job.save({ timestamps: false }); // แบบระบุเวลา 

        //return NextResponse.json({ status: 200 });  //-->Check         
        //  //2 update to jobtemplateactivate
        const jobTemplateActivate = new JobTemplateActivate({
          JobTemplateID: jobTemplate._id,
          JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
          JOB_ID: job._id,
        });
         await jobTemplateActivate.save();
        
       
        //3 create job item
        // const jobItemTemplates = await JobItemTemplate.find({
        //   JOB_TEMPLATE_ID: jobTemplate._id,
        // });
        //console.log('_id ที่ต้องการ ค้นหา ',jobTemplate._id.toString());

       const jobTemplateId = jobTemplate?._id?.toString();
        const jobItemTemplates = jobItemTemplatess.filter(t =>
          t?.JOB_TEMPLATE_ID?.toString() === jobTemplateId
        );
        //console.log('jobItemTemplates ที่ค้นหา ',jobItemTemplates);

        if (!jobItemTemplates) {
          //return NextResponse.json({ status: 404, file: __filename, error: "Job item templates not found" });
          console.log(
            "Job item templates not found :" + schedulers.JOB_TEMPLATE_CREATE_ID
          );
          return;
        }

       // 3.2 create job item (sequential)
        let countItemIndex = 1;
        for (const jobItemTemplate of jobItemTemplates) {
          const jobItem = new JobItem({
            JOB_ID: job._id,
            JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
            JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
            UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
            LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
            TEST_METHOD: jobItemTemplate.TEST_METHOD,
            TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
            JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
            BEFORE_VALUE2: null,
            BEFORE_VALUE: "None",
            INPUT_TYPE: jobItemTemplate.INPUT_TYPE || "All",
            POS:(jobItemTemplate.pos ?? 0) > 0
                ? jobItemTemplate.pos
                : countItemIndex,
            createdAt: new Date(),
          });

          await jobItem.save();

          const jobItemTemplateActivate = new JobItemTemplateActivate({
            JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
            JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
            JOB_ITEM_ID: jobItem._id,
          });
          await jobItemTemplateActivate.save();
         // console.log('countItemIndex=>',countItemIndex);  
          countItemIndex++;
        }
        
        
         //-------------------ส่ง email หาคนที่ จะรับแจ้งเตือน---------------------------
        var userEmailNotified = [];
        try {
          // ใช้ await เพื่อรอให้คำสั่ง find สำเร็จ  1234
          const notified = await Notifies.find({
            JOB_TEMPLATE_ID: jobTemplate._id,
          });
          // ใช้ for...of loop เพื่อรองรับการใช้ await ในลูป
          for (const element of notified) {
            //console.log("element->USER_ID", element.USER_ID); // แสดง USER_ID ที่ได้รับ
            const email = userMap[element.USER_ID]; // await getEmailfromUserID(element.USER_ID); // รอให้ getEmailfromUserID คืนค่า
            //console.log("element->USER_ID->Email", email); // แสดง email ที่ได้รับ
            userEmailNotified.push(email); // เก็บข้อมูลใน array
          }
        } catch (error) {
          console.error("Error:", error);
        }
        
       //-------------------ส่ง email หาคนที่ จะ Approve---------------------------
        var emailFromApprover = [];
        try {
          for (const element of job.JOB_APPROVERS) {
            const approveEmail =userMap[element]; //await getEmailfromUserID(element);
            emailFromApprover.push(approveEmail);
          }

          //console.log("emailFromApprover=>",emailFromApprover);
        } catch (error) {}
        var userEmails = emailFromApprover.concat(userEmailNotified);

        const activater = "Scheduler";
        const jobData = {
          name: job.JOB_NAME,
          mc_tag: schedulers.MC_TAG || "",
          activatedBy: activater,
          timeout: job.TIMEOUT,
          linename:job.LINE_NAME,
        };
        //-------------------------------------------------------------------------
        // console.log("jobData=>", jobData);
        // console.log("userEmails=>", scheduler);
        //console.log("กำลังลบ schedulers._id ",schedulers._id);
        await Schedule.deleteOne({ _id: new ObjectId(schedulers._id) });
        await saveDatatoEmailStack(userEmails, jobData);
    });

    //console.timeEnd("schedual-check-start");
    console.log("--Done--");
    try{

             for (const element of workgroup_id_list) {
               const topic = String(element);

              //-------------------------SSE----------------------------->>
                      try{
                              var workgroup_id="";
                              //if(isJob){
                                  workgroup_id=topic;
                              //}else{
                              //   workgroup_id=findSchedual.WORKGROUP_ID;
                              // }
                              if (typeof workgroup_id === 'object' && workgroup_id !== null) {
                                // ตรวจสอบว่าเป็น ObjectId ของ MongoDB จริง ๆ
                                if (workgroup_id.toString) {
                                  workgroup_id = workgroup_id.toString();
                                }
                              }

                                try {
                                  //const payload = { JOB_ID: job._id};
                                  broadcast(workgroup_id, "refresh");
                                } catch (err) {
                                  console.error("emit error:", err);
                                } 
                              
                      }catch(err){
                            console.log("SSE error ",err);
                      }

                //--------------------------------------------------------->>

             }
      
    }catch(err){
          console.log("schedual-checker error");
    }
   //console.log("Success Auto Activated!!");
    return NextResponse.json({ status: 200 ,message:"Success Auto Activated!!"});
  } catch (error) {
    console.error("Check schedual Error: ", error);
    return NextResponse.json({ status: 500, error: error.message });
  } finally {
    await logText();
  }
};
