import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ProfileGroup } from "@/lib/models/ProfileGroup.js";
import mongoose from "mongoose";

export const POST = async (req, { params }) => {
  await connectToDb();
    //const id = params?.id;
    const { _id,PROFILE_NAME, workgroup_id } = await req.json();
  
    //console.log('PROFILE_NAME',PROFILE_NAME);
    //console.log('workgroup_id',workgroup_id);
    //console.log('_id',_id);
  try {
    
    let _ProfileGroup=await ProfileGroup.findById(_id);
    _ProfileGroup.PROFILE_NAME=PROFILE_NAME;
    await _ProfileGroup.save();
    //console.log('_ProfileGroup ที่ค้นเจอ ',_ProfileGroup);
    // _ProfileGroup={
//
    // }
    // if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    //   return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    // }
    // if (!PROFILE_NAME?.trim() || !workgroup_id) {
    //   return NextResponse.json(
    //     { message: "PROFILE_NAME and workgroup_id are required" },
    //     { status: 400 }
    //   );
    // }

    // // กันซ้ำ: ชื่อเดียวกันใน workgroup เดียวกัน (ยกเว้นเอกสารนี้)
    // const dup = await ProfileGroup.findOne({
    //   _id: { $ne: id },
    //   PROFILE_NAME: PROFILE_NAME.trim(),
    //   workgroup_id,
    // }).lean();

    // if (dup) {
    //   return NextResponse.json(
    //     { message: "Duplicate profile name in this workgroup" },
    //     { status: 409 }
    //   );
    // }

    // const doc = await ProfileGroup.findByIdAndUpdate(
    //   id,
    //   { $set: { PROFILE_NAME: PROFILE_NAME.trim() } },
    //   { new: true }
    // );

    // if (!doc) {
    //   return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    // }

    return NextResponse.json(
    //   {
    //     id: doc._id.toString(),
    //     PROFILE_NAME: doc.PROFILE_NAME,
    //     workgroup_id: doc.workgroup_id,
    //     updatedAt: doc.updatedAt,
    //   },
      { status: 200 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate profile name", error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
};
