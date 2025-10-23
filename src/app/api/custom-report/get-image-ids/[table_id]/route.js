import fs from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

export const GET = async (req, { params }) => {
    const { table_id } = params;
    const fsPath = '/home/hokeypokey/Documents/epm_filesystem'
    const dir = `${fsPath}/custom_report/table_assets/images/${table_id}`;
    try {
        const files = await fs.readdir(dir)

        return NextResponse.json({
            status: 200,
            ids: files.map(file => file.slice(0, -4)),
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
