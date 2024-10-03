import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const {
    EMP_NUMBER,
    EMP_NAME,
    USERNAME,
    TEAM,
    POSITION,
    EMAIL,
    SEC,
    PASSWORD,
  } = body;
  try {
    const user = new User({
      EMP_NUMBER,
      EMP_NAME,
      USERNAME,
      TEAM,
      POSITION,
      EMAIL,
      SEC,
      PASSWORD,
    });
    await user.save();
    return NextResponse.json({ status: 200, user });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
