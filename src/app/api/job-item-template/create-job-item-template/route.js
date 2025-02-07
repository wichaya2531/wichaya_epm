import fs from "fs";
import path from "path";
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";



async function checkLastIndexOfItem(JobTemplateCreateID) {
  // try {
  //   const user = await User.findOne({ _id: new ObjectId(userID) });
  //   return user ? user.EMAIL : null;
  // } catch (error) {
  //   console.error("Error:", error);
  //   return null;
  // }

    const countJobItemTemplate= await JobItemTemplate.find({JobTemplateCreateID:JobTemplateCreateID});
    //console.log( "countJobItemTemplate=>",countJobItemTemplate.length );
    if(countJobItemTemplate){
            return  countJobItemTemplate.length+1; 
    }
    return 0;
}

export const POST = async (req) => {
  await connectToDb();
  const JobItemTemplateCreateID = await generateUniqueKey();
  //console.log("use create job item template");
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
    const pos=await checkLastIndexOfItem(JobTemplateCreateID);

    let filePath = form.get("FILE"); // Initialize filePath to null
    /*
    if (FILE && FILE.size > 0) {
      const buffer = Buffer.from(await FILE.arrayBuffer());
      const fileExtension = FILE.name.split(".").pop();
      const filename = `${JobItemTemplateCreateID}_${Date.now()}.${fileExtension}`; // Use unique key for filename
      const uploadDir = path.join("C:\\ePM_Template\\Item", filename); // Path to save the file

      fs.writeFileSync(uploadDir, buffer); // Save the file
      filePath = filename; // Set filePath to the saved filename
    }*/

    // Create jobItemTemplateData object
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
      JobItemTemplateCreateID,
      FILE: filePath, // Include the filePath in the data
      pos:pos
    };

    // Create a new instance of JobItemTemplate
    const jobItemTemplate = new JobItemTemplate(jobItemTemplateData);

    // Save the JobItemTemplate instance to the database
    await jobItemTemplate.save();
    
    console.log("jobItemTemplate save Success");

    return NextResponse.json({ status: 200, jobItemTemplate });
  } catch (err) {
    console.error("jobItemTemplate save Error : "+err.message);

    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
