import fs from "fs";
import path from "path";
import sharp from "sharp";
import { NextResponse } from "next/server";

export const POST = async (req, res) => {
  //console.log("use  POST");
  try {
    const form = await req.formData();
    const FILE = form.get("file");
    const JOB_Item_ID = form.get("job_item_id");

    var responsePath = "";
    if (FILE && FILE.size > 0) {
      const buffer = Buffer.from(await FILE.arrayBuffer());
      const fileExtension = FILE.name.split(".").pop().toLowerCase();
      const filename = `${JOB_Item_ID}_${Date.now()}.${fileExtension}`;
      const filePath = `C:\\ePM_PictureUpload\\Item\\${filename}`;
      responsePath = filename;

      // ตรวจสอบประเภทไฟล์ และลดขนาดเฉพาะไฟล์รูปภาพ
      const imageExtensions = ["jpg", "jpeg", "png", "webp"];
      if (imageExtensions.includes(fileExtension)) {
        const compressedBuffer = await sharp(buffer)
          .resize(1024, 1024, { fit: "inside" }) // จำกัดขนาดไม่เกิน 1024x1024 px
          .toFormat("jpeg", { quality: 80 }) // แปลงเป็น JPEG และลดคุณภาพลงเหลือ 80%
          .toBuffer();

        fs.writeFileSync(filePath, compressedBuffer);
      } else {
        fs.writeFileSync(filePath, buffer); // ถ้าไม่ใช่ไฟล์รูป ให้บันทึกตามปกติ
      }
    }

    //console.log(" Upload Success ");
    return NextResponse.json({
      result: true,
      message: "File uploaded successfully",
      filePath: responsePath,
    });

    // return NextResponse.json({ status: 200, result: "Hello World",path:responsePath });
  } catch (err) {
    console.log("Error: ", err.message);
    return NextResponse.json({
      result: false,
      file: __filename,
      error: err.message,
    });
  }
};
