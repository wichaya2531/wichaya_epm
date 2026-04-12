// app/api/events/push/route.js
import { eventsBus } from "@/lib/server/eventsBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 📡 ใช้ POST เพื่อ broadcast ไปยังทุก client ที่กำลังฟัง SSE
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const payload = {
    type: body.type || "manual_push",
    data: body.data || "Hello from /api/events/push",
    at: new Date().toISOString(),
  };
   console.log('sent data from push....');
  // broadcast event
  console.log("payload", payload);
  eventsBus.emit("message", payload);

  return Response.json({ ok: true, broadcast: payload });
}
