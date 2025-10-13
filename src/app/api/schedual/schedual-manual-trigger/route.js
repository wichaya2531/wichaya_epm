import { NextResponse } from "next/server.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { Machine } from "@/lib/models/Machine";
import { Workgroup } from "@/lib/models/Workgroup";
import { User } from "@/lib/models/User.js";
import { TestLocation } from "@/lib/models/TestLocation";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobApproves } from "@/lib/models/JobApprove";
import { Schedule } from "@/lib/models/Schedule.js";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Approves } from "@/lib/models/Approves";
import { EmailStack } from "@/lib/models/emailStacker";
import { Notified, Notifies } from "@/lib/models/Notifies.js";


const saveDatatoEmailStack = async (emailList,jobDataInfo) => {
  if (process.env.WD_INTRANET_MODE === false) {
    console.log("send emailList to=>", emailList);
    return;
  }

   const emailString = emailList.join(",");
    try{
           await connectToDb();
           const _emailStacker = new EmailStack({
               EMAIL_SUBJECT: `${jobDataInfo.linename} : ${jobDataInfo.name} - CheckList activated `,
               EMAIL_TO:emailString,
               EMIAL_SENDER: "epm-system@wdc.com",
               EMAIL_CC:'',
               EMAIL_BODY:`
                        You have a new checklist to do. Please check the EPM system for more details.
                        Details:
                        Checklist Name : ${jobDataInfo.name}
                        Job Line  : ${jobDataInfo.linename}
                        Activated by: ${jobDataInfo.activatedBy}
                        Timeout: ${jobDataInfo.timeout}
                        Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
                        `,
          });      
          //console.log('_emailStacker',_emailStacker);
          await _emailStacker.save();
          //console.log("บันทึกสำเร็จ");
    }catch(err){
      console.error(err);
    }
}


