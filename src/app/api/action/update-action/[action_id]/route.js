
import { Action } from "@/lib/models/Action.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, {params}) => {
    await connectToDb();
    const { action_id } = params;
    const body = await req.json();
    try {
        const action = await Action.findOneAndUpdate({ _id: action_id }, { $set: body }, { new: true });
        if (!action) {
            return NextResponse.json({ message: "Action not found", file: __filename });
        }
        return NextResponse.json({ message: "Action updated successfully", action });
    } catch (err) {
        return NextResponse.json({ message: "Action update failed", file: __filename, error: err.message });
    }
};
