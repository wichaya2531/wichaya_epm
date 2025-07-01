import { Machine } from "../../../../lib/models/Machine.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { ObjectId } from "bson";
import { Job } from "@/lib/models/Job.js";
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
  const job_id_filter=searchParams.get("filter");
  //console.log('filter',filter);
  let key_filter='';
  if(job_id_filter){
        const job=await Job.findById(job_id_filter);
        if (typeof job.JOB_NAME === 'string' && job.JOB_NAME.includes('[') && job.JOB_NAME.includes(']')) {
          const match = job.JOB_NAME.match(/\[(.*?)\]/);
          const result = match ? match[1] : null;
         // console.log('ค่าภายใน bracket:', result);
          key_filter=result;
        } else {
         // console.log('jobName ไม่ใช่ string หรือไม่มี bracket', job.JOB_NAME);
        }
  }
  //key_filter='1234';

  await connectToDb();
  try {
    let machines;
    const query = {};

    if (workgroup_id != 0) {
      query.workgroup_id = workgroup_id;
    }

    if (key_filter !== '') {
        query.WD_TAG = new RegExp(key_filter, "i"); // หรือใช้ $regex ก็ได้
    }

    machines = await Machine.find(query).sort({ createdAt: -1 });

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
   // console.log('data',data.length);  
    return NextResponse.json({ status: 200, machines: data });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
