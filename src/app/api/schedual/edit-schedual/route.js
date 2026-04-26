
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";

export const POST = async (req) => {
  await connectToDb();

  try {
    const body = await req.json();
    const schedual_ids = Array.isArray(body._id) ? body._id : [];
    const datetime = body.datetime;

    if (!schedual_ids.length) {
      return NextResponse.json({
        status: 400,
        message: "กรุณาระบุ Schedule ID อย่างน้อย 1 รายการ",
      });
    }

    if (!datetime) {
      return NextResponse.json({
        status: 400,
        message: "กรุณาระบุวันที่และเวลา",
      });
    }

    const result = await Schedule.updateMany(
      { _id: { $in: schedual_ids } },
      { $set: { ACTIVATE_DATE: datetime } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 404,
        message: "ไม่พบ Schedule ที่ต้องการแก้ไข",
      });
    }

    return NextResponse.json({
      status: 200,
      message: `อัปเดตเรียบร้อย ${result.modifiedCount} รายการ`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating schedual:", error);
    return NextResponse.json({
      status: 500,
      message: "เกิดข้อผิดพลาด",
      error: error.message,
    });
  }
};

// import { NextResponse } from "next/server.js";
// import { Job } from "@/lib/models/Job.js";
// import { JobItem } from "@/lib/models/JobItem.js";
// import { Machine } from "@/lib/models/Machine";
// import { Workgroup } from "@/lib/models/Workgroup";
// import { User } from "@/lib/models/User.js";
// import { TestLocation } from "@/lib/models/TestLocation";
// import { Status } from "@/lib/models/Status";
// import { connectToDb } from "@/app/api/mongo/index.js";
// import { JobApproves } from "@/lib/models/JobApprove";
// import { Schedule } from "@/lib/models/Schedule.js";
// export const POST = async (req) => {
//   //console.log('use edit schedual!!');
//   await connectToDb();

//   const body = await req.json();
//   const schedual_id = body._id?.[0]; // ✅ ดึง _id จาก array
//   const datetime = body.datetime;

//   //console.log('schedual_id', schedual_id);   
//   //console.log('datetime', datetime);

//   try {
//     const _schedual = await Schedule.findById(schedual_id);

//     if (!_schedual) {
//       return NextResponse.json({ status: 404, message: "ไม่พบ Schedule ที่ต้องการแก้ไข" });
//     }

//     _schedual.ACTIVATE_DATE = datetime;
//     await _schedual.save(); // ✅ รอให้ save เสร็จ

//     return NextResponse.json({ status: 200, message: "อัปเดตเรียบร้อย" });
//   } catch (error) {
//     console.error("Error updating schedual:", error);
//     return NextResponse.json({ status: 500, message: "เกิดข้อผิดพลาด", error: error.message });
//   }
// };