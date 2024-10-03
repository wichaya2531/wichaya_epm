
import { Workgroup } from "@/lib/models/Workgroup.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, {params}) => {
    await connectToDb();
    const { workgroup_id } = params;
    const body = await req.json();
    try {
        const workgroup = await Workgroup.findOneAndUpdate({ _id: workgroup_id }, { $set: body }, { new: true });
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found", file: __filename });
        }
        return NextResponse.json({ message: "Workgroup updated successfully", workgroup });
    } catch (err) {
        return NextResponse.json({ message: "Workgroup update failed", file: __filename, error: err.message });
    }
};
