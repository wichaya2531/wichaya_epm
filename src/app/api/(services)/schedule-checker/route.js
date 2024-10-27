
import { Job } from "@/lib/models/Job";
import { NextResponse } from 'next/server';
import { Status } from "@/lib/models/Status";
import { addHours, addDays, addMonths } from 'date-fns';
import { connectToDb } from "@/app/api/mongo/index.js";
import { ActivateJobTemplate, getRevisionNo, sendEmails } from "@/lib/utils/utils";
import { Schedule } from "@/lib/models/Schedule";
import { User } from "@/lib/models/User";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Approves } from "@/lib/models/Approves";
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItem } from "@/lib/models/JobItem";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { Workgroup } from "@/lib/models/Workgroup";
import { ObjectId } from 'mongodb'; // นำเข้า ObjectId จาก mongodb library
import { Notified, Notifies } from "@/lib/models/Notifies.js";

async function getEmailfromUserID(userID) {
    try {
      const user = await User.findOne({ _id: new ObjectId(userID) });
      return user ? user.EMAIL : null;
    } catch (error) {
      console.error("Error:", error);
      return null;
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
}

const logText = async () => {
    const currentTime = new Date();
    const totalJobs = await Job.countDocuments();
    console.log("-----------------------------------------------------------")
    console.log("Checking for overdue jobs: ", currentTime.toLocaleString());
    console.log("Total Jobs Today: ", totalJobs);
    console.log("-----------------------------------------------------------")
}

export const POST = async (req, res) => {
    await connectToDb();
     // console.log("Checking for overdue jobs");
    // return NextResponse.json({ status: 200, file: "", error: "Job item templates not found" });    

    const jobs = await Job.find();
    const now = new Date();

    try {
        console.log("------Checking for Overdue Jobs--------");
        const overdueStatus = await Status.findOne({ status_name: 'overdue' });
        //console.log("overdueStatus=>",overdueStatus);   
        const checkOverdue = jobs.map(async (job) => {
            const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
       //     console.log("status=>",status);
            const statusName = status?.status_name || 'Unknown';
            //console.log("statusName=>",statusName);   
            const jobCreationTime = new Date(job.createdAt);
            const jobExpiryTime = await convertTimeout(job.TIMEOUT, job.createdAt);

       //     //check if job is overdue
            if (now > jobExpiryTime && statusName !== 'overdue' && statusName !== 'complete') {
               //console.log("Job is overdue: ", job);   
               job.JOB_STATUS_ID = overdueStatus._id;
               
               if (job.LINE_NAME === undefined) {
                       //console.log("LINE_NAME is undefined: ", job);
                       job.LINE_NAME = "Unknown";
               }    

               //console.log("Job is overdue: ", job);    
               await job.save();
            }

           const finalStatus = await Status.findOne({ _id: job.JOB_STATUS_ID });
           const finalStatusName = finalStatus?.status_name || 'Unknown';

           return {
               jobID: job._id,
               jobName: job.JOB_NAME,
               STATUS_NAME: finalStatusName
           };
        });
        await Promise.all(checkOverdue);
    } catch (error) {
        console.error("Check Overdue Error: ", error);
    }


    //-------------------------ค้นหา Schedual-------------------------
    try {
        console.log("-------Checking for active by schedual--------");
        const today = new Date(); // วันที่ปัจจุบัน
        const startDate = new Date(today); // สำเนาวันที่ปัจจุบัน
        startDate.setDate(today.getDate() - 1); // ลบ 1 วัน
        
        const endDate = new Date(today); // สำเนาวันที่ปัจจุบัน
        endDate.setDate(today.getDate()); // เพิ่ม 1 วัน


        const scheduler = await Schedule.find({
            /*EMP_NAME: 'scheduler',*/
            ACTIVATE_DATE: {
                $gte:  startDate ,  // วันเริ่มต้น (1 วันก่อนหน้า)
                $lte:  endDate    // วันสิ้นสุด (1 วันถัดไป)
            }
        });
        
        //console.log("scheduler=>",scheduler);
        scheduler.map(async (schedulers) => {
            //console.log("scheduler=>",scheduler);
            if (schedulers.ACTIVATE_DATE.toDateString() === now.toDateString() || schedulers.ACTIVATE_DATE < now) {
                //console.log(" schedulers.jobTemplateCreateID => ", schedulers.JOB_TEMPLATE_CREATE_ID );
                 //1 create job
                 //1.1 find job template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
                 const jobTemplate = await JobTemplate.findOne({JobTemplateCreateID : schedulers.JOB_TEMPLATE_CREATE_ID});
                 
                 if (!jobTemplate) {
                    console.log(" Job template not found :"+schedulers.JOB_TEMPLATE_CREATE_ID);
                    //return NextResponse.json({ status: 404, file : __filename, error : " Job template not found " });
                    return;
                 }
                
                 //1.2 find approvers where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid  1 job template can have multiple approvers
                  const approvers = await Approves.find({JobTemplateCreateID: schedulers.JOB_TEMPLATE_CREATE_ID });
                  if (!approvers) {
                    //   return NextResponse.json({ status: 404, file: __filename, error: "Approvers not found" });
                     console.log("Approvers not found :"+schedulers.JOB_TEMPLATE_CREATE_ID);
                     return;   
                  }

                const newID = await Status.findOne({ status_name: "new" });
                  if (!newID) {
                      console.log("Status not found :"+schedulers.JOB_TEMPLATE_CREATE_ID);
                      //return NextResponse.json({ status: 404, file: __filename, error: "Status not found" });
                      return;
                  }

                  //console.log("jobTemplate=>",jobTemplate);
                  //1.3 create job
                  const job = new Job({
                      JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
                      JOB_STATUS_ID: newID._id,
                      DOC_NUMBER: jobTemplate.DOC_NUMBER,
                      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
                      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
                      ACTIVATE_USER: schedulers._id,
                      JOB_APPROVERS: approvers.map((approverss) => approverss.USER_ID),
                      TIMEOUT : jobTemplate.TIMEOUT,
                      LINE_NAME: jobTemplate.LINE_NAME,
                  });
                
                  await job.save();
                
                 //console.log("Submit job Done=>",job);   

                //  //2 update to jobtemplateactivate
                 const jobTemplateActivate = new JobTemplateActivate({
                     JobTemplateID: jobTemplate._id,
                     JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
                     JOB_ID: job._id,
                 });
                 
                // console.log("jobTemplateActivate=>",jobTemplateActivate);

                 await jobTemplateActivate.save();

                  //3 create job item
                 //3.1 find job item template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
                 const jobItemTemplates = await JobItemTemplate.find({ JOB_TEMPLATE_ID: jobTemplate._id });
                 if (!jobItemTemplates) {
                     //return NextResponse.json({ status: 404, file: __filename, error: "Job item templates not found" });
                    console.log("Job item templates not found :"+schedulers.JOB_TEMPLATE_CREATE_ID);
                    return;                    
                 }


                //3.2 create job item
                 await Promise.all(jobItemTemplates.map(async (jobItemTemplate) => {
                    //console.log("jobItemTemplate=>",jobItemTemplate);
                      const jobItem = new JobItem({
                          JOB_ID: job._id,
                          JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
                          JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
                          UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
                          LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
                          TEST_METHOD: jobItemTemplate.TEST_METHOD,
                          TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
                          JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
                      });
                 //    console.log("jobItem=>",jobItem);
                     await jobItem.save();

                     const currentJobItems = await JobItem.find({ JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id });
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
                 }));
                 
                var userEmailNotified = [];
                try {
                    // ใช้ await เพื่อรอให้คำสั่ง find สำเร็จ
                    const notified = await Notifies.find({ JOB_TEMPLATE_ID: jobTemplate._id });
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
                        const approveEmail=await getEmailfromUserID(element);
                        emailFromApprover.push(approveEmail);
                    }
                  
                    //console.log("emailFromApprover=>",emailFromApprover);
                } catch (error) {
                    
                }
                var userEmails = emailFromApprover.concat(userEmailNotified);
                
                const activater = "Scheduler"
                const jobData = {
                    name: job.JOB_NAME,
                    activatedBy: activater,
                    timeout: job.TIMEOUT,
                };
                
               //console.log("jobData=>",jobData);   
               //console.log("userEmails=>",scheduler);
               await Schedule.deleteOne({ _id :new ObjectId( schedulers._id ) });                
               await sendEmails(userEmails, jobData);  

            }    

        });    
        console.log("Success Auto Activated!!");
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.error("Check schedual Error: ", error);
        return NextResponse.json({ status: 500, error: error.message });
    }  finally {
        await logText();
    }



  return;


    try {
        
        //console.log("EMP_NAME=>"+EMP_NAME);
      



         const JobTemplatesSchedule = await Schedule.find({
            /*EMP_NAME: 'scheduler',*/
            ACTIVATE_DATE: {
                $gte:  startDate ,  // วันเริ่มต้น (1 วันก่อนหน้า)
                $lte:  endDate    // วันสิ้นสุด (1 วันถัดไป)
            }
         });
        
         //console.log("JobTemplatesSchedule=>",JobTemplatesSchedule);
        





        

        


        const activateJobTemplatesSchedule = JobTemplatesSchedule.map(async (jobTemplateSchedule) => {
            ///console.log("scheduler=>",scheduler);    
           
            if (jobTemplateSchedule.ACTIVATE_DATE.toDateString() === now.toDateString() || jobTemplateSchedule.ACTIVATE_DATE < now) {
                
                console.log("jobTemplateSchedule=>",jobTemplateSchedule._id);   
                console.log("jobTemplateSchedule.ACTIVATE_DATE=>",jobTemplateSchedule.ACTIVATE_DATE);   
                console.log("scheduler._id=>",scheduler._id);   
                
                console.log("-----------------------");
                //  const JobTemplateID = jobTemplateSchedule.JOB_TEMPLATE_ID;
                //  const ACTIVATER_ID =  scheduler._id;
                //  const JobTemplateCreateID = jobTemplateSchedule.JOB_TEMPLATE_CREATE_ID;

                //  //1 create job
                //  //1.1 find job template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
                //  const jobTemplate = await JobTemplate.findOne({ _id: JobTemplateID, JobTemplateCreateID: JobTemplateCreateID });
                //  if (!jobTemplate) {
                //      return NextResponse.json({ status: 404, file: __filename, error: "Job template not found" });
                //  }
                //  //1.2 find approvers where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid  1 job template can have multiple approvers
                //  const approvers = await Approves.find({ JOB_TEMPLATE_ID: JobTemplateID, JobTemplateCreateID: JobTemplateCreateID });
                //  if (!approvers) {
                //      return NextResponse.json({ status: 404, file: __filename, error: "Approvers not found" });
                //  }

                //  const newID = await Status.findOne({ status_name: "new" });
                //  if (!newID) {
                //      return NextResponse.json({ status: 404, file: __filename, error: "Status not found" });
                //  }
                //  //1.3 create job
                //  const job = new Job({
                //      JOB_NAME: jobTemplate.JOB_TEMPLATE_NAME,
                //      JOB_STATUS_ID: newID._id,
                //      DOC_NUMBER: jobTemplate.DOC_NUMBER,
                //      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
                //      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
                //      ACTIVATE_USER: ACTIVATER_ID,
                //      JOB_APPROVERS: approvers.map((approver) => approver.USER_ID),
                //      TIMEOUT : jobTemplate.TIMEOUT,
                //      LINE_NAME: jobTemplate.LINE_NAME,
                //  });
                //  await job.save();

                //  //2 update to jobtemplateactivate
                // const jobTemplateActivate = new JobTemplateActivate({
                //     JobTemplateID: jobTemplate._id,
                //     JobTemplateCreateID: JobTemplateCreateID,
                //     JOB_ID: job._id,
                // });
                // await jobTemplateActivate.save();

                //  //3 create job item
                //  //3.1 find job item template where jobtemplateid = jobtemplateid and jobtemplatecreateid = jobtemplatecreateid
                // const jobItemTemplates = await JobItemTemplate.find({ JOB_TEMPLATE_ID: JobTemplateID });
                // if (!jobItemTemplates) {
                //     return NextResponse.json({ status: 404, file: __filename, error: "Job item templates not found" });
                // }


                // //3.2 create job item
                // await Promise.all(jobItemTemplates.map(async (jobItemTemplate) => {
                //     const jobItem = new JobItem({
                //         JOB_ID: job._id,
                //         JOB_ITEM_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
                //         JOB_ITEM_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
                //         UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
                //         LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
                //         TEST_METHOD: jobItemTemplate.TEST_METHOD,
                //         TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
                //         JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
                //     });
                //     await jobItem.save();


                //     const currentJobItems = await JobItem.find({ JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id });

                //     // if there is no job item yet
                //     if (currentJobItems.length === 1) {
                //         jobItem.BEFORE_VALUE = "None";
                //     } else {

                //         // Initialize BEFORE_VALUE with a default value
                //         let BEFORE_VALUE = "None";

                //         // Iterate to find the last job item with an actual value
                //         for (let i = currentJobItems.length - 2; i >= 0; i--) {
                //             if (currentJobItems[i].ACTUAL_VALUE) {
                //                 BEFORE_VALUE = currentJobItems[i].ACTUAL_VALUE;
                //                 break;
                //             }
                //         }

                //         // Set BEFORE_VALUE based on the found actual value or default value
                //         jobItem.BEFORE_VALUE = BEFORE_VALUE;

                //     }

                //     await jobItem.save();

                //     //4 update approves jobitemtemplateactivate
                //     const jobItemTemplateActivate = new JobItemTemplateActivate({
                //         JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
                //         JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
                //         JOB_ITEM_ID: jobItem._id,
                //     });
                //     await jobItemTemplateActivate.save();
                // }));

                // const workgroup = await Workgroup.findOne({ _id: jobTemplate.WORKGROUP_ID });
                // const userlist = workgroup ? workgroup.USER_LIST : [];
            
                // const userEmails = await Promise.all(userlist.map(async (user) => {
                //     const use = await User.findOne({ _id: user });
                //     return use.EMAIL;
                // }));
                
                // const activater = "Scheduler"
                // const jobData = {
                //     name: job.JOB_NAME,
                //     activatedBy: activater,
                //     timeout: job.TIMEOUT,
                // };
                

                // //await sendEmails(userEmails, jobData);  

                // await Schedule.deleteOne({ _id: jobTemplateSchedule._id });
            }

        })

        await Promise.all(activateJobTemplatesSchedule);  

        return NextResponse.json({ status: 200 });
    } catch (err) {
        console.log("Error: ", err);
        return NextResponse.json({ status: 500, error: err.message });
    } /*finally {
        await logText();
    }*/
}
