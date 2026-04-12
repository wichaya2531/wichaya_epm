import { NextResponse } from "next/server.js";
import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { broadcast } from "@/lib/server/sseHub";

function isWeekend(today) {
  const day = today.getDay();
  return day === 0 || day === 6;
}

function formatDateToString(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "Invalid Date";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const POST = async (req) => {
  await connectToDb();
  const body = await req.json();

  const {
    activationDate,
    activationTime,
    recurrence,
    jobTemplateID,
    jobTemplateCreateID,
    LINE_ITEMS,
    endDate,
    startDate,
    shift_date,
    weekend_skip,
  } = body;

  //console.log("📦 BODY:", JSON.stringify(body, null, 2));

  try {
    const jobTemplate = await JobTemplate.findOne({ _id: jobTemplateID });

    if (!jobTemplate) {
      return NextResponse.json({
        status: 404,
        error: "Job template not found",
      });
    }

    // -------------------------------
    // Normalize LINE_ITEMS
    // -------------------------------
    const normalizedLineItems = Array.isArray(LINE_ITEMS)
      ? LINE_ITEMS.map((item) => ({
          name: item?.name || "",
          mc_tag:
            item?.mc_tag && typeof item.mc_tag === "object"
              ? {
                  WD_TAG: item.mc_tag.WD_TAG || "",
                  MACHINE_NAME: item.mc_tag.MACHINE_NAME || "",
                }
              : {
                  WD_TAG: "",
                  MACHINE_NAME: item?.mc_tag || "",
                },
        }))
      : [];

    //console.log("✅ normalizedLineItems:", normalizedLineItems);

    // -------------------------------
    // Prepare date
    // -------------------------------
    console.log("activationDate Date",activationDate);
    console.log("startDate ",startDate);
    //let pre_startDate = activationDate || startDate;
    let pre_startDate = startDate;
    console.log("วันที่ร้องขอในการเปิด Job" , pre_startDate);     


    if (!pre_startDate) {
      pre_startDate = new Date();
    }

    if (typeof pre_startDate === "string" && pre_startDate.includes("T")) {
      pre_startDate = pre_startDate.split("T")[0];
    } else {
      pre_startDate = formatDateToString(new Date(pre_startDate));
    }

    let startDateActive = new Date(`${pre_startDate}T${activationTime}`);
    startDateActive.setHours(
      startDateActive.getHours() +
        parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
    );

    let endDateActive = new Date(
      formatDateToString(new Date(endDate)) + "T23:59:00"
    );

    endDateActive.setHours(
      endDateActive.getHours() +
        parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
    );

    let rolling_Datetime = new Date(startDateActive);

     console.log("วันที่สร้าง Plan",rolling_Datetime);

    // -------------------------------
    // LOOP CREATE SCHEDULE
    // -------------------------------
    let counter = 0;

    while (rolling_Datetime < endDateActive) {
      counter++;
      if (counter > 512) break;

      const AdvanceActivationDate = new Date(rolling_Datetime);
      AdvanceActivationDate.setHours(
        AdvanceActivationDate.getHours() -
          parseInt(process.env.NEXT_PUBLIC_TIMEZONE_OFFSET, 10)
      );

      const schedulePromises = normalizedLineItems.map(async (item, index) => {
        //console.log("🟢 SAVE:", item);

        const schedule1 = new Schedule({
          JOB_TEMPLATE_ID: jobTemplate._id,
          JOB_TEMPLATE_CREATE_ID: jobTemplateCreateID,
          JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
          ACTIVATE_DATE: AdvanceActivationDate,
          LINE_NAME: item.name,

          // 🔥 ตรงนี้คือจุดสำคัญ
          MC_TAG: {
            WD_TAG: item.mc_tag.WD_TAG,
            MACHINE_NAME: item.mc_tag.MACHINE_NAME,
          },

          DOC_NUMBER: jobTemplate.DOC_NUMBER,
          WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
          PLAN_TYPE: recurrence,
          PROFILE_GROUP: jobTemplate.PROFILE_GROUP || "Unknown",
        });

        if (!(weekend_skip && isWeekend(AdvanceActivationDate))) {
          await schedule1.save();
        }

        // shift
        if (shift_date === true) {
          const schedule2 = new Schedule({
            ...schedule1.toObject(),
            _id: undefined,
            ACTIVATE_DATE: new Date(
              AdvanceActivationDate.getTime() + 12 * 60 * 60 * 1000
            ),
          });

          if (!(weekend_skip && isWeekend(AdvanceActivationDate))) {
            await schedule2.save();
          }
        }
      });

      await Promise.all(schedulePromises);

      // recurrence
      if (recurrence === "daily") {
        rolling_Datetime.setDate(rolling_Datetime.getDate() + 1);
      } else if (recurrence === "weekly") {
        rolling_Datetime.setDate(rolling_Datetime.getDate() + 7);
      } else if (recurrence === "monthly") {
        rolling_Datetime.setMonth(rolling_Datetime.getMonth() + 1);
      } else if (recurrence === "2monthly") {
        rolling_Datetime.setMonth(rolling_Datetime.getMonth() + 2);
      } else if (recurrence === "3monthly") {
        rolling_Datetime.setMonth(rolling_Datetime.getMonth() + 3);
      } else if (recurrence === "6monthly") {
        rolling_Datetime.setMonth(rolling_Datetime.getMonth() + 6);
      } else if (recurrence === "yearly") {
        rolling_Datetime.setFullYear(rolling_Datetime.getFullYear() + 1);
      } else {
        break;
      }
    }

    // -------------------------------
    // SSE Refresh
    // -------------------------------
    try {
      let workgroup_id = jobTemplate.WORKGROUP_ID?.toString();
      broadcast(workgroup_id, "refresh");
    } catch (err) {
      console.log("SSE error", err);
    }

    return NextResponse.json({
      status: 200,
      message: "Jobs activated successfully",
    });
  } catch (err) {
    console.log("❌ ERROR:", err);

    return NextResponse.json({
      status: 500,
      error: err.message,
    });
  }
};