import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();
  const raw = formData.get("jobIds");

  // แปลง JSON string กลับเป็น array
  let jobIds = [];
  try {
    jobIds = JSON.parse(raw || "[]");
  } catch {
    jobIds = [];
  }

  // redirect พร้อมแนบ array (เข้ารหัส Base64 กัน URL ยาว)
  const encoded = Buffer.from(JSON.stringify(jobIds)).toString("base64");
  const redirectUrl = new URL(`/pages/job-manage?jobs=${encoded}`, req.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}