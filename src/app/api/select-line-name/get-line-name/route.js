"use server";
import { connectToDb } from "@/app/api/mongo/index.js";
import SelectLineName from "@/lib/models/SelectLineName";
import { NextResponse } from "next/server"; // นำเข้า NextResponse
import { Workgroup } from "@/lib/models/Workgroup";
import { ObjectId } from 'mongodb'; // นำเข้า ObjectId จาก mongodb library


export const POST = async (req) => {
  //console.log("use GET line name");
  await connectToDb();
  const form = await req.formData();
  var user_id = form.get("user_id");
  //console.log("form =>", form);
  const workgroups = await Workgroup.findOne({
    USER_LIST: new ObjectId(user_id) // ใช้ new ObjectId เพื่อค้นหาด้วย ObjectId
  });
  const workgroup_id = workgroups._id;
 // console.log("workgroup_id =>", workgroup_id);

  try {
    const selectLineNames = await SelectLineName.find({ WORKGROUP_ID: workgroup_id });
    //console.log("selectLineNames =>", selectLineNames);
    return NextResponse.json({ status: 200, selectLineNames });
  } catch (err) {
    console.error("Error fetching line names:", err);
    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};
