import { generateUniqueKey } from "@/lib/utils/utils.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
    await connectToDb();
    const form = await req.formData();
    const jobItemTemplateID = form.get("jobItemTemplateID");
    const input_type = form.get("input-type"); // รับค่าที่ต้องการอัปเดต pos ใหม่
    //console.log("jobItemTemplateID=>", jobItemTemplateID);

    try {
        // หาเอกสารที่ต้องการอัปเดต
        var jobItemTemplate = await JobItemTemplate.findOne({ _id: jobItemTemplateID });

        if (!jobItemTemplate) {
            return NextResponse.json({
                status: 404,
                message: "JobItemTemplate not found",
            });
        }

        //console.log("Before jobItemTemplate=>", jobItemTemplate);
        //console.log("Before jobItemTemplate.INPUT_TYPE=>",jobItemTemplate.INPUT_TYPE);
        jobItemTemplate.INPUT_TYPE =input_type; 
        //console.log("After jobItemTemplate.INPUT_TYPE=>",jobItemTemplate.INPUT_TYPE);
        // บันทึกการเปลี่ยนแปลงลง MongoDB
        await jobItemTemplate.save();

        //console.log("After jobItemTemplate=>",jobItemTemplate);

        return NextResponse.json({ 
            status: 200, 
            result: "OK", 
            updatedJobItemTemplate: jobItemTemplate 
        });
    } catch (err) {
        console.error("Error=>", err.message);

        return NextResponse.json({
            status: 500,
            error: err.message,
        });
    }
};
