import { Card } from '../../../../lib/models/Card.js';
 
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

/**
 * @swagger
 * /api/card/create-card:
 *   post:
 *     summary: Create a new card
 *     description: Create a new card with the provided details
 *     tags:
 *       - card
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the card
 *               detail:
 *                 type: string
 *                 description: Details of the card
 *               link:
 *                 type: string
 *                 description: The link associated with the card
 *               logo_path:
 *                 type: string
 *                 description: The path to the logo image
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the created card.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: HTTP status code
 *                   example: 200
 *                 card:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the card
 *                     title:
 *                       type: string
 *                       description: The title of the card
 *                     detail:
 *                       type: string
 *                       description: Details of the card
 *                     link:
 *                       type: string
 *                       description: The link associated with the card
 *                     logo_path:
 *                       type: string
 *                       description: The path to the logo image
 *       '500':
 *         description: Internal server error. An unexpected error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: HTTP status code
 *                   example: 500
 *                 file:
 *                   type: string
 *                   description: Filename where the error occurred
 *                   example: /path/to/your/file.js
 *                 error:
 *                   type: string
 *                   description: Error message
 */


export const POST = async (req, res) => {
    const body = await req.json();
    const { title, detail, link, logo_path } = body;
    await connectToDb();
    try {
        const card = new Card({
            TITLE: title,
            DETAIL: detail,
            LINK: link,
            LOGO_PATH: logo_path,
        });
        await card.save();
        return NextResponse.json({ status: 200, card });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
}

 