"use client";
import { useState, useEffect, use } from "react";
import useFetchJobs from "@/lib/hooks/useFetchJobs.js";
import TableComponent from "./TableComponent";
import TableComponentAdmin from "./TableComponentAdmin";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useFetchUser from "@/lib/hooks/useFetchUser";
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import JobReview from  '@/components/JobReview';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Person2Icon from '@mui/icons-material/Person2';
import Person3Icon from '@mui/icons-material/Person3';
import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GroupIcon from '@mui/icons-material/Group';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

import { ProfileGroup } from "@/lib/models/ProfileGroup";
import { createRoot } from 'react-dom/client';


import NotificationImportantSharpIcon from '@mui/icons-material/NotificationImportantSharp';


const jobsActiveHeader = [
  "ID",
  "Checklist Name",
  "Line Name",
  // "Document no.",
  "Status",
  "Active",
  "Submitted By",
  "Action",
];
const jobsActiveHeaderAdmin = [
  "",
  "ID",
  "Checklist Name",
  "Line Name",
  // "Document no.",
  "Status",
  "Active",
  "Submitted By",
  "Action",
];

const statusOptions = [
  "All",
  "New",
  "Ongoing",
  "Plan",
  "Waiting for approval",
  "Complete",
  "Renew",
  "Overdue",
];

import {  useRef, useCallback } from "react";
//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
  username: process.env.NEXT_PUBLIC_MQT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
  reconnectPeriod: 2000,
};
//---------------------------------------------->>

