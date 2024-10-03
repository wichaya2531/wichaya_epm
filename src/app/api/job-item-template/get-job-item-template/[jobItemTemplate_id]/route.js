


import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from 'next/server.js';
import { User } from "@/lib/models/User.js";
import { TestLocation } from "@/lib/models/TestLocation";
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req, { params }) => {
    await connectToDb();
    const { jobItemTemplate_id } = params;
    try {

        const jobItemTemplate = await JobItemTemplate.findById(jobItemTemplate_id);
        const testLocation = await TestLocation.findById(jobItemTemplate.TEST_LOCATION_ID);
        const testLocationName = testLocation ? testLocation.LocationName : null;
        const createdAt = new Date(jobItemTemplate.createdAt).toLocaleString();
        const user = await User.findOne({ _id: jobItemTemplate.AUTHOR_ID });

        const data = {
            _id: jobItemTemplate._id,
            AUTHOR_ID: jobItemTemplate.AUTHOR_ID,
            AUTHOR_NAME: user ? user.EMP_NAME : "",
            JOB_ITEM_TEMPLATE_TITLE: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
            JOB_ITEM_TEMPLATE_NAME: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
            UPPER_SPEC: jobItemTemplate.UPPER_SPEC,
            LOWER_SPEC: jobItemTemplate.LOWER_SPEC,
            TEST_METHOD: jobItemTemplate.TEST_METHOD,
            TEST_LOCATION_NAME: testLocationName,
            JOB_TEMPLATE_ID: jobItemTemplate.JOB_TEMPLATE_ID,
            JobItemTemplateCreateID: jobItemTemplate.JobItemTemplateCreateID,
            JobTemplateCreateID: jobItemTemplate.JobTemplateCreateID,
            createdAt: createdAt
        };

        return NextResponse.json({ status: 200, jobItemTemplates: data });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};

