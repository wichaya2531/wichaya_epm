import { ProfileGroup  } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
export const POST = async (req, res) => {
  await connectToDb();
  const {workgroup_id } = await req.json();

  try {
       // สร้างเอกสาร
      //await _ProfileGroup.save();
      const _ProfileGroup=await ProfileGroup.find({workgroup_id:new ObjectId(workgroup_id)});  
      //console.log('_ProfileGroup',_ProfileGroup);  
      return NextResponse.json({ status: 200,profileGroup:_ProfileGroup });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: error.message,
    });
  }
};
