import { ProfileGroup  } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
export const POST = async (req, res) => {
  await connectToDb();
  const { PROFILE_NAME ,workgroup_id } = await req.json();

  try {
       // สร้างเอกสาร
        const _ProfileGroup = new ProfileGroup ({
                PROFILE_NAME:PROFILE_NAME,
                workgroup_id:workgroup_id
        });
    
        await _ProfileGroup.save();

     
      return NextResponse.json(
      {
        id: _ProfileGroup._id,
        PROFILE_NAME: PROFILE_NAME,
        workgroup_id: workgroup_id,
        createdAt: _ProfileGroup.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: error.message,
    });
  }
};
