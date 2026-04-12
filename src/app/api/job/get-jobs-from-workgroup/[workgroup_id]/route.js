import { Job } from "@/lib/models/Job";
import { NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { ProfileGroup } from "@/lib/models/ProfileGroup";
import { Machine } from "@/lib/models/Machine";

export const dynamic = "force-dynamic";

export const GET = async (req, { params }) => {
  try {
    await connectToDb();

    const rawStartTime = req.nextUrl.searchParams.get("starttime");
    const rawEndTime = req.nextUrl.searchParams.get("endtime");
    const profile = req.nextUrl.searchParams.get("profile");
    const user_id = req.nextUrl.searchParams.get("user_id");
    const status = req.nextUrl.searchParams.get("status");



    const { workgroup_id } = params;

    if (!workgroup_id || workgroup_id === "undefined") {
      return NextResponse.json(
        {
          status: 400,
          error: "Workgroup ID is required",
        },
        { status: 400 }
      );
    }

    const startTime = rawStartTime
      ? new Date(`${rawStartTime}T00:00:00`)
      : null;

    const endTime = rawEndTime
      ? new Date(`${rawEndTime}T23:59:59.999`)
      : null;




   // console.log("startTime",startTime);   
   // console.log("endTime",endTime);   
   // console.log("status",status);  


    // โหลด Profile Group ทั้งหมดไว้ map ครั้งเดียว
    const profileGroupsArr = await ProfileGroup.find().lean();
    const profileGroups = profileGroupsArr.reduce((acc, group) => {
      acc[String(group._id)] = group.PROFILE_NAME;
      return acc;
    }, {});

    // โหลด Machine ทั้งหมดไว้ map ครั้งเดียว
    const machines = await Machine.find().lean();
    const machineMap = machines.reduce((acc, machine) => {
      acc[machine.WD_TAG] = machine.MACHINE_NAME;
      return acc;
    }, {});

    // ----------------------------
    // สร้าง filter สำหรับ jobs
    // ----------------------------
    const jobFilter = {
      WORKGROUP_ID: workgroup_id,
    };

    if (startTime || endTime) {
      jobFilter.createdAt = {};
      if (startTime) jobFilter.createdAt.$gte = startTime;
      if (endTime) jobFilter.createdAt.$lte = endTime;
    }

    if (profile && profile !== "null") {
      jobFilter.PROFILE_GROUP = profile;
    }

    // ----------------------------
    // สร้าง filter สำหรับ schedules
    // ----------------------------
    const scheduleFilter = {
      WORKGROUP_ID: workgroup_id,
    };

    if (startTime || endTime) {
      scheduleFilter.ACTIVATE_DATE = {};
      if (startTime) scheduleFilter.ACTIVATE_DATE.$gte = startTime;
      if (endTime) scheduleFilter.ACTIVATE_DATE.$lte = endTime;
    }

    if (profile && profile !== "null") {
      scheduleFilter.PROFILE_GROUP = profile;
    }

    const [jobs, schedules] = await Promise.all([
      Job.find(jobFilter).sort({ createdAt: -1 }).lean(),
      Schedule.find(scheduleFilter).sort({ createdAt: -1 }).lean(),
    ]);

    // โหลด user/status ล่วงหน้าเพื่อลด query ซ้ำ
    const activateUserIds = [
      ...new Set(
        jobs
          .map((job) => job.ACTIVATE_USER)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    const jobStatusIds = [
      ...new Set(
        jobs
          .map((job) => job.JOB_STATUS_ID)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    const scheduleStatusNames = [
      ...new Set(schedules.map((s) => s.STATUS).filter(Boolean)),
    ];

    const [users, jobStatuses, scheduleStatuses] = await Promise.all([
      activateUserIds.length
        ? User.find({ _id: { $in: activateUserIds } }).lean()
        : [],
      jobStatusIds.length
        ? Status.find({ _id: { $in: jobStatusIds } }).lean()
        : [],
      scheduleStatusNames.length
        ? Status.find({ status_name: { $in: scheduleStatusNames } }).lean()
        : [],
    ]);

    const userMap = users.reduce((acc, user) => {
      acc[String(user._id)] = user;
      return acc;
    }, {});

    const statusByIdMap = jobStatuses.reduce((acc, item) => {
      acc[String(item._id)] = item;
      return acc;
    }, {});

    const statusByNameMap = scheduleStatuses.reduce((acc, item) => {
      acc[item.status_name] = item;
      return acc;
    }, {});

    const mappedJobs = jobs.map((job) => {
      const user = job.ACTIVATE_USER
        ? userMap[String(job.ACTIVATE_USER)]
        : null;

      const statusObj = job.JOB_STATUS_ID
        ? statusByIdMap[String(job.JOB_STATUS_ID)]
        : null;

      const statusName = statusObj?.status_name || "Unknown";
      const statusColor = statusObj?.color || "Unknown";
      const approvers = Array.isArray(job.JOB_APPROVERS) ? job.JOB_APPROVERS : [];

      const submit_name = {
        EMP_NAME: job.SUBMITTED_BY_NAME ?? job.SUBMITTED_BY?.EMP_NAME ?? "-",
        EMP_NUMBER: job.SUBMITTED_BY?.EMP_NUMBER ?? "-",
      };

      return {
        _id: job._id,
        SUBMITTED_BY: submit_name,
        LINE_NAME: job.LINE_NAME,
        JOB_NAME: job.JOB_NAME,
        JOB_APPROVERS: approvers,
        APPROVE_ALLOW:
          !!user_id &&
          approvers.includes(user_id) &&
          statusName === "waiting for approval",
        ACTIVATE_USER: job.ACTIVATE_USER,
        createdAt: job.createdAt,
        ACTIVATER_NAME: user?.EMP_NAME || "Unknown",
        STATUS_NAME: statusName,
        STATUS_COLOR: statusColor,
        ITEM_ABNORMAL: job.VALUE_ITEM_ABNORMAL || false,
        VALUE_ITEM_ABNORMAL: job.VALUE_ITEM_ABNORMAL,
        updatedAt: job.updatedAt,
        SUBMITTED_DATE: job.SUBMITTED_DATE,
        JOB_VERIFY: !!(job.IMAGE_FILENAME || job.IMAGE_FILENAME_2),
        LAST_GET_BY: job.LAST_GET_BY || "Unknown",
        LAST_GET_TIME: job.LAST_GET_TIME || "Unknown",
        TYPE: job.TYPE || "Unknown",
        PROFILE_GROUP: profileGroups[String(job.PROFILE_GROUP)] || "Unknown",
        PUBLIC_EDIT_IN_WORKGROUP: job.PUBLIC_EDIT_IN_WORKGROUP || false,
        MC_TAG: {
          MACHINE_NAME: machineMap[job.WD_TAG] ?? "",
          WD_TAG: job.WD_TAG ?? "",
        },
      };
    });

    const mappedSchedules = schedules.map((schedule) => {
      const statusObj = statusByNameMap[schedule.STATUS];
      const statusColor = statusObj?.color || "Unknown";

      return {
        _id: schedule._id,
        LINE_NAME: schedule.LINE_NAME,
        JOB_APPROVERS: [],
        JOB_NAME: schedule.JOB_TEMPLATE_NAME,
        DOC_NUMBER: schedule.DOC_NUMBER,
        ACTIVATE_USER: "Scheduler",
        createdAt: schedule.ACTIVATE_DATE
          ? new Date(schedule.ACTIVATE_DATE).toISOString()
          : null,
        updatedAt: schedule.updatedAt,
        ACTIVATER_NAME: "Scheduler",
        STATUS_NAME: schedule.STATUS,
        STATUS_COLOR: statusColor,
        JOB_TEMPLATE_CREATE_ID: schedule.JOB_TEMPLATE_CREATE_ID,
        JOB_TEMPLATE_NAME: schedule.JOB_TEMPLATE_NAME,
        ACTIVATE_DATE: schedule.ACTIVATE_DATE,
        SCHEDULE_STATUS: schedule.STATUS,
        PROFILE_GROUP:
          profileGroups[String(schedule.PROFILE_GROUP)] || "Unknown",
        MC_TAG: schedule.MC_TAG || "",
      };
    });

    let jobsWithActivater = [...mappedJobs, ...mappedSchedules];

    // filter status ฝั่งรวม ถ้ามีส่งมา
    if (status && status !== "All") {
      jobsWithActivater = jobsWithActivater.filter(
        (item) => item.STATUS_NAME === status.toLowerCase()
      );
    }

    jobsWithActivater.sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    console.log("jobsWithActivater total =", jobsWithActivater.length);

    return NextResponse.json({
      status: 200,
      jobs: jobsWithActivater,
    });
  } catch (err) {
    if (process.env.NEXT_PUBLIC_DEBUG == "true") {
      console.log("Error", err);
      console.log("Error Code : 030");
    }

    return NextResponse.json(
      {
        status: 500,
        error: err.message,
      },
      { status: 500 }
    );
  }
};