import { addClient, removeClient, broadcast } from "@/lib/server/sseHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ สมัครฟัง SSE ตามกลุ่ม
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") || "public";

  const ts = new TransformStream();
  const writer = ts.writable.getWriter();
  const enc = new TextEncoder();

  // ลงทะเบียน client เข้ากลุ่ม
  addClient(group, writer);

  // กัน proxy ตัด
  const ping = setInterval(() => {
    writer.write(enc.encode(`: ping\n\n`)).catch(() => {});
  }, 15000);

  const cleanup = () => {
    clearInterval(ping);
    removeClient(group, writer);
    writer.close().catch(() => {});
  };
  req.signal?.addEventListener("abort", cleanup);

  return new Response(ts.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    },
  });
}

// ✅ ส่งข้อความเข้ากลุ่มด้วย workgroup_id
export async function POST(req) {
  try {
    const body = await req.json();
    // รองรับ 2 รูปแบบ:
    // 1) { workgroup_id, JOB_ID }
    // 2) { workgroup_id, data: {...} }
    const workgroup_id = body.workgroup_id || body.group;
    if (!workgroup_id) {
      return new Response(JSON.stringify({ error: "workgroup_id is required" }), { status: 400 });
    }

    const data = body.data ?? (
      body.JOB_ID ? { JOB_ID: body.JOB_ID } : null
    );

    if (!data) {
      return new Response(JSON.stringify({ error: "data or JOB_ID is required" }), { status: 400 });
    }

    // broadcast เฉพาะกลุ่มที่ระบุ
    broadcast(workgroup_id, data);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("POST /api/events error:", err);
    return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400 });
  }
}
