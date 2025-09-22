import { generateUniqueKey } from "@/lib/utils/utils";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { JobTemplateEdit } from "@/lib/models/AE/JobTemplateEdit";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate";
import { Approves } from "@/lib/models/Approves";
import { Notifies } from "@/lib/models/Notifies";
import { NotifiesOverdue } from "@/lib/models/NotifiesOverdue";
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";



export const PUT = async (req, res) => {
  //console.log("****call edit job template***");
  await connectToDb();

  //console.log("<= use edit job template => ");

  const body = await req.json();

  //console.log('body',body);
  
 const {
    jobTemplateID,
    author,
    workgroup,
    due_date,
    line_name,
    job_template_name,
    doc_num,
    checklist_ver,
    timeout,
    approvers_id,
    notifies_id,
    notifiesOverdue_id,
    PICTURE_EVEDENT_REQUIRE,
    AGILE_SKIP_CHECK,
    SORT_ITEM_BY_POSITION,
    PUBLIC_EDIT_IN_WORKGROUP,
    checklist_type,
  } = body;

   //console.log("timeout:", timeout);

  try {
    const JobTemplateCreateID = await generateUniqueKey();
    const jobTemplate = await JobTemplate.findById(jobTemplateID);

    console.log("jobTemplate found:", jobTemplate);

    const jobTemplateEdit = new JobTemplateEdit({
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
      JOB_TEMPLATE_ID: jobTemplate._id,
      JOB_TEMPLATE_NAME: jobTemplate.JOB_TEMPLATE_NAME,
      AUTHOR_ID: jobTemplate.AUTHOR_ID,
      DOC_NUMBER: jobTemplate.DOC_NUMBER,
      LINE_NAME: jobTemplate.LINE_NAME,
      DUE_DATE: jobTemplate.DUE_DATE,
      CHECKLIST_VERSION: jobTemplate.CHECKLIST_VERSION,
      WORKGROUP_ID: jobTemplate.WORKGROUP_ID,
      TIMEOUT: jobTemplate.TIMEOUT,
      TYPE: jobTemplate.TYPE || "Null",
      PICTURE_EVEDENT_REQUIRE:jobTemplate.PICTURE_EVEDENT_REQUIRE || false,
      AGILE_SKIP_CHECK:jobTemplate.AGILE_SKIP_CHECK || false,
      SORT_ITEM_BY_POSITION:jobTemplate.SORT_ITEM_BY_POSITION|| false,
      PUBLIC_EDIT_IN_WORKGROUP:jobTemplate.PUBLIC_EDIT_IN_WORKGROUP||false
    });
    console.log("jobTemplateEdit", jobTemplateEdit)
    await jobTemplateEdit.save();


    //console.log('jobTemplate before',jobTemplate);


    //update job template
    jobTemplate.JOB_TEMPLATE_NAME = job_template_name;
    jobTemplate.AUTHOR_ID = author;
    jobTemplate.DOC_NUMBER = doc_num;
    jobTemplate.DUE_DATE = due_date;
    jobTemplate.LINE_NAME = line_name;
    jobTemplate.CHECKLIST_VERSION = checklist_ver;
    jobTemplate.WORKGROUP_ID = workgroup;
    jobTemplate.TIMEOUT = timeout;
    jobTemplate.TYPE = checklist_type || "Null";
    jobTemplate.JobTemplateCreateID = JobTemplateCreateID;
    jobTemplate.PICTURE_EVEDENT_REQUIRE=PICTURE_EVEDENT_REQUIRE;
    jobTemplate.AGILE_SKIP_CHECK=AGILE_SKIP_CHECK;
    jobTemplate.SORT_ITEM_BY_POSITION=SORT_ITEM_BY_POSITION;
    jobTemplate.PUBLIC_EDIT_IN_WORKGROUP=PUBLIC_EDIT_IN_WORKGROUP;

    //console.log('jobTemplate after',jobTemplate);

    await jobTemplate.save();


    const newApprovers = approvers_id.map((approver_id) => {
      return new Approves({
        JOB_TEMPLATE_ID: jobTemplate._id,
        JobTemplateCreateID: JobTemplateCreateID,
        USER_ID: approver_id,
      });
    });

    await Approves.insertMany(newApprovers);

    const newNotifies = await Promise.all(
      notifies_id.map(async (notify_id) => {
        // ตรวจสอบว่ามี USER_ID ซ้ำในฐานข้อมูลหรือไม่
        const exists = await Notifies.findOne({ USER_ID: notify_id,JOB_TEMPLATE_ID:jobTemplate._id });
        if (!exists) {
          return {
            JOB_TEMPLATE_ID: jobTemplate._id,
            JobTemplateCreateID: JobTemplateCreateID,
            USER_ID: notify_id,
          };
        }
        return null; // คืนค่า null หากมีอยู่แล้ว
      })
    );
    
    // กรอง null ออกจากผลลัพธ์
    const filteredNotifies = newNotifies.filter((item) => item !== null);

    //console.log("filteredNotifies",filteredNotifies);

    await Notifies.insertMany(filteredNotifies);

    //return NextResponse.json({ status: 200});

    var newNotifiesOverdue = (
      await Promise.all(
        notifiesOverdue_id.map(async (notifyOverdue_id) => {
          // เช็คข้อมูล
          var c = await NotifiesOverdue.findOne({ USER_ID: notifyOverdue_id, JOB_TEMPLATE_ID: jobTemplate._id });
          
          // ถ้า c เป็น null สร้าง object, ถ้าไม่ใช่ return null
          if (c === null) {
            return {
              JOB_TEMPLATE_ID: jobTemplate._id,
              JobTemplateCreateID: JobTemplateCreateID,
              USER_ID: notifyOverdue_id,
            };
          } else {
            return null;
          }
        })
      )
    ).filter((item) => item !== null); // กรอง null ออก
    //console.log("***newNotifiesOverdue***",newNotifiesOverdue);    
    //addNotifiesOverdue(newNotifiesOverdue,JOB_TEMPLATE_ID);
    // return NextResponse.json({ status: 200 }); 
    await NotifiesOverdue.insertMany(newNotifiesOverdue);
    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: jobTemplateID,
    });

    
    //console.log("NotifiesOverdue",NotifiesOverdue);  
    

    if (jobItemTemplates.length > 0) {
              const updatePromises = jobItemTemplates.map(async (template) => {
              template.JobTemplateCreateID = jobTemplate.JobTemplateCreateID;
          return template.save();
      });

      await Promise.all(updatePromises);
      //console.log("JobItemTemplates updated successfully.");
    } else {
      console.log(
        "No JobItemTemplates found with the specified JOB_TEMPLATE_ID."
      );
    }

    return NextResponse.json({ status: 200, jobTemplateEdit });
  } catch (err) {
    console.log("Edit Error=>", err);
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
