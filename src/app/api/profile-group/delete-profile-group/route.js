import { ProfileGroup  } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
export const POST = async (req, res) => {
  await connectToDb();
  const {_id } = await req.json();

  //return NextResponse.json({ status: 200});

  try {
    // สร้างเอกสาร
    const doc = await ProfileGroup.findByIdAndDelete(_id);
    if (!doc) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ status: 200});
  } catch (error) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: error.message,
    });
  }
};
