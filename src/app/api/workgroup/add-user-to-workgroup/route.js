
import { User } from "@/lib/models/User.js";
import { Workgroup } from "@/lib/models/Workgroup.js";
import { NextResponse } from 'next/server';
import { connectToDb } from "@/app/api/mongo/index.js";

/**
 * @swagger
 * /api/user/add-user-to-workgroup:
 *   post:
 *     summary: Add user to workgroup
 *     description: Add a user to a workgroup by their IDs
 *     tags:
 *       - workgroup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workgroup_id:
 *                 type: string
 *                 description: The ID of the workgroup
 *               user_id:
 *                 type: string
 *                 description: The ID of the user to be added to the workgroup
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the updated workgroup.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: HTTP status code
 *                   example: 200
 *                 workgroup:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the workgroup
 *                       example: "6632e932eccb576a719dfa75"
 *                     name:
 *                       type: string
 *                       description: The name of the workgroup
 *                       example: "Marketing"
 *                     description:
 *                       type: string
 *                       description: The description of the workgroup
 *                       example: "Marketing team for product promotion"
 *       '400':
 *         description: Bad request. The provided workgroup or user ID is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Workgroup not found
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
    await connectToDb();
    const { workgroup_id, user_id } = await req.json();
    try {
        const workgroup = await Workgroup.findById(workgroup_id);
        if (!workgroup) {
            return NextResponse.json({ message: "Workgroup not found" });
        }
        const user = await User.findById(user_id);
        if (!user) {
            return NextResponse.json({ message: "User not found" });
        }
        workgroup.USER_LIST.push(user_id);
        //change user role to admin group 662884f794ded7042143d843
        user.ROLE = "662884f794ded7042143d843";
        await user.save();
        await workgroup.save();
        return NextResponse.json({ status:200, workgroup });
    } catch (err) {
        return NextResponse.json({status: 500, file: __filename, error: err.message});
    }
};