//export const dynamic = "force-dynamic";
export const POST = async (req, res) => {

  await connectToDb();
  const body = await req.json();
  const schedual_id = body._id?.[0]; // ✅ ดึง _id จาก array
 // return NextResponse.json({ status: 200, message: "Trigger สำเร็จ" });
 // console.log('schedual_id',schedual_id);
 // const datetime = body.datetime;

  //console.log("Hello World");

  // const isJob=await Job.findById(job_ids);


  try {

    const scheduler = await Schedule.find({
        _id:new ObjectId(schedual_id)
    });
   // console.log('schedual ที่ค้นเจอ ',scheduler);
    // scheduler.map(async (schedulers) => {
    //             console.log('schedulers',schedulers);
    // });


    // return NextResponse.json({ status: 200, message: "Trigger สำเร็จ" });

    scheduler.map(async (schedulers) => {
        //1 create job
        //1.1 find job template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
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

       //console.log('jobTemplate_id',schedulers.JOB_TEMPLATE_ID);//jmp:1234
       const _JobTemplate=await JobTemplate.findById(schedulers.JOB_TEMPLATE_ID);


        const approvers = await Approves.find({
          JOB_TEMPLATE_ID: schedulers.JOB_TEMPLATE_ID,
          JobTemplateCreateID: _JobTemplate.JobTemplateCreateID,
        });


        if (!approvers) {
          return;
        }

        const newID = await Status.findOne({ status_name: "new" });
        if (!newID) {
          console.log("Status not found :" + schedulers.JOB_TEMPLATE_CREATE_ID);
          //return NextResponse.json({ status: 404, file: __filename, error: "Status not found" });
          return;
        }

        //1.3 create job
        const job = new Job({
          JOB_TEMPLATE_ID: jobTemplate._id,
          JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
          JOB_STATUS_ID: newID._id,
          DOC_NUMBER: jobTemplate.DOC_NUMBER,
          CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
          WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
          ACTIVATE_USER: schedulers._id,
          JOB_APPROVERS: approvers.map((approverss) => approverss.USER_ID),
          TIMEOUT: jobTemplate.TIMEOUT,
          LINE_NAME: schedulers.LINE_NAME,
          PICTURE_EVEDENT_REQUIRE: jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
          AGILE_SKIP_CHECK : jobTemplate.AGILE_SKIP_CHECK || false,
          SORT_ITEM_BY_POSITION : jobTemplate.SORT_ITEM_BY_POSITION || false,
           PROFILE_GROUP: jobTemplate.PROFILE_GROUP || "Unknown",
        });
         //console.log("job=>",job);
         await job.save();
         //return NextResponse.json({ status: 200 });
        //  //2 update to jobtemplateactivate
        //try {
          const jobTemplateActivate = new JobTemplateActivate({
                JobTemplateID: jobTemplate._id,
                JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
                JOB_ID: job._id,
              });

              //console.log("jobTemplateActivate=>",jobTemplateActivate);

              await jobTemplateActivate.save();
              //console.log("jobTemplateActivate=>", jobTemplateActivate);  
      // // } catch (error) {
       //   console.error("Error saving jobTemplateActivate:", error);
       // }


        //3 create job item
        //3.1 find job item template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
        const jobItemTemplates = await JobItemTemplate.find({
          JOB_TEMPLATE_ID: jobTemplate._id,
        });
        if (!jobItemTemplates) {
          //return NextResponse.json({ status: 404, file: __filename, error: "Job item templates not found" });
          console.log(
            "Job item templates not found :" + schedulers.JOB_TEMPLATE_CREATE_ID
          );
          return;
        }

        //3.2 create job item
        await Promise.all(
          jobItemTemplates.map(async (jobItemTemplate) => {
           // console.log("jobItemTemplate=>",jobItemTemplate);
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
              INPUT_TYPE:jobItemTemplate.INPUT_TYPE||"All",
              POS:jobItemTemplate.pos||0,
            });
           // console.log("jobItem=>",jobItem);
            await jobItem.save();

            const currentJobItems = await JobItem.find({
              JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
            });
            // if there is no job item yet
            if (currentJobItems.length === 1) {
              jobItem.BEFORE_VALUE = "None";
            } else {
              // Initialize BEFORE_VALUE with a default value
              let BEFORE_VALUE = "None";
              // Iterate to find the last job item with an actual value
              for (let i = currentJobItems.length - 2; i >= 0; i--) {
                if (currentJobItems[i].ACTUAL_VALUE) {
                  BEFORE_VALUE = currentJobItems[i].ACTUAL_VALUE;
                  break;
                }
              }
              // Set BEFORE_VALUE based on the found actual value or default value
              jobItem.BEFORE_VALUE = BEFORE_VALUE;
            }

            await jobItem.save();

            //4.update approves jobitemtemplateactivate
            const jobItemTemplateActivate = new JobItemTemplateActivate({
              JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
              JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
              JOB_ITEM_ID: jobItem._id,
            });
             await jobItemTemplateActivate.save();
          })
        );

        var userEmailNotified = [];
        try {
          // ใช้ await เพื่อรอให้คำสั่ง find สำเร็จ
          const notified = await Notifies.find({
            JOB_TEMPLATE_ID: jobTemplate._id,
          });
          // ใช้ for...of loop เพื่อรองรับการใช้ await ในลูป
          for (const element of notified) {
            //console.log("element->USER_ID", element.USER_ID); // แสดง USER_ID ที่ได้รับ
            const email = await getEmailfromUserID(element.USER_ID); // รอให้ getEmailfromUserID คืนค่า
            //console.log("element->USER_ID->Email", email); // แสดง email ที่ได้รับ
            userEmailNotified.push(email); // เก็บข้อมูลใน array
          }
        } catch (error) {
          console.error("Error:", error);
        }

        var emailFromApprover = [];
        try {
          for (const element of job.JOB_APPROVERS) {
            const approveEmail = await getEmailfromUserID(element);
            emailFromApprover.push(approveEmail);
          }

          //console.log("emailFromApprover=>",emailFromApprover);
        } catch (error) {}
        var userEmails = emailFromApprover.concat(userEmailNotified);

        const activater = "Scheduler";
        const jobData = {
          name: job.JOB_NAME,
          activatedBy: activater,
          timeout: job.TIMEOUT,
          linename:job.LINE_NAME,
        };

        // console.log("jobData=>", jobData);
        // console.log("userEmails=>", scheduler);
        await Schedule.deleteOne({ _id: new ObjectId(schedulers._id) });
        await saveDatatoEmailStack(userEmails, jobData);
      //  await sendEmails(userEmails, jobData);
      //}
    });

    //const schedualsDelete=await Schedule.findByIdAndDelete(schedual_id);
    return NextResponse.json({ status: 200, message: "Trigger สำเร็จ" });
  } catch (error) {
    console.error("ลบไม่สำเร็จ:", error);
    return NextResponse.json({ status: 500, message: "Trigger ไม่สำเร็จ", error: error.message });
  }
  return;
  //const JobItemID = searchParams.get("id");
  //const JobItemvalue = searchParams.get("value");

  //const JobTemplateID = searchParams.get("job_key");
  //const ACTIVE_LINE_NAME = searchParams.get("line");
  //const ACTIVE_USER_ID = searchParams.get("user_id");

  //console.log('JobItemID',JobItemID);
  //console.log('JobItemValue',JobItemvalue);  

   try {  
     const jobItem = await JobItem.findOne({ _id: JobItemID });
     jobItem.ACTUAL_VALUE = JobItemvalue;
     await jobItem.save();

      return NextResponse.json({
        status: 200
        // ,
        // jobData: jobData,
        // jobItemData: jobItemData,
      });
  } catch (err) {
      console.log(err);
      return NextResponse.json({
        status: 500,      
        error: err.message,
      });
    }
};
