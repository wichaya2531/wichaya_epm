
import { NextResponse } from "next/server";
import { RoleHasAction } from "@/lib/models/RoleHasAction";
import { connectToDb } from "@/app/api/mongo/index.js";

export const DELETE = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { role_id, actions_id } = body;

  try {
    const removeRoleHasAction = actions_id.map(async (action_id) => {
      await RoleHasAction.deleteOne({ ROLE_ID: role_id, ACTION_ID: action_id });
    });
    return NextResponse.json({ status: 200 });
  } catch (err) {
    return NextResponse.json({
      message: "Action removal from role failed",
      file: __filename,
      error: err.message,
      status: 500,
    });
  }
};
