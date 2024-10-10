import multer from "multer";
import { JobItemTemplateActivate } from "@/lib/models/AE/JobItemTemplateActivate";
import { Job } from "@/lib/models/Job";
import { JobItem } from "@/lib/models/JobItem";
import { Status } from "@/lib/models/Status";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { getRevisionNo } from "@/lib/utils/utils";
import { User } from "@/lib/models/User";

// กำหนดที่เก็บไฟล์ที่อัปโหลด
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // เส้นทางที่เก็บไฟล์
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // ชื่อไฟล์ที่อัปโหลด
  },
});

const upload = multer({ storage: storage });

export const PUT = async (req) => {
  await connectToDb();

  return new Promise((resolve, reject) => {
    // ใช้ upload.single() เพื่อจัดการการอัปโหลดไฟล์เดียว
    upload.single("image")(req, {}, async (err) => {
      if (err) {
        console.error("Upload error:", err);
        return resolve(
          NextResponse.json({
            status: 500,
            message: "Error uploading file.",
          })
        );
      }

      try {
        const body = await req.json();
        console.log("Received body:", body); // ตรวจสอบข้อมูลที่ได้รับ
        const { jobData, jobItemsData } = body;

        // ตรวจสอบข้อมูลที่ได้รับ
        if (!jobData || !jobItemsData) {
          return resolve(
            NextResponse.json({
              status: 400,
              message: "Invalid data.",
            })
          );
        }

        const job = await Job.findOne({ _id: jobData.JobID });
        if (!job) {
          return resolve(
            NextResponse.json({
              status: 404,
              message: "Job not found.",
            })
          );
        }

        const submitteduser = await User.findById(jobData.submittedBy);
        const latestDocNo = await getRevisionNo(job.DOC_NUMBER);

        if (latestDocNo.message) {
          return resolve(
            NextResponse.json({ status: 455, message: latestDocNo.message })
          );
        } else if (job.CHECKLIST_VERSION !== latestDocNo) {
          return resolve(
            NextResponse.json({
              status: 455,
              message: "This Checklist does not have the latest revision",
            })
          );
        }

        // สร้างตัวแปรเพื่อเก็บข้อมูล
        const tmp_job = {
          jobtitle: job.JOB_NAME,
          lineName: job.LINE_NAME,
          docNumber: job.DOC_NUMBER,
          wd_tag: jobData.wd_tag,
          submitteduser_en: submitteduser?.EMP_NUMBER,
          submitteduser_name: submitteduser?.EMP_NAME,
          datetime: new Date(),
          jobItem: [],
        };

        // อัปเดต jobItems
        await Promise.all(
          jobItemsData.map(async (jobItemData) => {
            const jobItem = await JobItem.findOne({
              _id: jobItemData.jobItemID,
            });
            if (jobItem) {
              jobItem.ACTUAL_VALUE = jobItemData.value || jobItem.ACTUAL_VALUE;
              jobItem.COMMENT = jobItemData.Comment || jobItem.COMMENT;
              jobItem.BEFORE_VALUE =
                jobItem.BEFORE_VALUE || jobItemData.BeforeValue;
              await jobItem.save();
            }
          })
        );

        // อัปเดตข้อมูลที่เกี่ยวข้องกับ jobItems
        await Promise.all(
          jobItemsData.map(async (jobItemData) => {
            const jobItemTemplateActivate =
              await JobItemTemplateActivate.findOne({
                JOB_ITEM_ID: jobItemData.jobItemID,
              });

            if (jobItemTemplateActivate) {
              const job_item_buffer = await JobItem.findOne({
                _id: jobItemTemplateActivate.JOB_ITEM_ID,
              });
              if (job_item_buffer) {
                tmp_job.jobItem.push({
                  jobItemID: job_item_buffer._id,
                  value: job_item_buffer.ACTUAL_VALUE,
                  comment: job_item_buffer.COMMENT,
                  jobItemTitle: job_item_buffer.JOB_ITEM_TITLE,
                  datetime: new Date(),
                });

                const jobItemTemplateId =
                  jobItemTemplateActivate.JOB_ITEM_TEMPLATE_ID;
                const jobItemTemplatesAcivate =
                  await JobItemTemplateActivate.find({
                    JOB_ITEM_TEMPLATE_ID: jobItemTemplateId,
                  });
                const jobItemTemplatesAcivateFiltered =
                  jobItemTemplatesAcivate.filter(
                    (item) => !item.JOB_ITEM_ID.equals(jobItemData.jobItemID)
                  );

                for (const item of jobItemTemplatesAcivateFiltered) {
                  const jobItemUpdate = await JobItem.findOne({
                    _id: item.JOB_ITEM_ID,
                  });
                  if (jobItemUpdate) {
                    if (
                      !jobItemUpdate.ACTUAL_VALUE &&
                      !jobItemUpdate.BEFORE_VALUE
                    ) {
                      jobItemUpdate.BEFORE_VALUE = jobItemData.value;
                    }

                    if (
                      jobItemUpdate.BEFORE_VALUE &&
                      jobItemUpdate.BEFORE_VALUE !== jobItemData.value &&
                      !jobItemUpdate.ACTUAL_VALUE
                    ) {
                      jobItemUpdate.BEFORE_VALUE = jobItemData.value;
                    }
                    await jobItemUpdate.save();
                  }
                }
              }
            }
          })
        );

        // อัปเดตข้อมูลใน job
        job.WD_TAG = jobData.wd_tag;
        const waiting_status = await Status.findOne({
          status_name: "waiting for approval",
        });
        job.JOB_STATUS_ID = waiting_status
          ? waiting_status._id
          : job.JOB_STATUS_ID; // ป้องกันการตั้งค่าถ้าสถานะไม่พบ
        job.SUBMITTED_BY = submitteduser;
        job.SUBMITTED_DATE = new Date();

        // บันทึกชื่อไฟล์ที่อัปโหลดถ้ามี
        if (req.file) {
          job.IMAGE_FILENAME = req.file.filename; // บันทึกชื่อไฟล์
        }

        await job.save();

        return resolve(NextResponse.json({ status: 200 }));
      } catch (err) {
        console.error("Error occurred:", err); // Log the error
        return resolve(
          NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
          })
        );
      }
    });
  });
};
