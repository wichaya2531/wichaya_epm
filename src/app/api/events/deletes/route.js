import { connectToDb } from "@/app/api/mongo/index.js";
import { NextResponse } from "next/server";
import { Schedule } from "@/lib/models/Schedule";
import { Job } from "@/lib/models/Job";

export const POST = async (req) => {
  await connectToDb();

  const body = await req.json();
  const events = body.events || [];

  for (const element of events) {
    //console.log("event:", element);
    const [event_type, event_id] = element.split("-");

    if (event_type === "job") {
         const _findAndDeleteJob =  await Job.findByIdAndDelete(event_id); // ลบจาก Job collection
    } else if (event_type === "schedule") {
      const _findAndDeleteSchedual = await Schedule.findByIdAndDelete(event_id); // ลบจาก Schedule collection
    }
  }

  return NextResponse.json({ status: 200, message: "Events deleted" });
};
