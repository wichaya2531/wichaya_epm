import fs from "fs";
import path from "path";
import mime from "mime";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { filename } = params;

    console.log("Filename: ", filename);

    // ระบุ path ที่จะดึงไฟล์
    const filePath = path.join("C:", "img-jobs", filename);

    console.log("File path: ", filePath);

    // ตรวจสอบว่ามีไฟล์อยู่จริงหรือไม่
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ status: 404, message: "File not found" });
    }

    const mimeType = mime.getType(filePath) || "application/octet-stream";

    const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json({
      status: 500,
      message: "Error fetching the image.",
    });
  }
}
