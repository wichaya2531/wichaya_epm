import { User } from "@/lib/models/User.js";
import { NextResponse } from "next/server";
import { Role } from "@/lib/models/Role";
import { Workgroup } from "@/lib/models/Workgroup";
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
        let workgroupName = "No workgroup";
        let workgroupId = "No workgroup";

        // Fetch role
        if (user.ROLE) {
          try {
            const role = await Role.findById(user.ROLE);
            roleName = role ? role.ROLE_NAME : "No role";
          } catch (error) {
            console.error("Error fetching role:", error);
          }
        }

        // Fetch workgroup
        try {
          const workgroupData = await Workgroup.aggregate([
            {
              $match: {
                USER_LIST: user._id, // Match users in workgroup
              },
            },
            {
              $project: {
                _id: 1,
                workgroup: "$WORKGROUP_NAME",
              },
            },
          ]);

          if (workgroupData.length > 0) {
            workgroupName = workgroupData[0].workgroup;
            workgroupId = workgroupData[0]._id;
          }
        } catch (error) {
          console.error("Error fetching workgroup:", error);
        }
        return {
          _id: user._id,
          username: user.USERNAME,
          password: user.PASSWORD,
          emp_number: user.EMP_NUMBER,
          email: user.EMAIL,
          name: user.EMP_NAME,
          role: roleName,
          workgroup: workgroupName,
          workgroup_id: workgroupId,
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
