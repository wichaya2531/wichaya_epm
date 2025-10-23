import {connectToDb} from "@/app/api/mongo";
import {CustomReportProfile} from "@/lib/models/CustomReportProfile";
import {CustomReportTable} from "@/lib/models/CustomReportTable";
import {NextResponse} from "next/server";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { user_id } = body
    try {
        const profile_infos = await CustomReportProfile.find({
            USER_ID: user_id,
        }, {
            _id: 0,
            id: "$_id",
            name: 1,
            width: 1,
            height: 1,
        })
        return NextResponse.json({
            profile_infos,
            status: 200,
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
