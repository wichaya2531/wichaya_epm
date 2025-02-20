
import { Workgroup } from "@/lib/models/Workgroup.js";
import { User } from "@/lib/models/User.js";
import { NextResponse } from 'next/server';
import { Role } from "@/lib/models/Role";
import { connectToDb } from "@/app/api/mongo/index.js";
export const dynamic = 'force-dynamic';
export const GET = async (req, {params}) => {
    //console.log(" ****api get user from work group*****");
    await connectToDb();
    const { workgroup_id } = params;

    //console.log("workgroup_id",workgroup_id);
    try {
        const workgroup = await Workgroup.findById(workgroup_id);
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found", file: __filename });
        }
        let users = []

        for (let i = 0; i < workgroup.USER_LIST.length; i++) {
            //console.log("user",workgroup.USER_LIST[i]);
            try{
                const user = await User.findById(workgroup.USER_LIST[i]);
                let role_name
                if (!user.ROLE){
                    role_name = "No Role"
                }
                const role = await Role.findById(user.ROLE)||"Checker";
                if (role){
                    role_name = role.ROLE_NAME;
                }
                //console.log("role_name",role_name);
                users.push(
                    {
                        _id: user._id,
                        emp_number: user.EMP_NUMBER,
                        email: user.EMAIL,
                        name: user.EMP_NAME,
                        role: role_name
                        
                    }
                );
            }catch(err){}
        }
        //console.log("users",users);
        return NextResponse.json({ status: 200, users });
    } catch (err) {
       // console.log("Err",err);
        return NextResponse.json({ status: 500, file: __filename, error: err.message });
    }

};
