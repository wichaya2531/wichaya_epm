
import { Machine } from "../../../../lib/models/Machine.js";
import { NextResponse } from 'next/server.js';
import { connectToDb } from "@/app/api/mongo/index.js";
/**
 * @swagger
 * /api/machine/create-machine:
 *   post:
 *     summary: Create a new machine
 *     description: Endpoint to create a new machine.
 *     tags:
 *       - Machine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               WD_TAG:
 *                 type: string
 *               MACHINE_NAME:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successful response with created machine data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 machine:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     WD_TAG:
 *                       type: string
 *                     MACHINE_NAME:
 *                       type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 file:
 *                   type: string
 *                 error:
 *                   type: string
 */

export const POST = async (req, res) => {

    //return NextResponse.json({ status: 200, message: 'Hello' });

    await connectToDb();
    const body = await req.json();
    const { WD_TAG, MACHINE_NAME } = body;
    try {
        const machine = new Machine({
            WD_TAG,
            MACHINE_NAME
        });
        await machine.save();

        const data = {
            "wd_tag": machine.WD_TAG,
            "name": machine.MACHINE_NAME
        }

        return NextResponse.json({ status: 200, machine });
    } catch (error) {
        return NextResponse.json({ status: 500, file: __filename, error: error.message });
    }
}

