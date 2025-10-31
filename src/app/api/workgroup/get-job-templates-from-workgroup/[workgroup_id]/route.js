
import { NextResponse } from 'next/server';
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Machine } from "@/lib/models/Machine";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { ProfileGroup } from '@/lib/models/ProfileGroup';

export const dynamic = 'force-dynamic';


async function getPlaningInfomation(job_id) {
     const  scheduals=await Schedule.find({JOB_TEMPLATE_ID: job_id}) ;//.limit(1);
     const dates = scheduals.map(item => new Date(item.ACTIVATE_DATE));

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

     //   console.log("📅 น้อยสุด (เริ่มต้น):", minDate);
     //   console.log("📅 มากสุด (ล่าสุด):", maxDate);
    // console.log('scheduals',scheduals);
     return {start:minDate,end:maxDate,schedualCount:dates.length}   

}

async function loadProfileGroupsMap() {
  const arr = await ProfileGroup.find().lean();
  return arr.reduce((acc, g) => {
    acc[g._id] = g.PROFILE_NAME;
    return acc;
  }, {});
}


export const GET = async (req, {params}) => {
    await connectToDb();
    const { workgroup_id } = params;

    const _profileGroups=await loadProfileGroupsMap();
    //console.log('_profileGroups',_profileGroups);
    

    try {
        const allJobTemplates = await JobTemplate.find();
        const jobTemplates = allJobTemplates.filter(jobTemplate => jobTemplate.WORKGROUP_ID === workgroup_id);

        const data = await Promise.all(jobTemplates.map(async jobTemplate => {
            const machines = await Machine.find({ _id: jobTemplate.MACHINE_ID });
            const machineName = machines.length > 0 ? machines[0].MACHINE_NAME : null;
            const createdAt = new Date(jobTemplate.createdAt).toLocaleString();
            return {
                _id: jobTemplate._id,
                AUTHOR_ID: jobTemplate.AUTHOR_ID,
                JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
                DOC_NUMBER: jobTemplate.DOC_NUMBER,
                LINE_NAME: jobTemplate.LINE_NAME,
                DUE_DATE: jobTemplate.DUE_DATE,
                CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
                MACHINE_ID: jobTemplate.MACHINE_ID,
                JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
                MACHINE_NAME: machineName,
                WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
                createdAt: createdAt,
                createdAtSort:jobTemplate.createdAt,
                PROFILE_GROUP:_profileGroups[jobTemplate?.PROFILE_GROUP] || "Unknown",
                onPlanStatus: await getPlaningInfomation(jobTemplate._id)
            };
        }));


        // Sort by createdAt: newest to oldest
        data.sort((a, b) =>b.createdAtSort - a.createdAtSort);
        // data.forEach(element => {
        //                 console.log(element._id+":"+element.createdAt);
        // });
        return NextResponse.json({ status: 200, jobTemplates: data });
    }
    catch (err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                    console.log(err);
                    console.log("Error Code : 101");
         }
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
      
};
