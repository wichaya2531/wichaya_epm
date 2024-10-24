
import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";
import { Workgroup } from "@/lib/models/Workgroup";
import { ObjectId } from 'mongodb'; // นำเข้า ObjectId จาก mongodb library


export const POST = async (req) => {
  await connectToDb();

  const form = await req.formData();
  const user_id= form.get("user_id");
  const selectLineName = form.get("linename");
  //console.log("req user_id=> ", user_id);
  
  const workgroups = await Workgroup.findOne({
    USER_LIST: new ObjectId(user_id) // ใช้ new ObjectId เพื่อค้นหาด้วย ObjectId
  });
  const workgroup_id = workgroups._id;

  try {
    const newLineName = await SelectLineName.create({ 
      name: selectLineName,
      WORKGROUP_ID:workgroup_id      
    }); // สร้าง newLineName

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
