
import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate.js";
import { Job } from "@/lib/models/Job.js";
import { JobItem } from "@/lib/models/JobItem.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from '@/lib/models/Schedule.js';

export const DELETE = async (req, res) => {
    await connectToDb();
    const body = await req.json();  
    const { job_id } = body;

    try {
       
        // find if it exist in schedule
        const schedule = await Schedule.findOne({ JOB_TEMPLATE_ID: job_id });
        if (schedule) {
            //then remove from schedule
 
            await Schedule.findOneAndDelete({ JOB_TEMPLATE_ID: job_id });
            return NextResponse.json({ status: 200 });
        }

        const jobTemplateActivate = await JobTemplateActivate.findOneAndDelete({ JOB_ID: job_id });

        const jobItems = await JobItem.find({ JOB_ID: job_id });
        //remove all job_item_template_activate where job_item_id equals to job_item_id
        jobItems.forEach(async (jobItem) => {
            await JobItemTemplateActivate.findOneAndDelete({ JOB_ITEM_ID: jobItem._id });
        });

        // Remove job items
        await JobItem.deleteMany({ JOB_ID: job_id });

        // Remove job
        const job = await Job.findByIdAndDelete(job_id);
        
        return NextResponse.json({ status: 200, job });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};

    

