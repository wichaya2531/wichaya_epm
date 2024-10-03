
import { User } from "@/lib/models/User.js";
import { Workgroup } from "@/lib/models/Workgroup.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
    await connectToDb();
    const { workgroup_id, user_id } = await req.json();
    try {
        const workgroup = await Workgroup.findById(workgroup_id);
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found" });
        }
        const user = await User.findById(user_id);
        if (!user) {
            return NextResponse.json({ message: "User not found" });
        }
        workgroup.USER_LIST.push(user_id);
        
        await user.save();
        await workgroup.save();
        return NextResponse.json({ status:200, workgroup });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
};
