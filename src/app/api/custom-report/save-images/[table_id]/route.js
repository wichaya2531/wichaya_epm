import {NextResponse} from "next/server";
import fs from "fs/promises";
import { existsSync, mkdir } from "fs";
import {pathify} from "next/dist/server/lib/squoosh/emscripten-utils";
import path from "path";

const isSameImages = async (image1_blob, image2_blob) => {
    const image1_bytes = await image1_blob.bytes();
    const image2_bytes = await image2_blob.bytes();
    return image1_bytes.every((byte, index) => image2_bytes[index] === byte)
}

export const POST = async (req, { params }) => {
    const { table_id } = params;
    const fsPath = path.join("C:", "ePM_CustomReport")
    const dir = path.join(fsPath, "table_assets", "images", table_id);
    const formData = await req.formData()
    const images = Array.from(formData.entries(), ([id, blob]) => ({
        id,
        blob,
    }))
    try {
        // check directory existed if not then create one
        try {
            await fs.access(dir, fs.constants.R_OK);
        }
        catch (e) {
            await fs.mkdir(dir, { recursive: true });
        }

        const allImageInSystemPaths = await fs.readdir(dir)
        const allImageInSystems = await Promise.all(
            allImageInSystemPaths.map(async (filePath) => ({
                id: path.basename(filePath, path.extname(filePath)),
                blob: new Blob(await fs.readFile(path.join(dir, filePath)), { type: "image/jpeg" }),
            }))
        )

        const imageNotInSystems = images.filter(({id, blob}) => (
            !allImageInSystems.some((sysImg) => (
                sysImg.id === id &&
                isSameImages(sysImg.blob, blob)
            ))
        ))
        const expectDeletedImagesInSystems = allImageInSystems.filter(({id, blob}) => (
            !images.some((img) => (
                img.id === id &&
                isSameImages(img.blob, blob)
            ))
        ))

        // insert where not in system
        for (const {id, blob} of imageNotInSystems) {
            await fs.writeFile(path.join(dir, `${id}.jpg`), await blob.bytes(), { encoding: "base64" });
        }

        // remove where not match input
        for (const {id, blob} of expectDeletedImagesInSystems) {
            await fs.rm(path.join(dir, `${id}.jpg`));
        }

        return NextResponse.json({
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
