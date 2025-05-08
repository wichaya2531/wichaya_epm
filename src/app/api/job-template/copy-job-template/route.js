import { JobTemplate } from "@/lib/models/JobTemplate.js";
import { JobItemTemplate } from "@/lib/models/JobItemTemplate.js";
import { NextResponse } from "next/server.js";
import { Approves } from "@/lib/models/Approves.js";
import { generateUniqueKey } from "@/lib/utils/utils.js";
import { connectToDb } from "@/app/api/mongo/index.js";

export const GET = async (req) => {
  await connectToDb();

  //const { job_template_id } = params;
  const searchParams = new URL(req.url).searchParams;
  const workgroup_id = searchParams.get('workgroup_id');
  const job_template_id = searchParams.get('job_template_id');
  //console.log('Job Template ID:', job_template_id);
  //console.log('Workgroup ID:', workgroup_id);

  // if (workgroup_id===null) {
  //         console.log("copy ภายใน workgroup ");
  // }else{
  //   console.log("copy ส่งออกไปนอก workgroup ");
  // }


  //return NextResponse.json({ status: 200, message: "Copy Job Template" });
  //console.log("jobTemplate_id",jobTemplate_id);
  const jobTemplates = await JobTemplate.findOne({ _id: job_template_id });
  //console.log("Data jobTemplates",jobTemplates);

  try {
    const JobTemplateCreateID_buffer = await generateUniqueKey();
    let jobTemplate;  
    if (workgroup_id===null) {
          jobTemplate = new JobTemplate({
            AUTHOR_ID: jobTemplates.AUTHOR_ID,
            JOB_TEMPLATE_NAME: jobTemplates.JOB_TEMPLATE_NAME + " Copy",
            DOC_NUMBER: jobTemplates.DOC_NUMBER,
            LINE_NAME: jobTemplates.LINE_NAME,
            DUE_DATE: jobTemplates.DUE_DATE,
            CHECKLIST_VERSION: jobTemplates.CHECKLIST_VERSION,
            TIMEOUT: jobTemplates.TIMEOUT,
            WORKGROUP_ID: jobTemplates.WORKGROUP_ID,
            JobTemplateCreateID: JobTemplateCreateID_buffer,

            PICTURE_EVEDENT_REQUIRE: jobTemplates.PICTURE_EVEDENT_REQUIRE||false,// { type: Boolean, required: false },    
            AGILE_SKIP_CHECK:jobTemplates.AGILE_SKIP_CHECK||false,// { type: Boolean, required: false },    
            SORT_ITEM_BY_POSITION: jobTemplates.SORT_ITEM_BY_POSITION ||false,//{ type: Boolean, default: false },            
          });
          await jobTemplate.save();
    }else{
          jobTemplate = new JobTemplate({
          AUTHOR_ID: jobTemplates.AUTHOR_ID,
          JOB_TEMPLATE_NAME: jobTemplates.JOB_TEMPLATE_NAME,
          DOC_NUMBER: jobTemplates.DOC_NUMBER,
          LINE_NAME: jobTemplates.LINE_NAME,
          DUE_DATE: jobTemplates.DUE_DATE,
          CHECKLIST_VERSION: jobTemplates.CHECKLIST_VERSION,
          TIMEOUT: jobTemplates.TIMEOUT,
          WORKGROUP_ID: workgroup_id,   // กรณีที่มีการ copy เพื่อส่งออกไปข้างนอก
          JobTemplateCreateID: JobTemplateCreateID_buffer,
          
          PICTURE_EVEDENT_REQUIRE: jobTemplates.PICTURE_EVEDENT_REQUIRE||false,// { type: Boolean, required: false },    
          AGILE_SKIP_CHECK:jobTemplates.AGILE_SKIP_CHECK||false,// { type: Boolean, required: false },    
          SORT_ITEM_BY_POSITION: jobTemplates.SORT_ITEM_BY_POSITION ||false,//{ type: Boolean, default: false },


        });
        await jobTemplate.save();
    }
       



    const jobItemTemplates = await JobItemTemplate.find({
      JOB_TEMPLATE_ID: jobTemplates._id,
    });
    for (const item of jobItemTemplates) {
      const jobItemTemplate = new JobItemTemplate({
        AUTHOR_ID: item.AUTHOR_ID,
        JOB_ITEM_TEMPLATE_TITLE: item.JOB_ITEM_TEMPLATE_TITLE,
        JOB_ITEM_TEMPLATE_NAME: item.JOB_ITEM_TEMPLATE_NAME,
        UPPER_SPEC: item.UPPER_SPEC,
        LOWER_SPEC: item.LOWER_SPEC,
        TEST_METHOD: item.TEST_METHOD,
        JOB_TEMPLATE_ID: jobTemplate._id,
        TEST_LOCATION_ID: item.TEST_LOCATION_ID,
        JobTemplateCreateID: JobTemplateCreateID_buffer,
        JobItemTemplateCreateID: await generateUniqueKey(),        
        FILE: item.FILE,
        INPUT_TYPE: item.INPUT_TYPE,
        pos: item.pos||0,
      });
      //console.log('item',item);   
      await jobItemTemplate.save();
    }
    //console.log("Data jobItemTemplates",jobItemTemplates);
    return NextResponse.json({ status: 200, message: "Copy Job Template" });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: err.message,
    });
  }
};
