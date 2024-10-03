import fs from 'fs';
import path from 'path';
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
    await connectToDb();
    const JobItemTemplateCreateID = await generateUniqueKey();

    try {
        const form = await req.formData();

        const AUTHOR_ID = form.get("AUTHOR_ID");
        const JOB_ITEM_TEMPLATE_TITLE = form.get("JOB_ITEM_TEMPLATE_TITLE");
        const JOB_ITEM_TEMPLATE_NAME = form.get("JOB_ITEM_TEMPLATE_NAME");
        const UPPER_SPEC = form.get("UPPER_SPEC");
        const LOWER_SPEC = form.get("LOWER_SPEC");
        const TEST_METHOD = form.get("TEST_METHOD");
        const JOB_TEMPLATE_ID = form.get("JOB_TEMPLATE_ID");
        const TEST_LOCATION_ID = form.get("TEST_LOCATION_ID");
        const JobTemplateCreateID = form.get("JobTemplateCreateID");
        const FILE = form.get("FILE");

        const jobItemTemplateData = {
            AUTHOR_ID,
            JOB_ITEM_TEMPLATE_TITLE,
            JOB_ITEM_TEMPLATE_NAME,
            UPPER_SPEC,
            LOWER_SPEC,
            TEST_METHOD,
            JOB_TEMPLATE_ID,
            TEST_LOCATION_ID,
            JobTemplateCreateID,
            JobItemTemplateCreateID
        };

        if (FILE && FILE.size > 0) { // Check if FILE exists and is not empty
            const buffer = Buffer.from(await FILE.arrayBuffer());
            const fileExtension = FILE.name.split(".").pop();
            const filename = `${JobItemTemplateCreateID}.${fileExtension}`;
            const relativeFilePath = path.join("job-item-template-images", filename); // Relative path
            const filePath = path.join(process.cwd(), "public", relativeFilePath);
            fs.writeFileSync(filePath, buffer);
            jobItemTemplateData.FILE = `/${relativeFilePath}`;
        }

        const jobItemTemplate = new JobItemTemplate(jobItemTemplateData);

        // Save the JobItemTemplate instance to the database
        await jobItemTemplate.save();

        return NextResponse.json({ status: 200, jobItemTemplate });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};
