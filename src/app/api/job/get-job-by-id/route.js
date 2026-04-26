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
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
import { ProfileGroup } from "@/lib/models/ProfileGroup";

// const getPositionTimeByJobItem = async (jobItemID) => {
//   const jobItem = await JobItem.findOne({ JOB_ITEM_TEMPLATE_ID: jobItemID });
//   //console.log(jobItem.createdAt);
//   return jobItem.createdAt;
// };

// const getGuideInputByJobItem = async (jobItemID) => {
//   const jobItem = await JobItem.find({ JOB_ITEM_TEMPLATE_ID: jobItemID });

//   var guideInput = [];
//   jobItem.map((item) => {
//     if (
//       item.ACTUAL_VALUE !== null &&
//       !["pass", "fail"].includes(item.ACTUAL_VALUE.toLowerCase()) &&
//       isNaN(item.ACTUAL_VALUE) // เพิ่มเงื่อนไขไม่เอาตัวเลข
//     ) {
//       guideInput.push(item.ACTUAL_VALUE);
//     }
//   });
//   guideInput = [...new Set(guideInput)];
//   return guideInput;
// };

export const dynamic = "force-dynamic";


// async function getApproverName(user_id) {
//         //console.log('user_id',user_id);
//         try {

//                       const userApprove = await User.findOne({
//                         _id: new ObjectId( user_id[0] ),
//                       });

//                      //console.log("userApprove ",userApprove);   
//                      return userApprove.EMP_NAME;
//         } catch (error) {
//                 //console.log(error);
//         }
//         return "unknown";
// }

export const GET = async (req, res) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;
  const JobID = searchParams.get("job_id");
  const user_id = searchParams.get("user_id");


  //console.log('user_id =>', user_id);
  

  //console.log('JobID=>', JobID);
  

  try {
   // let machineName;
    const job = await Job.findOne({ _id: JobID });
   // console.log('job in try =>', job);
    if (!job)
      return NextResponse.json({
        status: 404,
        message: "Checklist has been deleted already, or wrong ChecklistID",
      });
   
    const profileGroupsArr = await ProfileGroup.find().lean();
    const profileGroups = profileGroupsArr.reduce((acc, group) => {
        acc[group._id] = group.PROFILE_NAME;
        return acc;
    }, {});
    //console.log('profileGroupsArr =>', profileGroupsArr);
    
    //console.log('profileGroups =>', profileGroups);

    //sort lastest come last
    //const jobItems = await JobItem.find({ JOB_ID: JobID }).sort({
   //   createdAt: -1,
    //});
   // const workgroup = await Workgroup.findOne({ _id: job.WORKGROUP_ID });
    //const workgroupName = workgroup ? workgroup.WORKGROUP_NAME : null;
   // const user = await User.findOne({ _id: job ? job.ACTIVATE_USER : null });
    //const activatedBy = user ? user.EMP_NAME : null;
    //const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
    //const statusName = status ? status.status_name : null;

    // if (job.WD_TAG) {
    //   const machine = await Machine.findOne({ WD_TAG: job.WD_TAG });
    //   machineName = machine ? machine.MACHINE_NAME : null;
    // } else {
    //   machineName = null;
    // }

     //console.log('job=>', job);
             // const activaterPromises = jobs.map(async (job) => {
                const user = await User.findOne({ _id: job.ACTIVATE_USER });
                const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
                const activaterName = user?.EMP_NAME || "Unknown";
                const statusName = status?.status_name || "Unknown";
                const statusColor = status?.color || "Unknown";
                //console.log('user=>', user);  

    const submit_name = {
        EMP_NAME:  job.SUBMITTED_BY_NAME  ?? job.SUBMITTED_BY?.EMP_NAME  ?? "-",
        EMP_NUMBER: job.SUBMITTED_BY?.EMP_NUMBER  ?? "-",      
        // EMP_EMAIL: job.SUBMITTED_BY_EMAIL ?? job.SUBMITTED_BY?.EMP_EMAIL ?? "",
    };
   // console.log('job in try=>', job);
    const jobData = {
        _id:job._id,                  
        SUBMITTED_BY: submit_name,
        LINE_NAME:job.LINE_NAME,
        JOB_NAME:job.JOB_NAME,
        JOB_APPROVERS: job.JOB_APPROVERS,
        APPROVE_ALLOW :job.JOB_APPROVERS?.includes(user_id) && ((statusName || "Unknown") && statusName=="waiting for approval"  ),
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
        PROFILE_GROUP: await profileGroups[job.PROFILE_GROUP] || "Unknown",
        //await checkItemAbNormal(job._id),
        PUBLIC_EDIT_IN_WORKGROUP: job.PUBLIC_EDIT_IN_WORKGROUP||false
    };    

    return NextResponse.json({
      status: 200,
      jobData: jobData,
     // jobItemData: jobItemData,
    });
  } catch (err) {
     if(process.env.NEXT_PUBLIC_DEBUG=="true"){
            console.log(err);
            console.log("Error Code : 029");
     }
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