const JobsTable = ({ refresh,handleEventToMqtt }) => {
  const router = useRouter();
  //console.log('pageExpire',pageExpire);
  //console.log("refresh JobsTable=>",refresh);
 
  //console.log(process.env.NEXT_PUBLIC_NOTIFY_NEW_USER);
  //console.log("****use JibsTable****");
  //console.log("JobsTable=>",refresh);

  //console.log(refresh);
  const [disabledJobs, setDisabledJobs] = useState({}); // เก็บสถานะ disable ของแต่ละ job_id
  const { user, isLoading: userLoading } = useFetchUser(refresh);
  const [profiles, setProfiles] = useState([]); // Default end date as null

  const [startDate, setStartDate] = useState(null); // Default start date as null
  const [endDate, setEndDate] = useState(null); // Default end date as null
  
  const [filterStatus, setFilterStatus] = useState("All");
  const [reloadKey, setReloadKey] = useState(0);

  const [profileSelected, setProfileSelected] = useState(null);

  const { jobs, setJobs, isLoading: jobsLoading, fetchJobs } =  useFetchJobs({
    refresh,
    startTime: startDate,
    endTime: endDate,
    status: filterStatus,
    profileSelected:profileSelected,
    reloadKey,   // ส่งไปใน dependency
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
//---------------------upsert job status to ongoing  when user click get job ----------------->>
// ถ้ายังไม่มี ฟังก์ชัน upsert ให้ประกาศไว้ด้านบนไฟล์ (นอก on("message"))
const upsertJobs = (jobs, infos, { sortByUpdatedAt = true } = {}) => {
  // รองรับทั้ง object เดี่ยวและ array
  const arr = Array.isArray(infos) ? infos : [infos];

  // ใช้ Map ช่วยจับคู่ตาม _id
  const infoMap = new Map(arr.map(i => [String(i._id), i]));

  // อัปเดตตัวที่มีอยู่แล้ว (merge)
  const merged = jobs.map(j => {
    const hit = infoMap.get(String(j._id));
    return hit ? { ...j, ...hit } : j;
  });

  // เติมตัวที่ยังไม่มีใน jobs
  const existingIdSet = new Set(merged.map(j => String(j._id)));
  const newOnes = arr.filter(i => !existingIdSet.has(String(i._id)));

  let result = [...newOnes, ...merged];

  // จัดเรียงใหม่ (ถ้าต้องการ)
  if (sortByUpdatedAt) {
    result = result.sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta; // ใหม่อยู่บน
    });
  }

  return result;
};

//-----------MQTT----------------------------------------->>
   const mqttClient = useRef(null);
   useEffect(() => {
     const client = mqtt.connect(connectUrl, options);
     mqttClient.current = client;
   
     const onConnect = () => {
       console.log("✅ MQTT Connected on JobsTable component");
       if (user?.workgroup_id) client.subscribe(user.workgroup_id);
     };

     client.on("connect", onConnect);
     client.on("error", (err) => console.error("❌ MQTT Error:", err));
     client.on("close", () => console.warn("⚠️ MQTT Disconnected"));
     client.on("message", async (t, m) => {        
        try {
          if (document.getElementById('page-expire').innerHTML==='true'){ 
                      console.log('Block by page expire!!');
                      return;
          }
        } catch (error) {
                console.error("Error Code: 120\n", error?.stack ?? error);
        }            
        setReloadKey(currentPage => currentPage + 1); // เปลี่ยนค่าเพื่อ trigger useEffect ใน useFetchJobs        
     });
   
     return () => {
       client.end(true);
       mqttClient.current = null;
     };
   }, []);
   
   // ถ้า user เปลี่ยน ค่อย subscribe เพิ่ม
   useEffect(() => {
     if (user?.workgroup_id && mqttClient.current?.connected) {
       mqttClient.current.subscribe(user.workgroup_id, (err) =>
         err ? console.error("Subscription error:", err)
             : console.log("📡 Subscribed:", user.workgroup_id)
       );
     }
   }, [user?.workgroup_id]);
   
   // ใช้เรียกตอนกดปุ่ม/เหตุการณ์เท่านั้น (อย่าเรียกตรง ๆ ระหว่าง render)
   const handleEventToMqttLocal = useCallback(() => {
     const c = mqttClient.current;
     if (!c || c.disconnected) {
       console.warn("MQTT not connected");
       return;
     }
     if (!user?.workgroup_id) {
       console.warn("No topic");
       return;
     }
     try {
       c.publish(user.workgroup_id, "refresh");
     } catch (err) {
       console.error("Error Code: 121\n", err?.stack ?? err);
     }
   }, [user?.workgroup_id]);

//----------------------------Review Function --------------

  const handleApprove = async (job_id,isApproved, comment = null) => {

    var disapprove_reason="";
    if(!isApproved){
       
        const { value: disapprove_reason_1,isDismissed } = await Swal.fire({
        title: "Please provide a reason",
        input: "textarea",
        inputPlaceholder: "Enter your reason here...",
        inputAttributes: {
          "aria-label": "Enter your reason here",
        },
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
      });
      if (isDismissed) {
        return;
      }
      disapprove_reason=disapprove_reason_1;
    }



   // console.log('isApproved',isApproved);
  //  return;
    

    try {
      const response = await fetch(`/api/approval/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: job_id,
          user_id: user._id,
          isApproved,
          comment,
          disapprove_reason,
        }),
        next: { revalidate: 10 },
      });
      const data = await response.json();
      if (data.status === 200) {
        Swal.fire({
          title: "Success",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
         //. setRefresh(!refresh);
          setTimeout(() => {
                  handleEventToMqttLocal();
          }, 1000);  
          //setTimeout(() => {
          //      router.push("/pages/job-approve");
          //}, 1500);

          
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  //------------------------------------------


const JobReviewComponent = ({ job_id }) => (
  <div style={{ width: '100%', height: '100%', padding: 20 }}>
    {/* <h2 className="text-lg font-bold mb-4">Job Review</h2> */}
    {/* <p>กำลังเปิด Job ID: <b>{job_id}</b></p> */}
    {/* <p>เนื้อหาใน component นี้สามารถเป็น table, form หรือ dashboard ได้เลย</p> */}
      <JobReview
        job_id={job_id}
       
        //  jobData={jobData}
        //  jobItems={jobItems}
          handleApprove={handleApprove}
        //  handleShowJobItemDescription={handleShowJobItemDescription}
        //  handleShowTestMethodDescription={handleShowTestMethodDescription}
        //  toggleJobItem={toggleJobItem}
        //  isShowJobItem={isShowJobItem}
        //  toggleJobInfo={toggleJobInfo}
        //  isShowJobInfo={isShowJobInfo}
        //  toggleAddComment={toggleAddComment}
        //  view={view}
        //  preview_1={preview_1}
        //  preview_2={preview_2}        
        //  onclicktoShow={handleToShowOnClick}
        //  handleUploadFileToJob={handleUploadFileToJob}
        //  user={user}
       />
  </div>

  
);

const handleClick = (job_id) => {
  // ถ้าปุ่มนี้ถูก disable อยู่แล้ว ไม่ให้กดซ้ำ
  if (disabledJobs[job_id]) return;

  // เซตสถานะ disable ของ job_id นี้เป็น true
  setDisabledJobs((prev) => ({ ...prev, [job_id]: true }));

  // เรียกฟังก์ชันหลัก
  navigateToJobForApprove(job_id, true);
  // ✅ เปิดปุ่มกลับหลัง 5 วินาที
  setTimeout(() => {
    setDisabledJobs((prev) => ({ ...prev, [job_id]: false }));
  }, 15000);
};

 const navigateToJobForApprove = (job_id, viewMode) => {
  //sessionStorage.setItem('approveMode', true);

  let root; // เก็บไว้ unmount เวลา close
  Swal.fire({
    html: '<div id="swal-react-root" style="height:100%"></div>',
    width: '70vw',
    heightAuto: false,
    showConfirmButton: false,
    showCloseButton: true,
    allowOutsideClick: false,
    didOpen: () => {
      const popup = Swal.getPopup();
      popup.style.height = '70vh';
      const htmlBox = popup.querySelector('.swal2-html-container');
      if (htmlBox) {
        htmlBox.style.margin = '0';
        htmlBox.style.padding = '0';
        htmlBox.style.height = '100%';
      }
      const mount = document.getElementById('swal-react-root');
      root = createRoot(mount);
      root.render(<JobReviewComponent job_id={job_id}  />);
    },
    willClose: () => {
      if (root) root.unmount();
    },
  });
};

  //------------------------------------------------------->>
useEffect(() => {
  if (!user?.workgroup_id) return; // ถ้าไม่มี workgroup_id ก็ไม่ต้อง fetch

  const fetchProfileGroup = async () => {
    try {
      const res = await fetch("/api/profile-group/get-profile-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workgroup_id: user.workgroup_id, // ✅ ใช้จาก user โดยตรง
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      //console.log("data.profileGroup", data.profileGroup);
      setProfiles(data.profileGroup);
    } catch (error) {
      console.error("Error fetching profile group:", error);
    }
  };
  fetchProfileGroup(); // เรียก async function
}, [user]);



  const handleSelectJob = (jobId) => {
    //console.log("JobTable handleSelectJob");
    setSelectedJobs((prevSelected) =>
      prevSelected.includes(jobId)
        ? prevSelected.filter((id) => id !== jobId)
        : [...prevSelected, jobId]
    );
  };

  // ฟังก์ชันลบงานที่เลือก
  const handleDeleteSelected = async () => {
    //alert('Delete');
    if (selectedJobs.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/job/remove-job`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_ids: selectedJobs }), // ส่ง array
        });

        const result = await response.json();
        if (response.ok) {
          Swal.fire("Deleted!", "Selected jobs have been deleted.", "success");
          setJobs((prevJobs) =>
            prevJobs.filter((job) => !selectedJobs.includes(job._id))
          );
          setSelectedJobs([]);
          
          {
                  // flush message to mqtt
                try{
                       handleEventToMqtt("refresh");
                }catch(err){
                       console.error("📄 Stack trace:\n", err.stack);
                      handleEventToMqttLocal();
                }
                 
          
          }


        } else {
          Swal.fire(
            "Error!",
            result.error || "Failed to delete jobs.",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Failed to delete jobs.", "error");
      }
    }
  };

  //console.log("jobs.=>", jobs);
  const filteredJobs =
    jobs &&
    jobs.filter((job) => {
      //console.log("filterxxx");
       //if(job.JOB_NAME==='wichaya_for_test'){
       //     console.log(' job.JOB_NAME ',job);
       //}     
      // Filter by status
      if (
        filterStatus !== "All" &&
        job.STATUS_NAME !== filterStatus.toLowerCase()
      ) {
        return false;
      }

      // Filter by start date
      // if (startDate && new Date(job.createdAt) < new Date(startDate)) {
      //   return false;
      // }

      // // Filter by end date
      // if (endDate && new Date(job.createdAt) > new Date(endDate)) {
      //   return false;
      // }

      // Filter by search query
      if (
        searchQuery &&
        !(job.JOB_NAME ?? "").toString().toLowerCase()
          .includes(searchQuery.toString().toLowerCase())
      ) {
        return false;
      }

      return true;
    });

