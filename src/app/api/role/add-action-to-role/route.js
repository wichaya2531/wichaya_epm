
import { RoleHasAction } from "@/lib/models/RoleHasAction.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { role_id, actions_id } = body;

    try {
        const promises = actions_id.map(async (action_id) => {
            const existingRoleHasAction = await RoleHasAction.findOne({ ROLE_ID: role_id, ACTION_ID: action_id });

            if (existingRoleHasAction) {
                return { dupclicated: true };
            }

            const newRoleHasAction = new RoleHasAction({
                ROLE_ID: role_id,
                ACTION_ID: action_id,
            });
            await newRoleHasAction.save();

            return newRoleHasAction;
        });

        const results = await Promise.all(promises);

        return NextResponse.json({ status: 200, results });
    } catch (err) {
        return NextResponse.json({ message: "Action addition to role failed", file: __filename, error: err.message, status: 500 });
    }
};

