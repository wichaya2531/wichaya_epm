// import { connectToDb } from "@/app/api/mongo/index.js";
// import SelectLineName from "@/lib/models/SelectLineName";

// export async function POST(req, res) {
//   await connectToDb();

//   try {
//     const { name } = await req.json(); // ดึงข้อมูลจาก body request
//     const newLineName = await SelectLineName.create({ name });
//     return new Response(JSON.stringify({ success: true, data: newLineName }), {
//       status: 201,
//     });
//   } catch (error) {
//     return new Response(
//       JSON.stringify({ success: false, message: error.message }),
//       { status: 400 }
//     );
//   }
// }

import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";

export async function POST(req, res) {
  await connectToDb();

  try {
    const { name } = await req.json(); // ดึงข้อมูลจาก body request
    const newLineName = await SelectLineName.create({ name }); // สร้าง newLineName

    // ส่งข้อมูล line name ที่เพิ่งสร้างใหม่กลับไป
    return new Response(
      JSON.stringify({ success: true, lineName: newLineName }), // เปลี่ยนจาก data เป็น lineName
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 400 }
    );
  }
}
