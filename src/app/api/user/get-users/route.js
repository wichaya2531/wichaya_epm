import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { Role } from "@/lib/models/Role";
import { getSession } from "@/lib/utils/utils.js";
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = "force-dynamic";
export const GET = async (req, paramress) => {
  await connectToDb();
  const session = await getSession();
  try {
    const users = await User.find();
    if (!users) {
      return NextResponse.json({ message: "No users found", file: __filename });
    }

    const data = await Promise.all(
      users.map(async (user) => {
        let roleName = "No role";
        if (user.ROLE) {
          try {
            const role = await Role.findById(user.ROLE);
            roleName = role ? role.ROLE_NAME : "No role";
          } catch (error) {
            console.error("Error fetching role:", error);
          }
        }
        return {
          _id: user._id,
          emp_number: user.EMP_NUMBER,
          email: user.EMAIL,
          name: user.EMP_NAME,
          role: roleName,
        };
      })
    );

    return NextResponse.json({ status: 200, users: data });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
