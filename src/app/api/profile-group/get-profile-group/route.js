import { ProfileGroup } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "mongodb";

export const POST = async (req) => {
  await connectToDb();

  try {
    const { workgroup_id } = await req.json();

    let query = {};

    if (workgroup_id && workgroup_id !== "all" && ObjectId.isValid(workgroup_id)) {
      query.workgroup_id = new ObjectId(workgroup_id);
    }

    const profileGroup = await ProfileGroup.find(query).sort({ PROFILE_NAME: 1 });

    return NextResponse.json({
      status: 200,
      profileGroup,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: error.message,
    });
  }
};