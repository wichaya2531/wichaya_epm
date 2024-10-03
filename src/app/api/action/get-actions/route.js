
import { Action } from "@/lib/models/Action.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    await connectToDb();
    try {
        const actions = await Action.find();
        const data = actions.map((action) => ({
            _id: action._id,
            name: action.ACTION_NAME,
           
        }));
        return NextResponse.json({ actions:data , status: "200" });
    } catch (err) {
        return NextResponse.json({ message: "Read all actions failed", file: __filename, error: err.message });
    }
};
