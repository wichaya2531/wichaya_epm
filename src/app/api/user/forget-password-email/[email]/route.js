import { User } from "@/lib/models/User.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
import { Workgroup } from "@/lib/models/Workgroup";
import { ForgetSession } from "@/lib/models/ForgetSession"; // Import the ForgetSession model

export const dynamic = 'force-dynamic';

export const GET = async (req, { params }) => {
    await connectToDb();
    
    const { email } = params;
    try {
        const users = await User.find({ EMAIL: email });
        if (users.length === 0) {
            return NextResponse.json({ status: 404, error: "Account not found" });
        }

        const workgroups = await Workgroup.find();

        const reset_links = users.map((user) => {
            const userWorkgroup = workgroups.find((workgroup) => workgroup.USER_LIST.includes(user._id));
            return {
                emp_number: user.EMP_NUMBER,
                emp_name: user.EMP_NAME,
                email: user.EMAIL,
                workgroup: userWorkgroup ? userWorkgroup.WORKGROUP_NAME : "No workgroup",
                username: user.USERNAME,
                reset_link: `/reset-password?user_id=${user._id}`
            };
        });

        // Create ForgetSession instances for each user
        const forgetSessions = await Promise.all(users.map(async (user) => {
            const existingForgetSession = await ForgetSession.findOne({ USER_ID: user._id });
            if (existingForgetSession) {
                return existingForgetSession;
            }
            const forgetSession = new ForgetSession({
                USER_ID: user._id
            });
            await forgetSession.save();
            return forgetSession;
        }));

        return NextResponse.json({ status: 200, account_found: reset_links });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }
};
