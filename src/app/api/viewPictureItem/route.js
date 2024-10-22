import fs from 'fs/promises'; // ใช้ promises เพื่อใช้ async/await ได้ง่ายขึ้น
import path from 'path';
import { NextResponse } from 'next/server';

export const GET = async (req,res) => {
    const { searchParams } = new URL(req.url);
    
    //console.log("imgPath",searchParams.get('imgName'));
    const fileName = searchParams.get('imgName');
    
    //const filePath = path.join('c:\\imagedownload', fileName);
    const filePath = "c:\\ePM_PictureUpload\\Item\\"+fileName; // หรือคุณสามารถใช้ path.join() ถ้าจำเป็น

    try {
        // อ่านไฟล์แบบ async
        const data = await fs.readFile(filePath);
        
        // ส่งข้อมูลไฟล์รูปภาพกลับเป็นการตอบสนอง
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'image/png', // หรือประเภทไฟล์ที่เหมาะสม
            },
        });
    } catch (err) {
        // ถ้าเกิดข้อผิดพลาด (เช่น ไฟล์ไม่เจอ) ให้ส่งสถานะ 404 กลับไป
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
};