import { Machine } from "../../../../lib/models/Machine.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "bson";
/**
 * @swagger
 * /api/machine/get-machines:
 *   get:
 *     summary: Get all machines
 *     tags:
 *       - Machine
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 machines:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Machine'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 file:
 *                   type: string
 *                   example: "/path/to/file.js"
 *                 error:
 *                   type: string
 */
export const dynamic = "force-dynamic";
export const GET = async (req, res) => {
  //console.log('get machinezzzz');
  const searchParams = req.nextUrl.searchParams;
  //console.log('searchParams',searchParams);
  const workgroup_id = searchParams.get("workgroup_id");

  //console.log('workgroup_id',workgroup_id);
  await connectToDb();
  try {
    let machines;
    if (workgroup_id==0) {    
      machines= await Machine.find().sort({ createdAt: -1 });;
    }else{    
      machines= await Machine.find({workgroup_id:workgroup_id}).sort({ createdAt: -1 });;
    }
    const data = machines.map((machine) => {
      return {
        _id: machine._id,
        wd_tag: machine.WD_TAG,
        name: machine.MACHINE_NAME,
        createdAt: machine.createdAt,
        createdBy: machine.created_by,
        workgroup: machine.workgroup,
      };
    });
    return NextResponse.json({ status: 200, machines: data });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
