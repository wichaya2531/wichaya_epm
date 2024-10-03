import { Status } from "@/lib/models/Status";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
    await connectToDb();
    try {
        const status = await Status.find();
        return NextResponse.json({ status: 200, status });
    } catch (error) {
        return NextResponse.json({ status: 500, error: error.message });
    }
}
