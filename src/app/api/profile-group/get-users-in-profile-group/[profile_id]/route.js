import { ProfileGroup  } from "../../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
import { User } from "@/lib/models/User.js";


export const GET = async (req, {params}) => {
    await connectToDb();
    const { profile_id } = params;
    //console.log('GET profile_id',profile_id);
  try {
       // สร้างเอกสาร
      //var users=new Array();
      const _ProfileGroup=await ProfileGroup.findById(profile_id);
      const users = await User.find({
        _id: { $in: _ProfileGroup.USER_LIST }
      }).select("_id EMP_NAME USERNAME EMAIL");
      
      //console.log('users',users);
      _ProfileGroup.USER_LIST=users;
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
