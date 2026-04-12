// /api/machine/get-machines/route.js
import { Machine } from "../../../../lib/models/Machine.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job.js";

export const dynamic = "force-dynamic";

export const GET = async (req) => {
  const searchParams = req.nextUrl.searchParams;
  const workgroup_id = searchParams.get("workgroup_id");
  const job_id_filter = searchParams.get("filter");
  const streamMode = searchParams.get("stream") === "1" ||
                     req.headers.get("accept")?.includes("application/x-ndjson");

  await connectToDb();
  
  //console.log("Hello World");
  // --- สร้าง key_filter จาก JOB_NAME [xxx] ---
  let key_filter = "";
  if (job_id_filter) {
    try {
      const job = await Job.findById(job_id_filter);
      if (typeof job?.JOB_NAME === "string") {
        const m = job.JOB_NAME.match(/\[(.*?)\]/);
        key_filter = m ? m[1] : "";
      }
    } catch (e) {
      // ไม่ต้อง throw เพื่อไม่ให้สตรีมล่มแค่ไม่มี job
    }
  }

  // --- สร้าง query ---
  const query = {};
  if (workgroup_id && workgroup_id !== "0") {
    query.workgroup_id = workgroup_id;
  }
  if (key_filter) {
    query.WD_TAG = new RegExp(key_filter, "i");
  }

  try {
    if (!streamMode) {
      // ===== โหมดปกติ (JSON ทั้งก้อน) =====
      const machines = await Machine.find(query).sort({ createdAt: -1 });
      const data = machines.map((machine) => ({
        _id: machine._id,
        wd_tag: machine.WD_TAG,
        name: machine.MACHINE_NAME,
        createdAt: machine.createdAt,
        createdBy: machine.created_by,
        workgroup: machine.workgroup,
        workgroup_id: machine.workgroup_id||"Unknown",
      }));
      return NextResponse.json({ status: 200, machines: data });
    }

    // ===== โหมดสตรีม (NDJSON) =====
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ใช้ .cursor() เพื่อไล่ออกทีละรายการ (หน่วยความจำต่ำ + สตรีมได้จริง)
          const cursor = Machine.find(query).sort({ createdAt: -1 }).cursor();

          // อาจส่ง record meta ตัวแรกก็ได้ (ไม่บังคับ)
          // controller.enqueue(encoder.encode(JSON.stringify({ type: "meta", ts: Date.now() }) + "\n"));

          for await (const machine of cursor) {
            const item = {
              _id: machine._id,
              wd_tag: machine.WD_TAG,
              name: machine.MACHINE_NAME,
              createdAt: machine.createdAt,
              createdBy: machine.created_by,
              workgroup: machine.workgroup,
              workgroup_id: machine.workgroup_id||"Unknown",
            };
            controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
          }

          controller.close();
        } catch (err) {
          // ส่ง error แบบ ndjson แล้วปิดสตรีม
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error", message: String(err?.message || err) }) + "\n")
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        // ป้องกัน cache ระหว่างสตรีม
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("Error Code : 067");
    }
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