const navigateToJob = (job_id, viewMode) => {
  // เก็บค่าที่ต้องใช้ในหน้าใหม่
  sessionStorage.setItem("viewMode", viewMode);

  // เปิดแท็บใหม่ โดยส่ง job_id เป็น query parameter
  const url = `/pages/view-jobs?job_id=${encodeURIComponent(job_id)}`;
  window.open(url, "_blank"); // ✅ "_blank" = new tab
};

  const handleSearch = (e) => {
    //console.log("use search");
    setSearchQuery(e.target.value);
  };


const handleShowUser = (userName, datetime) => {
  const name = userName ?? "Unknown";

  // แปลงเวลาเป็นสตริงอ่านง่าย (ถ้าไม่มีให้เป็น "-")
  const timeStr = datetime
    ? new Date(datetime).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
    : "-";

  Swal.fire({
    title: "Information",
    html: `
      <div style="text-align:left;font-size:16px;line-height:1.6">
        <div><b>Last Get By:</b> ${name}</div>
        <div><b>Time:</b> ${timeStr}</div>
      </div>
    `,
    icon: "info",
    confirmButtonText: "OK",
  });
};

  const jobsActiveBody =
    filteredJobs &&
    filteredJobs.map((job, index) => {
      //console.log("job",job);
      let statusColor = job.STATUS_COLOR;
      // ตรวจสอบค่า Active ตาม STATUS_NAME
      const activeValue =
        job.STATUS_NAME === "complete"
          ? job.SUBMITTED_DATE
            ? new Date(job.SUBMITTED_DATE).toLocaleString()
            : "Not Active"
          : job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : "Not Active";
      return {
        ...( (user.role === "Admin Group" || user.role === "Owner")  && {
          checkbox: (
            <input
              className="w-5 h-5"
              type="checkbox"
              checked={selectedJobs.includes(job._id)}
              onChange={() => handleSelectJob(job._id)}
            />
          ),
        }),
        ID: index + 1,
        "Checklist Name": job.JOB_NAME,
        "Line Name": job.LINE_NAME,
        Status: (
          <div
            style={{ backgroundColor: statusColor,position:'relative' }}
            className="py-1 px-8 select-none rounded-xl text-white font-bold shadow-xl text-[12px] ipadmini:text-sm flex justify-center items-center px-5"
            
          >
            
          <div style={{position:'absolute',left:'5px'}}>
                  {/* ถ้ามี job.LAST_GET_BY */}
                  {  job.STATUS_NAME  &&  job.LAST_GET_BY && job.STATUS_NAME =="ongoing" && (
                    <AssignmentIndIcon         
                      className="w-6 h-6 mr-2"
                      style={{ fontSize: 24, color: "#fafbff" }}
                      onClick={() => handleShowUser(job.LAST_GET_BY,job.LAST_GET_TIME)} // << ส่งค่าไปด้วย
                    />
                  )}
          </div>
            
          
            
           

            {job.STATUS_NAME ? job.STATUS_NAME : "pending"} {  
                //(job.IMAGE_FILENAME || job.IMAGE_FILENAME_2)?(
                  <div style={{position:'absolute',right:'1px'}}> 
                      {
                        (job.ITEM_ABNORMAL===1)?(
                                <NotificationImportantSharpIcon color="white"  />
                        ):""

                      } 
                      {
                        (job.JOB_VERIFY)?(
                            <VerifiedIcon color="white"  />                  
                        ):""
                      }
                  </div>  
                                   
               // ):""                
            }

            {/*
            job.ITEM_ABNORMAL===false?(
                <div>
                    <div style={{position:'absolute',right:'10px',top:'0px'}}> 
                         <NotificationImportantSharpIcon color="white"  />
                    </div> 
                </div>
            ):""
              */
            }

          </div>
        ),
        Active: activeValue, // ใช้ activeValue ที่ได้จากการตรวจสอบ
        "Submitted By": job.SUBMITTED_BY ? job.SUBMITTED_BY.EMP_NAME : "-",
        Action: (
          <div>
            {job.STATUS_NAME === "complete" || job.STATUS_NAME === "waiting for approval" ? (
               <div className="flex gap-2 items-center justify-center">
                    
                    {job.STATUS_NAME === "waiting for approval" && ( user.emp_number===job.SUBMITTED_BY.EMP_NUMBER || job.PUBLIC_EDIT_IN_WORKGROUP===true)  ?(
                        <div
                          className={`text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer`}
                          onClick={() => {
                            navigateToJob(job._id, false);
                          }}
                        >
                          Edit
                        </div>                      
                    ):""}
                        


                    <div
                      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                      onClick={() => {
                        navigateToJob(job._id, true);
                      }}
                    >
                      View 
                    </div>
                    {
                      job.APPROVE_ALLOW && (
                                  <div
                                    className={`text-white font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer 
                                      ${
                                        disabledJobs[job._id]
                                          ? "bg-gray-400 cursor-not-allowed"
                                          : "hover:bg-blue-800"
                                      }`}
                                    style={{
                                      backgroundColor: disabledJobs[job._id] ? "#BDBDBD" : "#FF9800",
                                    }}
                                    onClick={
                                      !disabledJobs[job._id] ? () => handleClick(job._id) : undefined
                                    }
                                  >
                                    {disabledJobs[job._id] ? "Please wait..." : "Approve"}
                                  </div>
                      )
                    }


               </div>              
            ) : job.STATUS_NAME !== "overdue" ? (
              <>
                {job.STATUS_NAME === "ongoing" ||
                job.STATUS_NAME === "new" ||
                job.STATUS_NAME === "renew"  ? (
                  <div className="flex gap-2 items-center justify-center">
                    <div
                      className="text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                      onClick={() => {
                        navigateToJob(job._id, false);
                      }}
                    >
                      Get
                    </div>
                    <div
                      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                      onClick={() => {
                        navigateToJob(job._id, true);
                      }}
                    >
                      View
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-not-allowed cursor-pointer"
                    disabled
                  >
                    unavailable now
                  </button>
                )}
              </>
            ) : (
              <button
                className="text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-not-allowed cursor-pointer"
                disabled
              >
                overdue
              </button>
            )}
          </div>
        ),
        
      };
    });

  //console.log("jobsActiveBody=>",jobsActiveBody);

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (endDate && newStartDate) {
      const start = new Date(newStartDate);
      const end = new Date(endDate);
      const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        Swal.fire({
          icon: "warning",
          title: "Date range too large",
          text: "Start Date and End Date must be within 90 days.",
        });
        // ปรับ startDate ให้ไม่เกิน 90 วันจาก endDate
        const maxStart = new Date(end);
        maxStart.setDate(end.getDate() - 90);
        setStartDate(maxStart.toISOString().slice(0, 10));
      }
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    if (startDate && newEndDate) {
      const start = new Date(startDate);
      const end = new Date(newEndDate);
      const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        Swal.fire({
          icon: "warning",
          title: "Date range too large",
          text: "Start Date and End Date must be within 90 days.",
        });
        // ปรับ endDate ให้ไม่เกิน 90 วันจาก startDate
        const maxEnd = new Date(start);
        maxEnd.setDate(start.getDate() + 90);
        setEndDate(maxEnd.toISOString().slice(0, 10));
      }
    }
  };

  // Set default startDate and endDate to today -3 and today +3
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 3);

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }, []);

  return (
    <div className="w-full flex flex-col mt-5">
      <div className="flex flex-wrap mb-4 justify-start items-center gap-4">
      
          <div className="flex flex-row gap-4">
            <div className="flex-2 w-1/2 font-medium text-black ">
                  Pull:
            </div>
            <div className="flex-2 w-1/2" >
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-black"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate || ""}
                onChange={handleStartDateChange}
                className="bg-white w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              />
            </div>

            <div className="flex-2 w-1/2" >
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-900"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate || ""}
                onChange={handleEndDateChange}
                className="bg-white w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              />
            </div>
          </div>
        <div className="flex-2">         
        </div>
        <div className="flex-1.5">
          {/* <label
            htmlFor="statusFilter"
            className="block text-sm font-medium  text-black"
          >
            Search Checklist
          </label>
          <label
            htmlFor="search"
            className="mb-2 text-sm font-medium text-black sr-only"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-4 h-4 " />
            </div>
            <input
              type="search"
              id="search"
              className="block w-full p-2.5 pl-10 text-sm border border-gray-300 rounded-lg bg-white-50 focus:ring-blue-500 focus:border-blue-500dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 text:dark dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search"
              required
              onChange={handleSearch}
            />
          </div> */}

         <label
            htmlFor="statusFilter"
            className="block text-sm font-medium  text-black"
          >
            Profile Groups
          </label>
          <select
            id="profile-group-filter"
            className="bg-white w-full border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={(e) => setProfileSelected(e.target.value)}
          >
            <option value="">All</option>
            {(profiles || []).map((ln) => (
              <option key={ln._id} value={String(ln._id)}>
                {ln.PROFILE_NAME}
              </option>
            ))}
          </select>

        </div>
        
        <div className="flex-2">
          <label
            htmlFor="statusFilter"
            className="block text-sm font-medium text-black"
          >
            Filter by Status
          </label>
          <select
            id="statusFilter"
            className="bg-white w-full border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option
                key={option}
                value={option === "All" ? "All" : option.toLowerCase()}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      {user.role === "Admin Group" || user.role === "Owner" ? (
        <TableComponentAdmin
          headers={jobsActiveHeaderAdmin}
          datas={jobsActiveBody}
          TableName={
              <>
                Checklist Jobs [{jobsActiveBody.length}
                {jobsLoading && <span className="animate-pulse ml-3">..... ⏳</span>}
                ]
              </>
          }
          PageSize={5}
          searchColumn={"Checklist Name"}
          searchColumn1={"Line Name"}
          searchHidden={true}
          filteredJobs={filteredJobs}
          selectedJobs={selectedJobs}
          handleDeleteSelected={handleDeleteSelected}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          setSelectedJobs={setSelectedJobs}
          isLoading={jobsLoading}
        />
      ) : (
        <TableComponent
          headers={jobsActiveHeader}
          datas={jobsActiveBody}
           TableName={
              <>
                Checklist Jobs [{jobsActiveBody.length}
                {jobsLoading && <span className="animate-pulse ml-3">..... ⏳</span>}
                ]
              </>
          }
          PageSize={5}
          searchColumn={"Checklist Name"}
          searchHidden={true}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};

export default JobsTable;
