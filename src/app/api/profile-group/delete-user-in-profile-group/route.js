import { ProfileGroup  } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
export const POST = async (req, res) => {
  await connectToDb();
  const {user_id,profile_id } = await req.json();
  
  // console.log('user_id',user_id);
  // console.log('profile_id',profile_id);

  //return NextResponse.json({ status: 200,message:"Hello world"});

  try {
    // สร้างเอกสาร
    const profileGroup = await ProfileGroup.findById(profile_id);
    if (!profileGroup) {
      return NextResponse.json({ status: 404, message: "Profile group not found" });
    }

    // กรอง USER_LIST เอาค่าที่ไม่ตรงกับ user_id
    profileGroup.USER_LIST = profileGroup.USER_LIST.filter(
      uid => uid.toString() !== user_id
    );

    await profileGroup.save();
    return NextResponse.json({ status: 200});
  } catch (error) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: error.message,
    });
  }
};
