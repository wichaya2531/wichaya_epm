import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import fs from "fs";
import path from "path";

export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { jobTemplate_id, JobTemplateCreateID } = body;

  try {
    // Find all job item templates associated with the job template
    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: jobTemplate_id,
      JobTemplateCreateID: JobTemplateCreateID,
    });

    // Remove associated image files for each job item template
    await Promise.all(
      jobItemTemplates.map(async (jobItemTemplate) => {
        if (jobItemTemplate.FILE) {
          const imagePath = jobItemTemplate.FILE;
          const fullPath = path.join(process.cwd(), "public", imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      })
    );

    // Delete all job item templates associated with the job template
    //await JobItemTemplate.deleteMany({ JOB_TEMPLATE_ID: jobTemplate_id, JobTemplateCreateID: JobTemplateCreateID });
    for (const item of jobItemTemplates) {
      //console.log("\r\nitem for delete =>",item._id);
      await JobItemTemplate.findByIdAndDelete(item._id);
    }
    // Delete the job template
    const jobTemplate = await JobTemplate.findByIdAndDelete(jobTemplate_id);

    if (!jobTemplate) {
      return NextResponse.json({
        status: 404,
        file: __filename,
        error: "Job template not found",
      });
    }

    return NextResponse.json({ status: 200, jobTemplate });
  } catch (err) {
    console.lop("Delete Error=>", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
