
import { User } from "@/lib/models/User.js";
import { Workgroup } from "@/lib/models/Workgroup";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const DELETE = async (req, res) => {
    
    //console.log("use DELETE User from workgroup!!");
    await connectToDb();
    const {user_id, workgroup_id} = await req.json();
    //console.log('user_id',user_id);
    //console.log('workgroup_id',workgroup_id);

    //return NextResponse.json({ status:200 });
    

    try {
        const workgroup = await Workgroup.findById(workgroup_id);
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found" });
        }
        const user = await User.findById(user_id);
        if (!user) {
            return NextResponse.json({ message: "User not found" });
        }
        workgroup.USER_LIST.pull(user_id);
        user.ROLE = null;
        await user.save();
        await workgroup.save();
        return NextResponse.json({ status:200, workgroup });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }

};
