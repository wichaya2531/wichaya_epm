import { NextResponse } from 'next/server.js';
import { Card } from '../../../../lib/models/Card.js';
import { connectToDb } from "@/app/api/mongo/index.js";
/**
 * @swagger
 * /api/card/get-cards:
 *   get:
 *     summary: Get all cards
 *     description: Retrieve all cards from the database
 *     tags:
 *       - card
 *     responses:
 *       '200':
 *         description: Successful operation. Returns all cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: HTTP status code
 *                   example: 200
 *                 cards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the card
 *                       title:
 *                         type: string
 *                         description: The title of the card
 *                       detail:
 *                         type: string
 *                         description: Details of the card
 *                       link:
 *                         type: string
 *                         description: The link associated with the card
 *                       logo_path:
 *                         type: string
 *                         description: The path to the logo image
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

export const dynamic = 'force-dynamic';
export const GET = async (req, res) => {
   
    await connectToDb();
    try {
        const cards = await Card.find();
        return NextResponse.json({ status: 200, cards });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
}

 