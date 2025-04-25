import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library

export const dynamic = 'force-dynamic';



function getColorByStatusName(statusName, statusMap) {
    for (const key in statusMap) {
        if (statusMap[key].status_name === statusName) {
            return statusMap[key].color;
        }
    }
    return '#999999'; // สี default ถ้าไม่พบ
}

export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    const workgroup_id = searchParams.get("workgroup_id");
    console.log('workgroup_id',workgroup_id);
    
   // return NextResponse.json({ status: 200, events: "test" });


    try {
        let sw_type=true;
        if (sw_type) {
            
               
                    console.time("fetch-jobs");         
                    let arr_status=new Array();
                    const status=await Status.find();
                    status.forEach(element => {
                        arr_status[element._id]={
                            status_name:element.status_name,
                            color:element.color
                        }
                    });
                    //console.log('arr_status',arr_status);    


                    // Fetch job templates based on workgroup_id
                    const jobs=await Job.find();//.limit(1);
                // console.log('jobs',jobs);

                    const dataInJobs = await Promise.all(jobs.map(async (element) => {
                                    //console.log(element);
                                    return{
                                    // element  
                                    title:element.LINE_NAME+" : "+element.JOB_NAME,
                                    job_id:element._id,
                                    status_name:arr_status[element.JOB_STATUS_ID.toString()].status_name,
                                    start:element.SUBMITTED_BY.createdAt,
                                    end:element.SUBMITTED_BY.updatedAt,
                                    color:arr_status[element.JOB_STATUS_ID.toString()].color
                                    }
                    }));



                    const scheduals=await Schedule.find() ;//.limit(1);
                    const dataInScheduals = await Promise.all(scheduals.map(async (element) => {
                        //console.log(element);
                        const activateDate_s = new Date(element.ACTIVATE_DATE);
                        const hours = activateDate_s.getHours().toString().padStart(2, '0');  // แปลงให้เป็น 2 หลัก
                        const minutes = activateDate_s.getMinutes().toString().padStart(2, '0');
                        const activationTime = `${hours}:${minutes}`;
                        return{
                            title:element.LINE_NAME+" : "+element.JOB_TEMPLATE_NAME+" : "+activationTime,
                            job_id:element.JOB_TEMPLATE_ID,
                            status_name:element.STATUS,
                            start:element.ACTIVATE_DATE,
                            end:element.ACTIVATE_DATE,
                            color:getColorByStatusName(element.STATUS,arr_status)
                        }   

                    }));            

                //console.log('dataInJobs end proc',dataInJobs); 
                //console.log('dataInScheduals end proc',dataInScheduals); 
                const allData = [...dataInJobs, ...dataInScheduals];
                // allData.forEach(element => {
                //                 if( element.start>new Date('2025-04-25') /*element.status_name!='complete' && element.status_name != 'waiting for approval' */ ){
                //                             console.log(element);
                //                 }
                // });            
                // console.log('allData',allData);
                console.timeEnd("fetch-jobs");
            return NextResponse.json({ status: 200 ,events: allData}); 
        }else{
            console.time("fetch-jobs");
            let jobTemplates;
            if (workgroup_id === "all") {
                jobTemplates = await JobTemplate.find();
            } else {
                jobTemplates = await JobTemplate.find({ WORKGROUP_ID: workgroup_id });
            }

            // Check if there are no job templates
            if (jobTemplates.length === 0) {
                return NextResponse.json({ status: 200, events: [] });
            }
            // Fetch job template activations
            const jobTemplatesActivates = await Promise.all(jobTemplates.map(async (jobTemplate) => {
                return await JobTemplateActivate.find({ JobTemplateID: jobTemplate._id }).sort({ createdAt: -1 });
            }));

            // Flatten the activations array
            const flattenedActivates = jobTemplatesActivates.flat();

            //console.log('jobTemplates',jobTemplates);
            // Fetch schedules        
            const schedules = await Promise.all(jobTemplates.map(async (jobTemplate) => {
                // console.log('jobTemplate._id',jobTemplate._id);   
                //return await Schedule.find({ _id : jobTemplate._id}).sort({ createdAt: -1 });
                return await Schedule.find({ JOB_TEMPLATE_ID: jobTemplate._id}).sort({ createdAt: -1 });
            }));
            
            //console.log('schedules.',schedules);
            // Flatten the schedules array
            const flattenedSchedules = schedules.flat();

            // Create events from job template activations
            const activationEvents = await Promise.all(flattenedActivates.map(async (jobTemplateActivate) => {
                const createdAtDate = new Date(jobTemplateActivate.createdAt);
                const job = await Job.findOne({ _id: jobTemplateActivate.JOB_ID });
                if (!job) {
                    return null; // Skip if the job does not exist
                }
                const jobName = job.JOB_NAME;
                const status = await Status.findOne({ _id: job.JOB_STATUS_ID });
                const statusColor = status ? status.color : null;
                const statusName = status ? status.status_name : null;
                //console.log("test->",job.LINE_NAME+" : "+jobName);
                return {
                    title: job.LINE_NAME+" : "+jobName,
                    job_id: job._id,
                    status_name: statusName,
                        //line_name: job.LINE_NAME,
                    start: new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate()),
                    end: new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate()),
                    color: statusColor,
                };
            }));
            
            //console.log('activationEvents',activationEvents);
            // Filter out null values from activationEvents
            const validActivationEvents = activationEvents.filter(event => event !== null);

            // Create events from schedules
            const scheduleEvents = await Promise.all(flattenedSchedules.map(async (schedule) => {
                const activateDate = new Date(schedule.ACTIVATE_DATE);
                const status = await Status.findOne({ status_name: schedule.STATUS });
                const statusColor = status ? status.color : null;
                //console.log('schedule',schedule);
                const LineName=await JobTemplate.findOne({JobTemplateCreateID:schedule.JOB_TEMPLATE_CREATE_ID});
                const Line_Name=LineName?.LINE_NAME || 'Unknown';
                //console.log("test->",schedule.LINE_NAME+" : "+schedule.JOB_TEMPLATE_NAME);    
                const activateDate_s = new Date(schedule.ACTIVATE_DATE);
                const hours = activateDate_s.getHours().toString().padStart(2, '0');  // แปลงให้เป็น 2 หลัก
                const minutes = activateDate_s.getMinutes().toString().padStart(2, '0');
                const activationTime = `${hours}:${minutes}`;

                return {
                    title: schedule.LINE_NAME+" : "+schedule.JOB_TEMPLATE_NAME+"   :  "+activationTime,
                    job_id: schedule.JOB_TEMPLATE_ID,
                    status_name: schedule.STATUS,
                    //line_name: schedule.LINE_NAME,
                    start: new Date(activateDate.getFullYear(), activateDate.getMonth(), activateDate.getDate()),
                    end: new Date(activateDate.getFullYear(), activateDate.getMonth(), activateDate.getDate()),
                    color: statusColor,
                };
            }));
            // Combine valid activation events and schedule events
            const resolvedEvents = [...validActivationEvents, ...await Promise.all(scheduleEvents)];        
            // console.log("Resolved events:", resolvedEvents);
            // resolvedEvents.forEach(element => {
            //                 if(element.start>new Date('2025-04-25')){
            //                             console.log(element);
            //                 }
            // });        
            console.timeEnd("fetch-jobs");  // จะแสดงเวลาใน milliseconds
            return NextResponse.json({ status: 200, events: resolvedEvents });
        }  
    } catch (error) {
        console.error("Error fetching job events:", error);
        return NextResponse.json({ status: 404, file: __filename, error: error.message || error });
    }
};
