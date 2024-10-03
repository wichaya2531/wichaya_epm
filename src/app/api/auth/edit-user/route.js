import { User } from '@/lib/models/User.js';
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';

export const PUT = async (req, res) => {
  await connectToDb();
  const form = await req.formData();

  try {
    const user_id = form.get("user_id");
    const emp_number = form.get("emp_number");
    const emp_name = form.get("emp_name");
    const email = form.get("email");
    const username = form.get("username");
    const password = form.get("password")
    const team = form.get("team");
    const file = form.get("file");

    //check if user exists
    const user = await User.find({ USERNAME: username });
    if(user.length > 1){
      return NextResponse.json({ status: 400, error: "Username already exists" });
    }

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split(".").pop(); // This line causes error when file is null
      const filename = `${user_id}.${fileExtension}`;
      const relativeFilePath = path.join("user-profile", filename);
      const filePath = path.join(process.cwd(), "public", relativeFilePath);
      fs.writeFileSync(filePath, buffer);

      // Update user with file path
      const user = await User.findById(user_id);
      if (!user) {
        return NextResponse.json({ status: 404, error: "User not found" });
      }

      user.EMP_NUMBER = emp_number || user.EMP_NUMBER;
      user.EMP_NAME = emp_name || user.EMP_NAME;
      user.EMAIL = email || user.EMAIL;
      user.USERNAME = username || user.USERNAME;
      user.PASSWORD = password === "null" ? user.PASSWORD : password;
      user.TEAM = team || user.TEAM;
      user.USER_IMAGE = `/user-profile/${filename}`; // Save relative path to the image

      await user.save();

      return NextResponse.json({ status: 200 });
    } else {
      // Handle case where no file is uploaded
      const user = await User.findById(user_id);
      if (!user) {
        return NextResponse.json({ status: 404, error: "User not found" });
      }

      user.EMP_NUMBER = emp_number;
      user.EMP_NAME = emp_name;
      user.EMAIL = email;
      user.USERNAME = username;
      user.PASSWORD = password;
      user.TEAM = team;

      await user.save();

      return NextResponse.json({ status: 200 });
    }
  } catch (err) {
    console.error("Error processing request:", err);
    return NextResponse.json({ status: 500, error: err.message });
  }
};
