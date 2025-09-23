 //import nextConnect from 'next/next-connect';
//import multer from './next/multer';
// import path from 'path';
// import fs from 'fs';
import { NextResponse } from 'next/server';

export const GET = async () => {
   
  return NextResponse.json({ status: 200 });
}



// // สร้างโฟลเดอร์ 'uploads' หากยังไม่มี
// const dir = './uploads';
// if (!fs.existsSync(dir)) {
//   fs.mkdirSync(dir);
// }



// // ตั้งค่าการเก็บไฟล์ในเซิร์ฟเวอร์
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: './uploads', // โฟลเดอร์สำหรับเก็บไฟล์
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}${path.extname(file.originalname)}`); // ตั้งชื่อไฟล์ใหม่
//     },
//   }),
// });

// // ตัวจัดการการอัปโหลด
// const apiRoute = nextConnect({
//   onError(error, req, res) {
//     res.status(501).json({ error: `Something went wrong: ${error.message}` });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//   },
// });

// // ใช้ multer เพื่อรับไฟล์ที่อัปโหลด
// const uploadMiddleware = upload.single('file'); // 'file' คือชื่อฟิลด์ที่ส่งมาจาก client

// apiRoute.use(uploadMiddleware);

// apiRoute.post((req, res) => {

//   console.log('dir', dir);

//   res.status(200).json({ data: 'File uploaded successfully' });
// });

// export default apiRoute;

// export const config = {
//   api: {
//     bodyParser: false, // ปิด body parser ของ Next.js เพื่อใช้ multer
//   },
// };
