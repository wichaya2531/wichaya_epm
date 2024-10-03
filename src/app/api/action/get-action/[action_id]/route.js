
import { Action } from "@/lib/models/Action.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const dynamic = 'force-dynamic';
export const GET = async (req, {params}) => {
    await connectToDb();
    const { action_id } = params;
    try {
        const action = await Action.findById(action_id);
        if (!action) {
            return NextResponse.json({ message: "Action not found", file: __filename });
        }
        return NextResponse.json({ message: "Action found", action });
    } catch (err) {
        return NextResponse.json({ message: "Action retrieval failed", file: __filename, error: err.message });
    }

};
