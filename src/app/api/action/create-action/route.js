
import { Action } from "@/lib/models/Action.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";


export const POST = async (req, res) => {
    await connectToDb();
    const body = await req.json();
    const { ACTION_NAME } = body;
    try {
        const action = await Action.create({ ACTION_NAME });
        return NextResponse.json({ message: "Action created successfully", action });
    } catch(err) {
        return NextResponse.json({ message: "Action creation failed", file: __filename, error: err.message });
    }
};
