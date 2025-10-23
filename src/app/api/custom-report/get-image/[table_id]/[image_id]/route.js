import fs from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

export const GET = async (req, { params }) => {
    const { table_id, image_id } = params;
    console.log(table_id, image_id);
    const fsPath = '/home/hokeypokey/Documents/epm_filesystem'
    const dir = `${fsPath}/custom_report/table_assets/images/${table_id}`;
    const filePath = `${dir}/${image_id}.jpg`;
    try {
        const blob = new Blob([await fs.readFile(filePath)], {
            type: "image/jpeg"
        });

        return new NextResponse(blob);
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
