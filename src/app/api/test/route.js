import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule";
import { Job } from "@/lib/models/Job.js";
import { Workgroup } from "@/lib/models/Workgroup.js";
import { User } from "@/lib/models/User";

export const GET = async (req, res) => {
    await connectToDb();

  const startDate =  new Date('2025-04-01'); // วันที่เริ่มต้น
  const endDate = new Date('2025-04-15');   // วันที่สิ้นสุด
  const workgroup_name = 'PRB-Seal-HIF';//searchParams.get('workgroup');   // กลุ่มงาน

  const workgroupID = await Workgroup.findOne({WORKGROUP_NAME:workgroup_name});  
  {
      //   const jobs = await Job.find({
      //     updatedAt: {
      //       $gte: startDate, // มากกว่าหรือเท่ากับวันที่เริ่มต้น
      //       $lte: endDate // น้อยกว่าหรือเท่ากับวันเวลาปัจจุบัน
      //     }
      //     ,
      //     WORKGROUP_ID:workgroupID._id.toString() 
      //   });
          
      //   var LineNames=new Array();
      //   var WdTag=new Array();
      //   //console.log('jobs count',jobs.length);
      //   const users=await User.find();
      //   //console.log('users',users);  
      //   const arr_user=new Array();
      //   users.forEach(element => {
      //             arr_user[element._id]=element.EMP_NAME;
      //   });
      //  // console.log('arr_user',arr_user);  
      //   var i=1;
      //   jobs.forEach(element => {
      //           if(i==1){
      //                 //console.log(element);
                    
      //           }
      //           //if (element.LINE_NAME!=element.WD_TAG && element.WD_TAG!=null ) {
      //               //console.log("job_id "+element._id+" Linename:"+element.LINE_NAME+" ,WD_TAG  "+element.WD_TAG);
      //               LineNames[element.LINE_NAME]=1;
      //               WdTag[element.WD_TAG]=1;
      //           //}
      //           i++;
      //           console.log("i="+i+ '::ACTIVATE_USER',arr_user[element.ACTIVATE_USER]);
      //   });
      
      //  // console.log('LineNames',LineNames);
      //   //console.log('WdTag',WdTag);
      //   return NextResponse.json({ status: 200,sector:1});
  
  }
  
  {
    console.time("Query Execution Time"); // เริ่มจับเวลา
    // var workgroups_list=new Array();
    // const workgroups = await Workgroup.find();   
    //  workgroups.forEach(element => {
    //         workgroups_list[element._id]=element.WORKGROUP_NAME;
    //  });
     //console.log('workgroups_list',workgroups_list);

    const workgroupID = await Workgroup.findOne({ WORKGROUP_NAME: workgroup_name });

    const jobValues = await Job.aggregate([
      {
        $match: {
          updatedAt: {
            $gte: startDate,
            $lte: endDate
          },
          WORKGROUP_ID: workgroupID._id.toString() // หรือ workgroupID._id ถ้าใน DB เก็บเป็น ObjectId
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
          "jobItems.ACTUAL_VALUE": { $ne: null },
          "jobItems.updatedAt": { $ne: null },
          "LINE_NAME": { $ne: null },
          "DOC_NUMBER": { $ne: null },
          "jobItems.JOB_ITEM_NAME": { $ne: null },
          "jobItems.JOB_ITEM_TITLE": { $ne: null }
        }
      },
      {
        $project: {
          _id: 0,
          WORKGROUP_NAME: workgroup_name,
          LINE_NAME: "$LINE_NAME",
          DOC_NUMBER: "$DOC_NUMBER",
          JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
          JOB_ITEM_TITLE: "$jobItems.JOB_ITEM_TITLE",
          jobItemsUpdatedAt: "$jobItems.updatedAt",
          ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE"
        }
      },
      {
        $sort: {
          jobItemsUpdatedAt: 1
        }
      }
    ]);
    

  //  console.log(jobValues);
    // var t=0;
    // jobValues.forEach(element => {
    //       if (t==0) {
    //         console.log(element);
    //       }  
    //       t++;
    // });
    console.timeEnd("Query Execution Time"); // แสดงเวลาที่ใช้ในการ query   
    //console.log('jobValues count ',jobValues.length);
    
    return NextResponse.json({ status: 200,sector:2});
  } 




  {
  //console.log('workgroup_name',workgroup_name);
  const workgroupID = await Workgroup.findOne({WORKGROUP_NAME:workgroup_name});
  //console.log('workgroupID',workgroupID);
  console.time("Query Execution Time"); // เริ่มจับเวลา

  const jobValues = await User.aggregate([
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "ACTIVATE_USER",
        as: "jobs",
      },
    }
    ,      
    {
      $unwind: {
        path: "$jobs",
        preserveNullAndEmptyArrays: false,
      },
    }
    ,    
     {
       $match: {
         "jobs.updatedAt": {
           $gte: startDate,
           $lte: endDate
          }
          ,
          "jobs.WORKGROUP_ID": workgroupID._id.toString() 
       }
     }        
      ,
     {
       $lookup: {
         from: "jobitems",
         localField: "jobs._id",
         foreignField: "JOB_ID",
         as: "jobItems",
       },
     },
     {
       $unwind: {
         path: "$jobItems",
         preserveNullAndEmptyArrays: false,
       },
     },      
 {
     $lookup: {
       from: "workgroups",
       let: { workgroupId: "$jobs.WORKGROUP_ID" },
       pipeline: [
         {
           $match: {
             $expr: {
               $eq: ["$_id", { $toObjectId: "$$workgroupId" }],
             },
           },
         },
         {
           $project: {
             WORKGROUP_NAME: 1,
           },
         },
       ],
       as: "workgroupInfo",
     },
   },
   {
     $unwind: {
       path: "$workgroupInfo",
       preserveNullAndEmptyArrays: false,
     },
   }
   
   ,
   {
     $match: {
       "jobItems.ACTUAL_VALUE": { $ne: null },
       "jobItems.updatedAt": { $ne: null },
       "jobs.LINE_NAME": { $ne: null },
       "workgroupInfo.WORKGROUP_NAME": { $ne: null },
       "jobs.DOC_NUMBER": { $ne: null },
       "jobItems.JOB_ITEM_NAME": { $ne: null },
       "jobItems.JOB_ITEM_TITLE": { $ne: null },
     },
   }  
   

   ,
   {
     $project: {
       _id: 0,
       WORKGROUP_NAME: "$workgroupInfo.WORKGROUP_NAME",
       LINE_NAME: "$jobs.LINE_NAME",
       DOC_NUMBER: "$jobs.DOC_NUMBER",
       JOB_ITEM_NAME: "$jobItems.JOB_ITEM_NAME",
       JOB_ITEM_TITLE: "$jobItems.JOB_ITEM_TITLE",
       jobItemsUpdatedAt: "$jobItems.updatedAt",
       ACTUAL_VALUE: "$jobItems.ACTUAL_VALUE",
     },
   }

   ,
   {
     $sort: {
       jobItemsUpdatedAt: 1,
     },
   },
  ]);

   console.timeEnd("Query Execution Time"); // แสดงเวลาที่ใช้ในการ query   
   //console.log('jobValues',jobValues);
   var lineName=new Array();
   var wd_tag=new Array();
   var i=0;
   jobValues.forEach(element => {
          i++;
          if(i==1){
                console.log(element);
          }

      //    lineName[element.jobs.LINE_NAME]=1;   
     //     wd_tag[element.jobs.WD_TAG]=1;     
      //console.log("i="+i+":"+element.jobs.LINE_NAME+"::"+element.jobs.WD_TAG);
               
   });
   
   //console.log('lineName',lineName);   
   //console.log('wd_tag',wd_tag);   
   /*  
      var lineName=new Array();
      jobValues.forEach(element => {
            console.log(element);      
            lineName[element.LINE_NAME]=1;   
      });
      console.log('lineName',lineName);   
    */    

  }

  //###################################################################
    
    /*
    const now = new Date(); // เวลาปัจจุบัน
       const startTime = new Date(now); // สำเนาเวลาปัจจุบัน
       startTime.setMinutes(now.getMinutes() - 800); // ลบ 60 นาที
       
       const endTime = new Date(now); // สำเนาเวลาปัจจุบัน
       endTime.setMinutes(now.getMinutes() + 800); // เพิ่ม 60 นาที
       console.log("scheduler startTime:",startTime);  
       console.log("scheduler endTime:",endTime);  
       
       const scheduler = await Schedule.find({
         ACTIVATE_DATE: {
           $gte: startTime, // เวลาที่มากกว่าหรือเท่ากับ startTime (60 นาทีก่อนหน้า)
           $lte: endTime, // เวลาที่น้อยกว่าหรือเท่ากับ endTime (60 นาทีถัดไป)
         },
         STATUS:"plan",
       });
   
       console.log("scheduler ที่ค้นหาเจอ=>", scheduler);
      */
    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({ status: 200});
};
