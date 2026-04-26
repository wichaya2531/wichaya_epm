import { TestLocation } from "@/lib/models/TestLocation.js";
import { NextResponse } from 'next/server.js';
import { connectToDb } from "@/app/api/mongo/index.js";


export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const {
        LocationName,
        LocationTitle
    } = body;
    try {
        const testLocation = new TestLocation({
            LocationName,
            LocationTitle
        });
        
        await testLocation.save();

        return NextResponse.json({ status: 200, testLocation });
    }
    catch(err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 065");
         }
         console.error("📄 Stack trace:\n", err.stack);
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
     
};
    

