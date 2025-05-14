import fs from "fs";
import path from "path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { Job } from "@/lib/models/Job";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library


export const POST = async (req, res) => {
  // console.log("use  POST");
  try {
    const form = await req.formData();
    const FILE = form.get("file");
    const JOB_ID = form.get("job_id");

    var responsePath = "";
    let filename;
    if (FILE && FILE.size > 0) {
      // Check if FILE exists and is not empty
      const buffer = Buffer.from(await FILE.arrayBuffer());
      const fileExtension = FILE.name.split(".").pop();
      filename = JOB_ID + "_" + `${Date.now()}.${fileExtension}`;
      const filePath = "C:\\ePM_PictureUpload\\" + filename; //path.join(process.cwd(), "public/uploads/", filename);

            let finalBuffer = buffer;
            // ถ้าไฟล์ใหญ่กว่า 1MB ให้ทำการ resize/compress
            if (buffer.length > 1024 * 1024) {
             // console.log("Image is larger than 1MB, resizing...");

              // เริ่มบีบอัดด้วย quality 80
              let quality = 80;
              let resizedBuffer = await sharp(buffer)
                .jpeg({ quality })
                .toBuffer();

              // Loop ลด quality ถ้ายังใหญ่กว่า 250KB (250 * 1024)
              while (resizedBuffer.length > 250 * 1024 && quality > 30) {
                quality -= 10;
                resizedBuffer = await sharp(buffer)
                  .jpeg({ quality })
                  .toBuffer();
              }

              finalBuffer = resizedBuffer;
            }
         // เขียนไฟล์ลง disk       
     
            fs.writeFileSync(filePath, finalBuffer);
            responsePath = filename;
    }


        //console.log('selector',selector);
        {
          //สำหรับการอัพเดท PM Sticker ใน job Items
          try{
              const selector = form.get("selector");
              const job = await Job.findOne({
                _id: new ObjectId(JOB_ID)
              })   
              //console.log('job ',job);
              //console.log('selector',selector); 
              if (selector=='fileInput-1') {
                job.IMAGE_FILENAME=filename;
              }else if(selector=='fileInput-2'){
                job.IMAGE_FILENAME_2=filename;
              }  
              await job.save();  
          }catch(err){
                console.log("update job with pm sticker error :: ",err);
          }
        }


    //console.log(" Upload Success ");
    return NextResponse.json({
      result: true,
      message: "File uploaded successfully",
      filePath: responsePath,
    });

    // return NextResponse.json({ status: 200, result: "Hello World",path:responsePath });
  } catch (err) {
    console.log("Error: ", err.message);
    return NextResponse.json({
      result: false,
      file: __filename,
      error: err.message,
    });
  }
};
