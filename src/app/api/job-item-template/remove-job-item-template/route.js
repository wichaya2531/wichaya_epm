import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import fs from "fs";
import path from "path";

export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { jobItemTemplate_id } = body;

  try {
    const jobItemTemplate = await JobItemTemplate.findById(jobItemTemplate_id);

    if (!jobItemTemplate) {
      return NextResponse.json({
        status: 404,
        file: __filename,
        error: "Job item template not found",
      });
    }

    // Remove the associated image file if it exists
    if (jobItemTemplate.FILE) {
      try{
          console.log("Removing image file")
          const imagePath = jobItemTemplate.FILE;
          fs.unlinkSync(path.join(process.cwd(), "public", imagePath));
      }catch(err){
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 051");
                console.error("📄 Stack trace:\n", err.stack);
         }
      }    
   }

    // Delete the JobItemTemplate from the database
    await JobItemTemplate.findByIdAndDelete(jobItemTemplate_id);

    return NextResponse.json({
      status: 200,
      message: "Job item template and associated image removed successfully",
    });
  } catch (err) {
     if(process.env.NEXT_PUBLIC_DEBUG=="true"){
            console.log("Error Code : 052");
            console.error("📄 Stack trace:\n", err.stack);
     }
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
