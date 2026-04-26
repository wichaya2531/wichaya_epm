
import { TestLocation } from "@/lib/models/TestLocation.js";
import { NextResponse } from 'next/server.js';
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    try {
        const locations = await TestLocation.find();
        return NextResponse.json({ status: 200, locations });
    }
    catch(err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 066");
                console.error("📄 Stack trace:\n", err.stack);
         }
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
};
    

