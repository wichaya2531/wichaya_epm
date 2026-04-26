import { connectToDb } from "@/app/api/mongo/index.js";
import { NextResponse } from "next/server.js";

export const POST = async (req, res) => {
    
    await connectToDb();

    try{


      return NextResponse.json({
        status: 200,
        message: "Hello World",
      });

    }catch(err){
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        }); 
    }


      
};