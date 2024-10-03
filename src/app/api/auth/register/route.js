import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
  await connectToDb();
  const { emp_number, emp_name, email, username, password, team } =
    await req.json();

  try {
    //if username already exists

    var a_username = username.trim();
    var a_password = password.trim();
    var a_emp_number = emp_number.trim();

    const user = await User.findOne({
      USERNAME: a_username,
    });

    if (user) {
      return NextResponse.json({ status: 400, duplicateField: "Username" });
    }

    const new_user = new User({
      EMP_NUMBER: a_emp_number,
      EMP_NAME: emp_name,
      EMAIL: email,
      USERNAME: a_username,
      PASSWORD: a_password,
      TEAM: team,
    });

    console.log("username", ":" + a_username + ":");
    //return NextResponse.json({ status: 500 })

    await new_user.save();
    return NextResponse.json({
      status: 200,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
