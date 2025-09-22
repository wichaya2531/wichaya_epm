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

const getPositionTimeByJobItem = async (jobItemID) => {
  const jobItem = await JobItem.findOne({ JOB_ITEM_TEMPLATE_ID: jobItemID });
  //console.log(jobItem.createdAt);
  return jobItem.createdAt;
};

const getGuideInputByJobItem = async (jobItemID) => {
  const jobItem = await JobItem.find({ JOB_ITEM_TEMPLATE_ID: jobItemID });

  var guideInput = [];
  jobItem.map((item) => {
    if (
      item.ACTUAL_VALUE !== null &&
      !["pass", "fail"].includes(item.ACTUAL_VALUE.toLowerCase()) &&
      isNaN(item.ACTUAL_VALUE) // เพิ่มเงื่อนไขไม่เอาตัวเลข
    ) {
      guideInput.push(item.ACTUAL_VALUE);
    }
  });
  guideInput = [...new Set(guideInput)];
  return guideInput;
};
export const dynamic = "force-dynamic";


async function getApproverName(user_id) {
        //console.log('user_id',user_id);
        try {

                      const userApprove = await User.findOne({
                        _id: new ObjectId( user_id[0] ),
                      });

                     //console.log("userApprove ",userApprove);   
                     return userApprove.EMP_NAME;
        } catch (error) {
                //console.log(error);
        }
        return "unknown";
}

export const GET = async (req, res) => {
  await connectToDb();
  const searchParams = req.nextUrl.searchParams;
  const JobID = searchParams.get("job_id");
  

  //console.log('JobID=>', JobID);
  

  try {
    let machineName;
    const job = await Job.findOne({ _id: JobID });
    if (!job)
      return NextResponse.json({
        status: 404,
        message: "Checklist has been deleted already, or wrong ChecklistID",
      });
   


    //sort lastest come last
    const jobItems = await JobItem.find({ JOB_ID: JobID }).sort({
      createdAt: -1,
    });
    const workgroup = await Workgroup.findOne({ _id: job.WORKGROUP_ID });
    const workgroupName = workgroup ? workgroup.WORKGROUP_NAME : null;
    const user = await User.findOne({ _id: job ? job.ACTIVATE_USER : null });
    const activatedBy = user ? user.EMP_NAME : null;
    const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
    const statusName = status ? status.status_name : null;

    if (job.WD_TAG) {
      const machine = await Machine.findOne({ WD_TAG: job.WD_TAG });
      machineName = machine ? machine.MACHINE_NAME : null;
    } else {
      machineName = null;
    }

     //console.log('job=>', job);

    const jobData = {
      JobTemplateID: job.JOB_TEMPLATE_ID,
      JobID: JobID,
      Status: statusName,
      Timeout: job.TIMEOUT,
      Name: job.JOB_NAME,
      WD_TAG: job.WD_TAG || "",
      DocumentNo: job.DOC_NUMBER,
      LINE_NAME: job.LINE_NAME,
      ChecklistVer: job.CHECKLIST_VERSION,
      MachineName: machineName,
      WorkGroupID: job.WORKGROUP_ID,
      IMAGE_FILENAME: job.IMAGE_FILENAME,
      IMAGE_FILENAME_2: job.IMAGE_FILENAME_2,
      WorkgroupName: workgroupName,
      ActivatedBy: activatedBy,
      ActivatedAt: job.createdAt.toLocaleString(),
      LastestUpdate: job.updatedAt.toLocaleString(),
      SubmittedBy: job.SUBMITTED_BY ? job.SUBMITTED_BY.EMP_NAME : "",
      SubmitedAt: job.SUBMITTED_DATE ? job.SUBMITTED_DATE.toLocaleString() : "",     
      Status: statusName,
     // Approvers: job.JOB_APPROVERS,
      Approvers: job.JOB_APPROVERS,
      ApproverName: statusName=="complete"?await getApproverName(job.JOB_APPROVERS):"",      
      DISAPPROVE_REASON:job.DISAPPROVE_REASON||"",
      PICTURE_EVEDENT_REQUIRE:job.PICTURE_EVEDENT_REQUIRE || false ,
    };    

    const jobItemData = await Promise.all(
      jobItems.map(async (jobItem) => {
        const location = await TestLocation.findById(jobItem.TEST_LOCATION_ID);

       // console.log("jobItem=>",jobItem);

        return {
          JobItemID: jobItem._id,
          JobItemTitle: jobItem.JOB_ITEM_TITLE,
          JobItemTemplateMqtt:jobItem.JOB_ITEM_TEMPLATE_ID,
          JobItemName: jobItem.JOB_ITEM_NAME,
          UpperSpec: jobItem.UPPER_SPEC,
          LowerSpec: jobItem.LOWER_SPEC,
          TestMethod: jobItem.TEST_METHOD,
          BeforeValue: jobItem.BEFORE_VALUE,
          BeforeValue2: jobItem.BEFORE_VALUE2,
          ActualValue: jobItem.ACTUAL_VALUE,
          Comment: jobItem.COMMENT,
          RealTimeValue: jobItem.REAL_TIME_VALUE,
          TestLocationName: location ? location.LocationName : "",
          ExecuteDate: jobItem.EXECUTE_DATE,
          LastestUpdate: jobItem.updatedAt.toLocaleString(),
          IMG_ATTACH: jobItem.IMG_ATTACH,
          IMG_ATTACH_1: jobItem.IMG_ATTACH_1||"",
          File: jobItem.FILE ? jobItem.FILE.replace(/\\/g, "/") : null,
          createAt: jobItem.createdAt.toLocaleString(),
          createAtTemplate: await getPositionTimeByJobItem(
            jobItem.JOB_ITEM_TEMPLATE_ID
          ),
          guide_input: await getGuideInputByJobItem(
            jobItem.JOB_ITEM_TEMPLATE_ID
          ),
          input_type:jobItem.INPUT_TYPE||"All",
          pos:jobItem.POS||0
        };
      })
    );



    if (job.SORT_ITEM_BY_POSITION) {
      jobItemData.sort((a, b) => {
        return  a.pos-b.pos;
      });
    }else{
          jobItemData.sort((a, b) => {
            return (
              new Date(a.createAtTemplate).getTime() -
              new Date(b.createAtTemplate).getTime()
            );
          });
    }

   // console.log('job sort by pos',job);
   // console.log('jobItem sort by pos',jobItemData);

  //  jobItemData.forEach(element => {
  //         console.log(element.pos);
  //  });   


    if (statusName === "renew") {
      const jobApprove = await JobApproves.find({ "JOB._id": JobID })
        .sort({ createdAt: -1 })
        .limit(1);
      if (jobApprove.length > 0) {
        const commentor = await User.findOne({ _id: jobApprove[0].USER_ID });
        jobData.comment = jobApprove[0].COMMENT;
        jobData.commentator = commentor.EMP_NAME;
        jobData.commentAt = jobApprove[0].createdAt.toLocaleString();
      } else {
        console.log("JobApproves document not found");
      }
    }

    return NextResponse.json({
      status: 200,
      jobData: jobData,
      jobItemData: jobItemData,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
