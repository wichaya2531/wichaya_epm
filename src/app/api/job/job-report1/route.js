import { connectToDb } from "@/app/api/mongo/index";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Workgroup } from "@/lib/models/Workgroup.js";



export const GET = async (req, res) => {
  console.time("Query Execution Time"); // เริ่มจับเวลา
  //console.log("get report start ",new Date());
  const searchParams = req.nextUrl.searchParams;
  //console.log('searchParams',searchParams); 

  const startDate =  new Date( '2025-04-01' /*searchParams.get('start')*/); // วันที่เริ่มต้น
  const endDate = new Date(  '2025-04-03'/*searchParams.get('end')*/);   // วันที่สิ้นสุด
  const workgroup_name =searchParams.get('workgroup');   // กลุ่มงาน

  //console.log('workgroup_name',workgroup_name);
  const workgroupID = await Workgroup.findOne({WORKGROUP_NAME:workgroup_name});
  //console.log('workgroupID',workgroupID);
  /*try {
      
        //console.log('workgroupID',workgroupID._id);
  } catch (error) {
      //console.log(error);
  }*/
      


  //return NextResponse.json({ status: 400, message: "Invalid Workgroup" });

  try {
    await connectToDb();

    
    //console.log('jobValues',jobValues);  
    //-------------------------------------------
     const jobValues = await User.aggregate([
       {
         $lookup: {
           from: "jobs",
           localField: "_id",
           foreignField: "ACTIVATE_USER",
           as: "jobs",
         },
       },      
       {
         $unwind: {
           path: "$jobs",
           preserveNullAndEmptyArrays: false,
         },
       },    
        {
          $match: {
            "jobs.updatedAt": {
              $gte: startDate,
              $lte: endDate
             },
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
      },
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
      },
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
      },
      {
        $sort: {
          jobItemsUpdatedAt: 1,
        },
      },
     ]);

    // // ลบข้อมูลที่ไม่มีค่าหรือ null ออก
    
    //console.log('jobValues',jobValues);


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

    // console.log("Job values after aggregation:", cleanedJobValues);
    if (cleanedJobValues.length === 0) {
      console.log("No data found for the given filters.");
    }
    //console.log("get report end ",new Date());
  
    console.timeEnd("Query Execution Time"); // แสดงเวลาที่ใช้ในการ query    
    //  return NextResponse.json({ 
    //         status: 200
    //       });
    return NextResponse.json(cleanedJobValues);
  } catch (error) {
    console.error("Error fetching job values:", error);
    return NextResponse.error(error);
  }
};
