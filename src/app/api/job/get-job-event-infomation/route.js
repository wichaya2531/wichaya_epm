import { NextResponse } from 'next/server.js';
import { JobTemplateActivate } from "@/lib/models/AE/JobTemplateActivate";
import { JobTemplate } from "@/lib/models/JobTemplate";
import { Job } from "@/lib/models/Job";
import { Status } from "@/lib/models/Status";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Schedule } from "@/lib/models/Schedule.js";
import { ObjectId } from "mongodb"; // นำเข้า ObjectId จาก mongodb library
import { Role } from "@/lib/models/Role.js";
import { User } from "@/lib/models/User.js";


import { Workgroup } from "@/lib/models/Workgroup.js";


export const GET = async (req, res) => {
    await connectToDb();
    const searchParams = req.nextUrl.searchParams;
    //console.log('searchParams',searchParams);
    const job_id = searchParams.get('job_id'); // ✅ ดึงค่ามาใช้
    const user_id=searchParams.get('user_id');
    const user_workgroup_id=searchParams.get('user_workgroup_id');
    //let rolses_name="";
    let role_user="Unknown";
    try {
        const current_user=await User.findById(user_id);
        role_user = await Role.findById(current_user.ROLE.toString());
        role_user = role_user.ROLE_NAME;
    } catch (error) {
        console.log(error);
    }

    try{
        let theJob=await Job.findOne({_id:new ObjectId(job_id)});   
        //console.log('theJob',theJob); 
        if(theJob){
                //console.log('theJob WORKGROUP_ID ',theJob.WORKGROUP_ID);
                //console.log('user user_workgroup_id ',user_workgroup_id); 
                const job_status= await Status.findById( theJob.JOB_STATUS_ID );     
                if(theJob.WORKGROUP_ID.toString()===user_workgroup_id){
                    //  user อยู่ใน workgroup เดียวกันกับงานนั้น 
                    if (job_status.status_name==='new' ||  job_status.status_name==="renew") {
                        if (role_user==="Admin Group" || role_user==="Owner" ) {
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View','Delete']});                                      
                        }else{
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View']});              
                        }
                    }else if(job_status.status_name==='ongoing'){
                        if (role_user==="Admin Group" || role_user==="Owner") {
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View','Delete']});    
                        }else{
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View']});    
                        }
                    }else if(job_status.status_name==='waiting for approval'){
                        //console.log('use : waiting for approval');
                        //console.log('theJob',theJob);
                        //console.log('user_id',user_id);
                        if(theJob.SUBMITTED_BY._id.toString()===user_id){
                            //ค้น submit กับคนที่เปิด ดูงาน เป็นคนเดียวกัน
                           // console.log('theJob.JOB_APPROVERS',theJob.JOB_APPROVERS);
                           // console.log('user_id',user_id);
                            if (role_user==="Admin Group" || role_user==="Owner") {
                                if(theJob.JOB_APPROVERS.includes(user_id)){
                                    return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View','Approve','Delete']});  
                                }else{
                                    return NextResponse.json({ status: 200 ,info:theJob,menu:['Get','View','Delete']});  
                                }                                                              
                            }else{
                                //ไม่ได้เป็น Admin Group     
                                if(theJob.JOB_APPROVERS.includes(user_id)){
                                    //อยู่ใน Approve List                                     
                                     return NextResponse.json({ status: 200 ,info:theJob,menu:['Edit','View','Approve']});
                                }else{
                                    //ไม่ได้อยู่ใน Approve List
                                     return NextResponse.json({ status: 200 ,info:theJob,menu:['Edit','View']});
                                }                               
                            }
                        }else{
                            //ค้น submit กับคนที่เปิด ดูงาน ไม่ได้เป็นคนเดียวกัน
                            if (role_user==="Admin Group" || role_user==="Owner" ) {
                                if(theJob.JOB_APPROVERS.includes(user_id)){
                                    return NextResponse.json({ status: 200 ,info:theJob,menu:['View','Approve','Delete']});                                
                                }else{
                                    return NextResponse.json({ status: 200 ,info:theJob,menu:['View','Delete']});                                
                                }                            
                            }else{
                                return NextResponse.json({ status: 200 ,info:theJob,menu:['View']});    
                            }                                                        
                        }
                    }else if(job_status.status_name==='complete'){
                        if (role_user==="Admin Group" || role_user==="Owner") {
                            return NextResponse.json({ status: 200 ,info:theJob,menu:["Delete",'View']});    
                        }else{
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['View']});    
                        }
                    }else if(job_status.status_name==='overdue'){
                        if (role_user==="Admin Group" || role_user==="Owner") {
                            return NextResponse.json({ status: 200 ,info:theJob,menu:["Delete",'View']});    
                        }else{
                            return NextResponse.json({ status: 200 ,info:theJob,menu:['View']});    
                        }
                    }else{
                        return NextResponse.json({ status: 200 ,info:theJob,menu:['Delete']});
                    }
                }else{
                     //  user อยู่ต่าง workgroup กันกับงานนั้น 
                    // if(job_status==="new" || job_status==="ongoing" || job_status==="waiting for approval" || job_status==="complete"){
                    //     return NextResponse.json({ status: 200 ,info:theJob,menu:['View']});  
                    // }else{
                        return NextResponse.json({ status: 200 ,info:theJob,menu:['View']});  
                    //} 
                }
                  
        }    
        let theSchedual=await Schedule.findOne({JOB_TEMPLATE_ID:new ObjectId(job_id)});   
        if(theSchedual){
                //console.log('theSchedual',theSchedual);
                if(theSchedual.WORKGROUP_ID.toString()===user_workgroup_id){
                    //  user อยู่ใน workgroup เดียวกันกับงานนั้น 
                    if (role_user==="Admin Group" || role_user==="Owner") {
                        return NextResponse.json({ status: 200 ,info:theSchedual,menu:['Delete','Move']});                             
                    }else{
                        return NextResponse.json({ status: 200 ,info:theSchedual,menu:[]});         
                    }
                }else{
                    //  user อยู่ต่าง workgroup กันกับงานนั้น 
                    return NextResponse.json({ status: 200 ,info:theSchedual,menu:[]});         
                }    

        }
        return NextResponse.json({ status: 200 });         
    } catch (error) {
        console.error("Error fetching job events:", error);
        return NextResponse.json({ status: 404, file: __filename, error: error.message || error });
    }
};
