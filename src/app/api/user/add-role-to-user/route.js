
import { User } from "@/lib/models/User.js";
import { Role } from "@/lib/models/Role.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { user_id, role_id } = body;
    try {
        const user = await User.findById(user_id);
        if (!user) {
            return NextResponse.json({ message: "User not found" });
        }
        const role = await Role.findById(role_id);
        if (!role) {
            return NextResponse.json({ message: "Role not found" });
        }
        const userHasRole = new UserHasRole({
            USER_ID: user_id,
            ROLE_ID: role_id,
        });
        await userHasRole.save();
        return NextResponse.json({ status: 200, userHasRole });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
};
