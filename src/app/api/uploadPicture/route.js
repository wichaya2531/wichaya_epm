import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const POST = async (req, res) => {
   // console.log("use  POST");
    try {
        const form = await req.formData();
        const FILE = form.get("file");
        const JOB_ID = form.get("job_id");
        
        var responsePath="";
        if (FILE && FILE.size > 0) { // Check if FILE exists and is not empty
            const buffer = Buffer.from(await FILE.arrayBuffer());
            const fileExtension = FILE.name.split(".").pop();
            const filename = JOB_ID+"_"+`${Date.now()}.${fileExtension}`;
            const filePath = "C:\\ePM_PictureUpload\\"+filename  ;//path.join(process.cwd(), "public/uploads/", filename);
            responsePath=filename;
            fs.writeFileSync(filePath, buffer);
        }

        //console.log(" Upload Success ");
        return NextResponse.json({result:true, message: 'File uploaded successfully', filePath: responsePath });
      
       // return NextResponse.json({ status: 200, result: "Hello World",path:responsePath });
    } catch (err) {
        console.log("Error: ", err.message);
        return NextResponse.json({ result:false, file: __filename, error: err.message });
    }
};