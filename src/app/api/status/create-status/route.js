import { Status } from "@/lib/models/Status";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";


export const POST = async (req, res) => {
    const body = await req.json();
    const { status_name,
        color
     } = body;
    await connectToDb();
    try {
        const status = await new Status({
            status_name,
            color
        }).save();
        return NextResponse.json({ status: 200});
    } catch (error) {
        return NextResponse.json({ status: 500, error: error.message });
    }
}
