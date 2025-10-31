
import { Role } from "@/lib/models/Role.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req, {params}) => {
    await connectToDb();
    const { role_id } = params;
    try {
        //sort by l;astest updated
        const role = await Role.findById(role_id).sort({updatedAt: 1});
        if (!role) {
            return NextResponse.json({ message: "Role not found", file: __filename });
        }
        return NextResponse.json({ message: "Role found", name: role.ROLE_NAME, _id: role._id, actionList: role.ACTION_LIST});
    } catch (err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
                console.log("Error Code : 072");
         }
        return NextResponse.json({ message: "Role retrieval failed", file: __filename, error: err.message });
    }

};
