import { connectToDb } from "@/app/api/mongo/index.js";
import { Approves } from "@/lib/models/Approves";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const DELETE = async (req) => {
  const { jobTemplateId, userId } = await req.json();

  await connectToDb();

  try {
    // ลบ Approve ตาม userId
    await Approves.deleteOne({
      JOB_TEMPLATE_ID: jobTemplateId,
      USER_ID: userId,
    });

    return NextResponse.json({
      status: 200,
      message: "Approver removed successfully.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
