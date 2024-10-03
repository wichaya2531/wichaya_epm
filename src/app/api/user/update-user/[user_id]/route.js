import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, { params }) => {
  await connectToDb();
  const { user_id } = params;
  const body = await req.json();
  try {
    const user = await User.findOneAndUpdate(
      { _id: user_id },
      { $set: body },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ message: "User not found", file: __filename });
    }
    return NextResponse.json({ status: 200, user });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
