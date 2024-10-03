
import { Role } from "@/lib/models/Role.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const PUT = async (req, {params}) => {
    await connectToDb();
    const { role_id } = params;
    const body = await req.json();
    try {
        const role = await Role.findOneAndUpdate({ _id: role_id }, { $set: body }, { new: true });
        if (!role) {
            return NextResponse.json({ message: "Role not found", file: __filename });
        }
        return NextResponse.json({ message: "Role updated successfully", role });
    } catch (err) {
        return NextResponse.json({ message: "Role update failed", file: __filename, error: err.message });
    }

};
