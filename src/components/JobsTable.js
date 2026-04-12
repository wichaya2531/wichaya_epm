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
  "Update",
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
  "Update",
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

const JobsTable = ({ refresh=true,
                        date_range=1 ,
                            jobFileterStatus="All",
                                filterStatusDisable=false ,
                                    editBtnDisable=false,
                                        viewBtnDisable=false,
                                              approveByNavigate=false,
                                                  handleJobReviewByNavigate, 
                                                    callFromApprovePage=false,
                                                }) => {
  const router = useRouter();
  //console.log('jobFileterStatus',jobFileterStatus);
  //console.log("refresh JobsTable=>",refresh);
 
  //console.log(process.env.NEXT_PUBLIC_NOTIFY_NEW_USER);
  //console.log("****use JibsTable****");
  //console.log("JobsTable=>",refresh);

  //console.log(refresh);
  const [disabledIds, setDisabledIds] = useState(new Set());
  
  const [disabledJobs, setDisabledJobs] = useState({}); // เก็บสถานะ disable ของแต่ละ job_id
  const { user, isLoading: userLoading } = useFetchUser(refresh);
  const [profiles, setProfiles] = useState([]); // Default end date as null

  const [startDate, setStartDate] = useState(null); // Default start date as null
  const [endDate, setEndDate] = useState(null); // Default end date as null
  
  const [filterStatus, setFilterStatus] = useState(jobFileterStatus);
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


  const [orientation, setOrientation] = useState("portrait");

useEffect(() => {
  //console.log("เริ่มเช็คความกว้างและความสูงของหน้าจอ");
   
  const checkOrientation = () => {
    if (window.innerHeight > window.innerWidth) {
      setOrientation("portrait");
    } else {
      setOrientation("landscape");
    }
  };

  // เช็คทันทีตอนเข้า
  checkOrientation();

  // เช็คเมื่อมีการ resize / หมุนจอ
  window.addEventListener("resize", checkOrientation);
  window.addEventListener("orientationchange", checkOrientation);

  return () => {
    window.removeEventListener("resize", checkOrientation);
    window.removeEventListener("orientationchange", checkOrientation);
  };
}, []);
//---------------------upsert job status to ongoing  when user click get job ----------------->>
// ถ้ายังไม่มี ฟังก์ชัน upsert ให้ประกาศไว้ด้านบนไฟล์ (นอก on("message"))
function upsertJobs(list, incoming) {
  const id = String(incoming._id);
  const idx = list.findIndex(j => String(j._id) === id);
  if (idx === -1) return [...list, incoming]; // ถ้าไม่เจอ เพิ่มท้าย
  const updated = [...list];
  updated[idx] = { ...updated[idx], ...incoming }; // merge ข้อมูลใหม่เข้า
  return updated;
}

//------------SSE------------------------------------------>>
const jobsRef = useRef([]); // ✅ สร้าง ref เก็บค่า jobs ล่าสุด
const userRef = useRef([]); // ✅ สร้าง ref เก็บค่า users ล่าสุด
// อัปเดตค่า ref ทุกครั้งที่ state jobs เปลี่ยน
useEffect(() => {
  jobsRef.current = jobs;
}, [jobs]);
useEffect(() => {
  userRef.current = user;
}, [user]);

useEffect(() => {
  // ถ้ายังไม่มี userRef.current หรือไม่มี workgroup_id ให้ return ออกไปก่อน
  if (!userRef.current || !userRef.current.workgroup_id) {
    console.log("⏳ รอ userRef พร้อมก่อน...");
    return;
  }

  console.log("✅ เริ่มเชื่อมต่อ SSE ของกลุ่ม:", userRef.current.workgroup_id);

  const es = new EventSource(`/api/events?group=${userRef.current.workgroup_id}`);

  es.onmessage = async (ev) => {
    console.log('data receive',ev.data);
    try {
      const first = JSON.parse(ev.data);

      if (first === "refresh") {
        setTimeout(() => {
          setReloadKey(reloadKey => reloadKey + 1);
        }, 3500);
        return;
      }

      const obj = typeof first === "string" ? JSON.parse(first) : first;
      console.log("✅ Parsed object:", obj);

      // 🔸 ถ้าไม่มี JOB_ID ก็ไม่ต้องทำต่อ
      if (!obj?.JOB_ID) {
        console.warn("❌ ไม่มี JOB_ID ใน message:", ev.data);
        return;
      }



      setTimeout( async() => {
          // 🔸 เรียก API
          const res = await fetch(
            `/api/job/get-job-by-id?job_id=${obj.JOB_ID}&user_id=${userRef.current._id}`,
            { method: "GET", next: { revalidate: 10 } }
          );

          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          const data = await res.json();
          console.log("✅ Job data:", data);

          // 🔸 ตรวจสอบว่ามีอยู่แล้วหรือยัง
          const found = jobsRef.current.some(j => j._id === data.jobData._id);
          if (found) {
            console.log("🔁 อัปเดต job:", data.jobData._id);
            setJobs(prev => upsertJobs(prev, data.jobData));
          } else {
            console.log("🆕 job นี้ยังไม่มีใน list");
          }        
      }, 1500);  



    } catch (err) {
      console.error("❌ JSON.parse หรือ fetch error:", err);
      console.warn("raw =", ev.data);
    }
  };

  es.onerror = (err) => console.error("❌ SSE error:", err);
  
  setTimeout(() => {
          console.log("🧹 ปิดการเชื่อมต่อ SSE.....");
          es.close();
  }, Number(process.env.NEXT_PUBLIC_PAGE_TIMEOUT)*1000);

  return () => {
    console.log("🧹 ปิดการเชื่อมต่อ SSE");    
    es.close();
  };



}, [userRef.current?.workgroup_id]); // ✅ จะ re-run เมื่อมีค่า workgroup_id


//---------------------------   --------------------------------------

const handleApproveSelected = async () => {
  if (selectedJobs.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "No jobs selected",
      text: "Please select at least 1 job.",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Approve selected jobs?",
    text: `You are about to approve ${selectedJobs.length} item(s).`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, approve all",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const approvePromises = selectedJobs.map((job_id) =>
      fetch(`/api/approval/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id,
          user_id: user._id,
          isApproved: true,
          comment: "Bulk approve",
          disapprove_reason: "",
        }),
      }).then((res) => res.json())
    );

    const results = await Promise.all(approvePromises);

    const successCount = results.filter((item) => item.status === 200).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      setSelectedJobs([]);
      setReloadKey((prev) => prev + 1);
    }

    Swal.fire({
      icon: successCount > 0 ? "success" : "error",
      title: "Bulk Approve Result",
      html: `
        <div style="text-align:left">
          <div>Approved: <b>${successCount}</b></div>
          <div>Failed: <b>${failCount}</b></div>
        </div>
      `,
      confirmButtonText: "OK",
    });
  } catch (error) {
    console.error("Bulk approve error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to approve selected jobs.",
    });
  }
};




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
          //setTimeout(() => {
          //        handleEventToMqtt();
         // }, 1000);  
          //setTimeout(() => {
          //      router.push("/pages/job-approve");
          //}, 1500);
           //  setReloadKey(currentPage => currentPage + 1); // เปลี่ยนค่าเพื่อ trigger useEffect ใน useFetchJobs                  
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
       
          //jobData={jobData}
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
  //click เพื่อรอการ Approve ------
  // ถ้าปุ่มนี้ถูก disable อยู่แล้ว ไม่ให้กดซ้ำ
  if (disabledJobs[job_id]) return;

  // เซตสถานะ disable ของ job_id นี้เป็น true
  setDisabledJobs((prev) => ({ ...prev, [job_id]: true }));

  if (approveByNavigate && handleJobReviewByNavigate) {
    handleJobReviewByNavigate(job_id);
  }else{
      // เรียกฟังก์ชันหลัก
      navigateToJobForApprove(job_id, true);
      // ✅ เปิดปุ่มกลับหลัง 5 วินาที
  }
  
  setTimeout(() => {
    setDisabledJobs((prev) => ({ ...prev, [job_id]: false }));
  }, 15000);
};

 const navigateToJobForApprove = (job_id, viewMode) => {
  //console.log('navigate job to approve');
  //sessionStorage.setItem('approveMode', true);

  //jmp:1234    
  //setTimeout(() => {
  //     setReloadKey(currentPage => currentPage + 1); // เปลี่ยนค่าเพื่อ trigger useEffect ใน useFetchJobs                        
 // }, 5000);


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
          Swal.fire("Deleted!", "Selected jobs have been deleted. " + selectedJobs.length + " items", "success");
          setJobs((prevJobs) =>
            prevJobs.filter((job) => !selectedJobs.includes(job._id))
          );
          setSelectedJobs([]);

            //  setReloadKey(currentPage => currentPage + 1); // เปลี่ยนค่าเพื่อ trigger useEffect ใน useFetchJobs                  
      

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
      //console.log("map job. =>", job); 
      let statusColor = job.STATUS_COLOR;
      // ตรวจสอบค่า Active ตาม STATUS_NAME
      const activeValue =
        job.STATUS_NAME === "complete"
          ? job.createdAt
            ? new Date(job.createdAt).toLocaleString()
            : "Not Active"
          : job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : "Not Active";
      return {
        ...( (user.role === "Admin Group" || user.role === "Owner") && orientation==="landscape" && {
            
          checkbox: (
            <input
              className="w-5 h-5"
              type="checkbox"
              checked={selectedJobs.includes(job._id)}
              onChange={() => handleSelectJob(job._id)}
            />
          ),
        }),
            ID: index + 1         
        ,
        "Checklist Name": job.JOB_NAME,
       "Line Name": {
                  linename: job.LINE_NAME,
                  machine_name: (
                    job.MC_TAG?.MACHINE_NAME && job.MC_TAG?.WD_TAG
                      ? `${job.MC_TAG.MACHINE_NAME} : ${job.MC_TAG.WD_TAG}`
                      : job.MC_TAG?.MACHINE_NAME || job.MC_TAG?.WD_TAG || ""
                  )
                },
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
        "Update": new Date(job.updatedAt).toLocaleString(),
        Action: (
          <div>
            {job.STATUS_NAME === "complete" || job.STATUS_NAME === "waiting for approval" ? (     
                   <div className="flex gap-2 items-center justify-center">
                    {!editBtnDisable && job.STATUS_NAME === "waiting for approval" && ( user.emp_number===job.SUBMITTED_BY.EMP_NUMBER || job.PUBLIC_EDIT_IN_WORKGROUP===true)  ? (
                        <div
                          className={`text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer`}
                          onClick={() => {
                            navigateToJob(job._id, false);
                          }}
                        >
                          Edit
                        </div>                      

                    ):""}
                    {
                      !viewBtnDisable  ? (<div
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                        onClick={() => {
                          navigateToJob(job._id, true);
                        }}
                      >
                        View 
                      </div>
                      ):""  
                    }
                      
                    {  job.APPROVE_ALLOW && (
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
                      //id={'get-'+job._id}
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
    start.setDate(today.getDate() - date_range);
    const end = new Date(today);
    end.setDate(today.getDate() + date_range);

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }, [date_range]);

  return (
    <div className="w-full flex flex-col mt-5">
      <div className="flex flex-wrap mb-4 justify-start items-center gap-4">
      
          <div className="flex flex-row gap-4">
            <div className="flex-2 w-1/2 font-medium text-black ">
                  {/* Pull: */}
            </div>
           <div className="relative w-1/2">
             <label
                htmlFor="startDate"
                className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
              >
                Start Date
              </label>           
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate || ""}
                onChange={handleStartDateChange}
                required
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
              />
             
            </div>

            <div className="relative flex-2 w-1/2" >
              <label
                htmlFor="endDate"
                //className="block text-sm font-medium text-gray-900"
                          className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate || ""}
                onChange={handleEndDateChange}
                //className="bg-white w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        <div className="flex-2">         
        </div>
        <div className="relative flex-1.5">
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
            //className="block text-sm font-medium  text-black"
            className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Profile Groups
          </label>
          <select
            id="profile-group-filter"
            //className="bg-white w-full border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            onChange={(e) => setProfileSelected(e.target.value)}
          >
            <option value="">--------All--------</option>
            {(profiles || []).map((ln) => (
              <option key={ln._id} value={String(ln._id)}>
                {ln.PROFILE_NAME}
              </option>
            ))}
          </select>

        </div>
        
        <div className="relative flex-2">
          {filterStatusDisable==false ? (
            <div>
                <label
                  htmlFor="statusFilter"
                  //className="block text-sm font-medium text-black"
                   className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
                >
                  Filter by Status
                </label>
                <select
                  id="statusFilter"
                  //className="bg-white w-full border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option}
                      defaultValue={jobFileterStatus}
                      //value={option === "All" ? "All" : option.toLowerCase()}
                    >
                      {option}
                    </option>
                  ))}
                </select>
            </div>
          ) : (
            <div></div>
          )}

         

        </div>
      </div>
      { (

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
          handleApproveSelected={handleApproveSelected}
          showApproveAllButton={true}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          setSelectedJobs={setSelectedJobs}
          isLoading={jobsLoading}
          orientation={orientation}
          userRole={user.role}
          callFromApprovePage={callFromApprovePage}
        />

        // <TableComponentAdmin
        //   headers={jobsActiveHeaderAdmin}
        //   datas={jobsActiveBody}
        //   TableName={
        //       <>
        //         Checklist Jobs [{jobsActiveBody.length}
        //         {jobsLoading && <span className="animate-pulse ml-3">..... ⏳</span>}
        //         ]
        //       </>
        //   }
        //   PageSize={5}
        //   searchColumn={"Checklist Name"}
        //   searchColumn1={"Line Name"}
        //   searchHidden={true}
        //   filteredJobs={filteredJobs}
        //   selectedJobs={selectedJobs}
        //   handleDeleteSelected={handleDeleteSelected}
        //   currentPage={currentPage}
        //   onPageChange={(page) => setCurrentPage(page)}
        //   setSelectedJobs={setSelectedJobs}
        //   isLoading={jobsLoading}
        //   orientation={orientation}
        //   userRole={user.role}
        // />
      ) 
      }
    </div>
  );
};

export default JobsTable;
