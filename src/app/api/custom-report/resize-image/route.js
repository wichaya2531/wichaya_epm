import {NextResponse} from "next/server";
import sharp from "sharp";

export const POST = async (req, res) => {
    try {
        const imageBlob = await req.blob();
        const arrBuffer = await imageBlob.arrayBuffer()
        const compressedBuffer = await sharp(arrBuffer)
            .resize(1024, 1024, { fit: "inside" })
            .toFormat("jpeg", { quality: 80 })
            .toBuffer();
        const outputBlob = new Blob([compressedBuffer]);
        return new NextResponse(outputBlob, {
            status: 200,
            headers: { "content-type": "image/jpeg" },
        })
    }
    catch (error) {
        return NextResponse.json({
            status: 500,
            error: error,
        })
    }
}
