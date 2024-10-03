import { login } from "@/lib/utils/utils.js";
import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/utils/utils.js";
import { connectToDb } from "@/app/api/mongo/index.js";

const SECRET_KEY = process.env.SECRET_KEY;

export const POST = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { username, password } = body;

  try {
    // Check for super admin login
    if (username === "SA" && password === "admin") {
      const user_id = "sa";
      const session = await login(user_id);
      return NextResponse.json({
        message: "SA Logged In",
        access_level: "SA",
        session,
      });
      console.log(username);
    }

    // Find the user with a case-insensitive match

    const user = await User.findOne({
      USERNAME: new RegExp(`^${username}$`, "i"),
    });
    // Check if the user exists
    if (!user) {
      return NextResponse.json({ message: "User not found", file: __filename });
    }

    // Check if the password matches
    if (user.PASSWORD !== password) {
      return NextResponse.json({
        message: "Password does not match",
        file: __filename,
      });
    }

    // Encrypt user data to generate a token
    const token = await encrypt(
      {
        user_id: user._id,
        username: user.USERNAME,
        Role: user.ROLE,
      },
      SECRET_KEY
    );

    // Set the token in cookies (if needed)
    // cookies().set("token", token, { httpOnly: true, sameSite: "strict", secure: true });

    // Prepare user data to return
    const data = {
      Role: user.ROLE,
      username: user.USERNAME,
      emp_name: user.EMP_NAME,
      emp_number: user.EMP_NUMBER,
    };

    // Return the response with user data and token
    return NextResponse.json({ status: 200, user: data, token: token });
  } catch (err) {
    // Handle errors and return a failure response
    return NextResponse.json({
      message: "User login failed",
      file: __filename,
      error: err.message,
    });
  }
};
