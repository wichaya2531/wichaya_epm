
import { Workgroup } from "@/lib/models/Workgroup.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    await connectToDb();
    try {
        const workgroups = await Workgroup.find();
        return NextResponse.json({ message: "Read all workgroups successful", workgroups });
    } catch (err) {
        return NextResponse.json({ message: "Read all workgroups failed", file: __filename, error: err.message });
    }
};
