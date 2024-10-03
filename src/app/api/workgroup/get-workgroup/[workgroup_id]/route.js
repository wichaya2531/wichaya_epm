
import { Workgroup } from "@/lib/models/Workgroup.js";
import { User } from "@/lib/models/User.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req, {params}) => {
    await connectToDb();
    const { workgroup_id } = params;
    try {
        const workgroup = await Workgroup.findById(workgroup_id);
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found", file: __filename });
        }

        const data = {
            _id: workgroup._id,
            name: workgroup.WORKGROUP_NAME,
        }
        return NextResponse.json({ status: 200, workgroup:data });
    } catch (err) {
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }

};
