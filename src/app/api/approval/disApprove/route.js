export const POST = async (req, res) => {
  await connectToDb();
  const body = await req.json();
  const { job_id, user_id, isApproved, comment } = body;

  try {
    // ค้นหาสถานะ renew และ complete
    const renew = await Status.findOne({ status_name: "renew" });

    // ค้นหา Job ตาม job_id
    const job = await Job.findOne({ _id: job_id });

    // ตรวจสอบสถานะการอนุมัติ
    if (!isApproved) {
      job.JOB_STATUS_ID = renew._id; // เปลี่ยนสถานะเป็น renew หากไม่อนุมัติ
    } else {
      job.JOB_STATUS_ID = renew._id; // เปลี่ยนสถานะเป็น renew แม้จะอนุมัติ
    }
    await job.save(); // บันทึกการเปลี่ยนแปลง

    // บันทึกข้อมูลการอนุมัติ/ปฏิเสธ
    const jobApprove = new JobApproves({
      JOB: job,
      USER_ID: user_id,
      IS_APPROVE: isApproved,
      COMMENT: comment,
    });

    await jobApprove.save(); // บันทึกลงฐานข้อมูล

    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({
      status: 200,
      message: isApproved
        ? "Job has been approved and status set to renew"
        : "Job has been rejected",
    });
  } catch (err) {
    // จัดการข้อผิดพลาด
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
