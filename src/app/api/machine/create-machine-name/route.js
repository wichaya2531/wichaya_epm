import { Machine } from "../../../../lib/models/Machine.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req) => {
  await connectToDb();

  try {
    const body = await req.json(); // อ่าน JSON จาก request
    const { wd_tag, machine_name } = body;

    console.log("Received Data:", { wd_tag, machine_name });

    if (!wd_tag || !machine_name) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "WD_TAG and MACHINE_NAME are required",
      });
    }

    const machine = new Machine({
      WD_TAG: wd_tag,
      MACHINE_NAME: machine_name,
    });

    await machine.save();

    return NextResponse.json({
      status: 200,
      success: true,
      machine: {
        _id: machine._id,
        wd_tag: machine.WD_TAG,
        name: machine.MACHINE_NAME,
        createdAt: machine.createdAt,
      },
    });
  } catch (error) {
    console.error("Error Creating Machine:", error);

    return NextResponse.json({
      status: 500,
      success: false,
      message: error.message,
    });
  }
};
