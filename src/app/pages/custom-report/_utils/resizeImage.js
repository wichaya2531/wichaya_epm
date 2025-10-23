import mongoose from "mongoose";


const resizeImage = async ({blob, cells}) => {

    const imageIds = cells.map(row => row.map(cell => cell.image?.id)).flat().filter(id => id)
    const generatedId = (() => {
        const generateId = () => {
            const id = new mongoose.Types.ObjectId().toHexString()
            if (imageIds.includes(id)) {
                return generateId()
            } else {
                return id
            }
        }
        return generateId()
    })()
    const response = await fetch("/api/custom-report/resize-image", {
        method: "POST",
        body: blob,
    })
    if (response.ok) {
        const newBlob = await response.blob()
        return {
            blob: newBlob,
            path: URL.createObjectURL(newBlob),
            id: generatedId,
        }
    } else {
        return null
    }
}

export default resizeImage