import { generateUniqueKey } from "@/lib/utils/utils.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server.js";
import { JobItemTemplateEdit } from "@/lib/models/AE/JobItemTemplateEdit";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
        //console.log("log from update pos");    
        await connectToDb();
        const form = await req.formData();
        const jobItemTemplateID = form.get("jobItemTemplateID");
        //const body = await req.json();
        console.log("jobItemTemplateID=>",jobItemTemplateID);
        try{
            return NextResponse.json({ status: 200, result:"OK" });
        } catch (err) {
            return NextResponse.json({
                status: 500,
                //file: __filename,
                error: err.message,
            });
        }
};
