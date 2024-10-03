import { NextResponse } from 'next/server.js';
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { Machine } from "@/lib/models/Machine";
import { Workgroup } from "@/lib/models/Workgroup";
import { User } from "@/lib/models/User.js";
import { TestLocation } from "@/lib/models/TestLocation";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobApproves } from '@/lib/models/JobApprove';

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const JobID = searchParams.get("job_id");
    try {
        let machineName;
        const job = await Job.findOne({ _id: JobID });
        if (!job) return NextResponse.json({ status: 404, message: "Checklist has been deleted already, or wrong ChecklistID" });
        //sort lastest come last
        const jobItems = await JobItem.find({ JOB_ID: JobID }).sort({ createdAt: 1 });
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
        const jobData = {
            "JobID": JobID,
            "Status": statusName,
            "Timeout": job.TIMEOUT,
            "Name": job.JOB_NAME,
            "WD_TAG": job.WD_TAG || "",
            "DocumentNo": job.DOC_NUMBER,
            "LINE_NAME": job.LINE_NAME, 
            "ChecklistVer": job.CHECKLIST_VERSION,
            "MachineName": machineName,
            "WorkGroupID": job.WORKGROUP_ID,
            "WorkgroupName": workgroupName,
            "ActivatedBy": activatedBy,
            "ActivatedAt": job.createdAt.toLocaleString(),
            "LastestUpdate": job.updatedAt.toLocaleString(),
            "SubmittedBy": job.SUBMITTED_BY ? job.SUBMITTED_BY.EMP_NAME : "",
            "SubmitedAt": job.SUBMITTED_DATE ? job.SUBMITTED_DATE.toLocaleString() : "",
            "Status": statusName,
            "Approvers": job.JOB_APPROVERS 
        };
        
        const jobItemData = await Promise.all(jobItems.map(async (jobItem) => {
            const location = await TestLocation.findById(jobItem.TEST_LOCATION_ID);
            return {
                "JobItemID": jobItem._id,
                "JobItemTitle": jobItem.JOB_ITEM_TITLE,
                "JobItemName": jobItem.JOB_ITEM_NAME,
                "UpperSpec": jobItem.UPPER_SPEC,
                "LowerSpec": jobItem.LOWER_SPEC,
                "TestMethod": jobItem.TEST_METHOD,
                "BeforeValue": jobItem.BEFORE_VALUE,
                "ActualValue": jobItem.ACTUAL_VALUE,
                "Comment": jobItem.COMMENT,
                "RealTimeValue": jobItem.REAL_TIME_VALUE,
                "TestLocationName": location ? location.LocationName : "",
                "ExecuteDate": jobItem.EXECUTE_DATE,
                "LastestUpdate": jobItem.updatedAt.toLocaleString(),
                "File": jobItem.FILE ? jobItem.FILE.replace(/\\/g, '/') : null, 
                "createAt": jobItem.createdAt.toLocaleString()
            };
        }));
        
        
        if (statusName === "renew") {
            const jobApprove = await JobApproves.find({ "JOB._id": JobID }).sort({ createdAt: -1 }).limit(1);
            if (jobApprove.length > 0) {
                const commentor = await User.findOne({ _id: jobApprove[0].USER_ID });
                jobData.comment = jobApprove[0].COMMENT;
                jobData.commentator = commentor.EMP_NAME;
                jobData.commentAt = jobApprove[0].createdAt.toLocaleString();
            } else {
                console.log('JobApproves document not found');
            }
        }
        
        return NextResponse.json({ status: 200, jobData: jobData, jobItemData: jobItemData });
    } catch (err) {
        console.log(err);
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};
