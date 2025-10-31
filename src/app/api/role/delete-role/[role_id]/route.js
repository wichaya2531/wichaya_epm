
import { Role } from "@/lib/models/Role.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

export const DELETE = async (req, {params}) => {
    await connectToDb();
    const { role_id } = params;
    try {
        await Role.findByIdAndDelete(role_id);
        return NextResponse.json({ message: "Role deleted successfully" });
    } catch (err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 070");
         }
        return NextResponse.json({ message: "Role deletion failed", file: __filename, error: err.message });
    }

};
