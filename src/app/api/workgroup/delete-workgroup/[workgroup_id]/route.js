
import { Workgroup } from "@/lib/models/Workgroup.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const DELETE = async (req, {params}) => {
    await connectToDb();
    const { workgroup_id } = params;
    try {
        const workgroup = await Workgroup.findByIdAndDelete(workgroup_id);
        // 1 user can be in multiple workgroups
        // 1 workgroup can have multiple users
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found", file: __filename });
        }
        return NextResponse.json({ message: "Workgroup deleted successfully", workgroup });
    } catch (err) {
        return NextResponse.json({ message: "Workgroup deletion failed", file: __filename, error: err.message });
    }

};
