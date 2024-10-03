
import { User } from "@/lib/models/User.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { ForgetSession } from "@/lib/models/ForgetSession";

export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { user_id, password } = body;

    try {
        const user = await User.findById(user_id);
        if (!user) {
            return NextResponse.json({ error: "User not found" });
        }
        const forgetSession = await ForgetSession.findOne({ USER_ID: user_id });

        if (!forgetSession) {
            return NextResponse.json({ error: "Session has expired" });
        }

        user.PASSWORD = password;
        await user.save();

        //delete forget session
       const deleteForgetSession = await ForgetSession.deleteOne({ USER_ID : user_id });



        return NextResponse.json({ message: "Password updated successfully" , status: 200 });
       
    } catch (err) {
        return NextResponse.json({ error: "User login failed", file: __filename, error: err.message });
    }
};
