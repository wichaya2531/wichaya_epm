import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { Workgroup } from "@/lib/models/Workgroup";
import { RoleHasAction } from "@/lib/models/RoleHasAction";
import { connectToDb } from "@/app/api/mongo/index.js";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";
export const GET = async (req, { params }) => {
  await connectToDb();

  const { user_id } = params;
  try {
    const user = await User.findById(user_id);
    const userData = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $lookup: {
          from: "roles", // Assuming the collection name is 'roles'
          localField: "ROLE",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $project: {
          _id: 1,
          emp_number: 1,
          email: 1,
          name: 1,
          role: { $arrayElemAt: ["$role.ROLE_NAME", 0] }, // Extract role name from array
        },
      },
    ]);

    const workgroupData = await Workgroup.aggregate([
      {
        $match: {
          USER_LIST: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $project: {
          _id: 1,
          workgroup: "$WORKGROUP_NAME",
        },
      },
    ]);

    let workgroupId = "No workgroup";
    if (workgroupData.length > 0) {
      workgroupId = workgroupData[0]._id;
    }

    let workgroupName =
      workgroupData.length > 0 ? workgroupData[0].workgroup : "No workgroup";

    const user_roleID = new mongoose.Types.ObjectId(user.ROLE);

    const userActions = await RoleHasAction.aggregate([
      {
        $match: { ROLE_ID: user_roleID },
      },
      {
        $lookup: {
          from: "actions",
          localField: "ACTION_ID",
          foreignField: "_id",
          as: "actionDetails",
        },
      },
      {
        $unwind: "$actionDetails",
      },
      {
        $project: {
          _id: "$actionDetails._id",
          name: "$actionDetails.ACTION_NAME",
        },
      },
    ]);

    let data = {
      _id: user._id,
      username: user.USERNAME,
      emp_number: user.EMP_NUMBER,
      email: user.EMAIL,
      name: user.EMP_NAME,
      role: userData[0].role || "No role",
      team: user.TEAM,
      workgroup: workgroupName,
      workgroup_id: workgroupId,
      actions: userActions,
      image: user.USER_IMAGE || null,
    };

    return NextResponse.json({ status: 200, user: data });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
