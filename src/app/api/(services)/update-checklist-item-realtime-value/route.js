import { NextResponse } from 'next/server.js';
import { JobItem } from "@/lib/models/JobItem.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { config } from "@/config/config.js";

export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const JobItemID = searchParams.get("checklist_item_id")?.trim(); // Trim any whitespace
    const value = searchParams.get("value");

    try {
        const jobItem = await JobItem.findOne({ _id: JobItemID });
        if (!jobItem) {
            return NextResponse.json({ status: 404, message: "Job Item not found" });
        }

        jobItem.REAL_TIME_VALUE = value;
        await jobItem.save();
        const job_id = jobItem.JOB_ID;

        const link = `api/job/get-job-value?job_id=${job_id}`;

        return NextResponse.json(
            {
                message: "Checklist Item updated successfully",
                toSeeChecklistDetail: link
            }
        );
    } catch (error) {
        return NextResponse.json({ status: 500, file: __filename, error: error.message });
    }
};
