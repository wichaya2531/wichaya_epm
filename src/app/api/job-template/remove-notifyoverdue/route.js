import { connectToDb } from "@/app/api/mongo/index.js";
import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const DELETE = async (req) => {
  const { jobTemplateId, userId } = await req.json();

  await connectToDb();

  try {
    // ลบ Notify ตาม userId
    await NotifiesOverdue.deleteOne({
      JOB_TEMPLATE_ID: jobTemplateId,
      USER_ID: userId,
    });

    return NextResponse.json({
      status: 200,
      message: "Notifier removed successfully.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
