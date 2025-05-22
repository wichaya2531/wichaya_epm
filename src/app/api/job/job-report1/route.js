import { connectToDb } from "@/app/api/mongo/index";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Workgroup } from "@/lib/models/Workgroup.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status.js";



function addTime(date, hours, minutes) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
}
async function getStatusNameById(status_id) {
        try {
                const status=await Status.findById(status_id);
                //console.log('status',status);
                return status.status_name;
        } catch (error) {
                return "Error";
        }
}


export const GET = async (req, res) => {
  await connectToDb();
  //console.time("Query Execution Time"); // เริ่มจับเวลา
  //console.log("get report start ",new Date());
  const searchParams = req.nextUrl.searchParams;
  //console.log('searchParams',searchParams); 


  
  const startDate = addTime(new Date(searchParams.get('start')), -24,0); // เพิ่ม 7 ชั่วโมง

  const rawEndDate = addTime(new Date(searchParams.get('end')), 23, 59);
  // const now = new Date();
  // now.setDate(now.getDate() + 1); // บวก 1 วัน
  const endDate = rawEndDate;
  // const endDate = rawEndDate > now ? now : rawEndDate;

  //console.log('startDate',startDate);
  //console.log('endDate',endDate);
 
  const workgroup_name =searchParams.get('workgroup');   // กลุ่มงาน 
  //console.log('workgroup_name',workgroup_name);
  const workgroupID = await Workgroup.findOne({WORKGROUP_NAME:workgroup_name})||{_id:0};  


  try {
   // console.time("Query Execution Time"); // เริ่มจับเวลา
      var jobValues;
      {
           jobValues = await Job.aggregate([
                {
                  $match: {
                    updatedAt: {
                      $gte: startDate,
                      $lte: endDate
                    },
                    WORKGROUP_ID:workgroupID._id.toString() // หรือ workgroupID._id ถ้าใน DB เก็บเป็น ObjectId
                  }
                },
                {
                  $lookup: {
                    from: "jobitems",
                    localField: "_id",
                    foreignField: "JOB_ID",
                    as: "jobItems"
                  }
                },
                {
                  $unwind: {
                    path: "$jobItems",
                    preserveNullAndEmptyArrays: false
                  }
                },
                {
                  $match: {
                  //  "jobItems.ACTUAL_VALUE": { $ne: null },
                    "jobItems.updatedAt": { $ne: null },
                    "LINE_NAME": { $ne: null },
                    "DOC_NUMBER": { $ne: null },
                    "JOB_STATUS_ID":{ $ne: null },
                    "jobItems.JOB_ITEM_NAME": { $ne: null },
                    "jobItems.JOB_ITEM_TITLE": { $ne: null },
                    //"jobItems.FILE": { $ne: null },
                    //"jobItems._id": { $ne: null },
                  }
                },
                {
                  $project: {
                    _id: 0,
                    WORKGROUP_NAME: workgroup_name,
                    LINE_NAME: "$LINE_NAME",
                    DOC_NUMBER: "$DOC_NUMBER",
                    JOB_STATUS:"$JOB_STATUS_ID",
                    JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
                    JOB_ITEM_TITLE: "$jobItems.JOB_ITEM_TITLE",
                    jobItemsUpdatedAt: "$jobItems.updatedAt",
                    ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE",
                    UPPER:"$jobItems.UPPER_SPEC",
                    LOWER:"$jobItems.LOWER_SPEC",
                    FILE:"$jobItems.IMG_ATTACH",
                  }
                },
                {
                  $sort: {
                    jobItemsUpdatedAt: 1
                  }
                }
              ]);

      }

      {
              //console.log('jobValues',jobValues);  
                //-------------------------------------------
              //   const jobValues = await User.aggregate([
              //     {
              //       $lookup: {
              //         from: "jobs",
              //         localField: "_id",
              //         foreignField: "ACTIVATE_USER",
              //         as: "jobs",
              //       },
              //     },      
              //     {
              //       $unwind: {
              //         path: "$jobs",
              //         preserveNullAndEmptyArrays: false,
              //       },
              //     },    
              //     {
              //       $match: {
              //         "jobs.updatedAt": {
              //           $gte: startDate,
              //           $lte: endDate
              //           },
              //           "jobs.WORKGROUP_ID": workgroupID._id.toString() 
              //       }
              //     }        
              //     ,
              //     {
              //       $lookup: {
              //         from: "jobitems",
              //         localField: "jobs._id",
              //         foreignField: "JOB_ID",
              //         as: "jobItems",
              //       },
              //     },
              //     {
              //       $unwind: {
              //         path: "$jobItems",
              //         preserveNullAndEmptyArrays: false,
              //       },
              //     },      
              // {
              //     $lookup: {
              //       from: "workgroups",
              //       let: { workgroupId: "$jobs.WORKGROUP_ID" },
              //       pipeline: [
              //         {
              //           $match: {
              //             $expr: {
              //               $eq: ["$_id", { $toObjectId: "$$workgroupId" }],
              //             },
              //           },
              //         },
              //         {
              //           $project: {
              //             WORKGROUP_NAME: 1,
              //           },
              //         },
              //       ],
              //       as: "workgroupInfo",
              //     },
              //   },
              //   {
              //     $unwind: {
              //       path: "$workgroupInfo",
              //       preserveNullAndEmptyArrays: false,
              //     },
              //   },
              //   {
              //     $match: {
              //       "jobItems.ACTUAL_VALUE": { $ne: null },
              //       "jobItems.updatedAt": { $ne: null },
              //       "jobs.LINE_NAME": { $ne: null },
              //       "workgroupInfo.WORKGROUP_NAME": { $ne: null },
              //       "jobs.DOC_NUMBER": { $ne: null },
              //       "jobItems.JOB_ITEM_NAME": { $ne: null },
              //       "jobItems.JOB_ITEM_TITLE": { $ne: null },
              //     },
              //   },
              //   {
              //     $project: {
              //       _id: 0,
              //       WORKGROUP_NAME: "$workgroupInfo.WORKGROUP_NAME",
              //       LINE_NAME: "$jobs.LINE_NAME",
              //       DOC_NUMBER: "$jobs.DOC_NUMBER",
              //       JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
              //       JOB_ITEM_TITLE: "$jobItems.JOB_ITEM_TITLE",
              //       jobItemsUpdatedAt: "$jobItems.updatedAt",
              //       ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE",
              //     },
              //   },
              //   {
              //     $sort: {
              //       jobItemsUpdatedAt: 1,
              //     },
              //   },
              //   ]);
      }
    
    

    // // ลบข้อมูลที่ไม่มีค่าหรือ null ออก
    
   //console.log('jobValues count ',jobValues.length);
   // jobValues.forEach(element => {
             //   console.log(element._id);
   // });    

    const cleanedJobValues = jobValues.filter(
      (item) =>
        item.LINE_NAME &&
        item.WORKGROUP_NAME &&
        item.JOB_ITEM_NAME &&
        item.JOB_ITEM_TITLE &&
        item.DOC_NUMBER &&
        item.ACTUAL_VALUE &&
        item.jobItemsUpdatedAt 
    );

    //console.log("Job values after aggregation:", cleanedJobValues);
    if (cleanedJobValues.length === 0) {
          //console.log("No data found for the given filters.");
    }

      //getStatusNameById
     //console.log('cleanedJobValues',cleanedJobValues); 
     for (let index = 0; index < cleanedJobValues.length; index++) {
          cleanedJobValues[index].JOB_STATUS=await getStatusNameById(cleanedJobValues[index].JOB_STATUS);
          //cleanedJobValues[index].FILE=await getAttachImageFromJobItem(cleanedJobValues[index].JOBITEM_ID);
     } 

    // console.log('cleanedJobValues count ',cleanedJobValues.length); 
    //console.log("get report end ",new Date());
  
    //console.timeEnd("Query Execution Time"); // แสดงเวลาที่ใช้ในการ query    
    //  return NextResponse.json({ 
    //         status: 200
    //       });
    
    /*cleanedJobValues.forEach(element => {
            console.log(element);
    });*/ 
   // console.timeEnd("Query Execution Time"); // แสดงเวลาที่ใช้ในการ query   

    return NextResponse.json(cleanedJobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error([]);
  }
};
