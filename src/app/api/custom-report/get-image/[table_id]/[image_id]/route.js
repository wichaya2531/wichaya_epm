import fs from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

export const GET = async (req, { params }) => {
    const { table_id, image_id } = params;
    const fsPath = path.join("C:", "ePM_CustomReport")
    const dir = path.join(fsPath, "table_assets", "images", table_id);
    const filePath = path.join(dir, `${image_id}.jpg`);
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
