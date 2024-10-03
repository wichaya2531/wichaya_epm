
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from 'next/server.js';
import { JobItemTemplateEdit } from "@/lib/models/AE/JobItemTemplateEdit";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { jobTemplate_id, jobItemTemplate_id, author, job_item_template_title, job_item_template_name, upper_spec, lower_spec, test_method, test_location } = body;

    try {
        //console.log(jobTemplate_id, jobItemTemplate_id, author, job_item_template_title, job_item_template_name, upper_spec, lower_spec, test_method, test_location)
        const newJobItemTemplateCreateID = await generateUniqueKey();
        const jobItemTemplate = await JobItemTemplate.findById(jobItemTemplate_id);
        const jobItemTemplateEdit = new JobItemTemplateEdit({
            JOB_ITEM_TEMPLATE_ID: jobItemTemplate._id,
            JOB_TEMPLATE_ID: jobItemTemplate.JOB_TEMPLATE_ID,
            AUTHOR_ID: jobItemTemplate.AUTHOR_ID,
            JOB_ITEM_TEMPLATE_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
            JOB_ITEM_TEMPLATE_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
            UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
            LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
            TEST_METHOD: jobItemTemplate.TEST_METHOD,
            TEST_LOCATION_ID: jobItemTemplate.TEST_LOCATION_ID,
            JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
            JobTemplateCreateID: jobItemTemplate.JobTemplateCreateID,
        });
        await jobItemTemplateEdit.save();
        
        //current job template create id
        const currentJobTemplateCreateID = await JobTemplate.findById(jobTemplate_id)        
        //update job item template
        jobItemTemplate.JOB_TEMPLATE_ID = jobTemplate_id;
        jobItemTemplate.AUTHOR_ID = author;
        jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE = job_item_template_title;
        jobItemTemplate.JOB_ITEM_TEMPLATE_NAME = job_item_template_name;
        jobItemTemplate.UPPER_SPEC = upper_spec;
        jobItemTemplate.LOWER_SPEC = lower_spec;
        jobItemTemplate.TEST_METHOD = test_method;
        jobItemTemplate.TEST_LOCATION_ID = test_location;
        jobItemTemplate.JobItemTemplateCreateID = newJobItemTemplateCreateID;
        jobItemTemplate.JobTemplateCreateID = currentJobTemplateCreateID.JobTemplateCreateID;
        
        await jobItemTemplate.save();
        
        return NextResponse.json({ status: 200, jobItemTemplateEdit });
    }
    catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
}