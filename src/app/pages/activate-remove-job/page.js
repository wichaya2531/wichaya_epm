"use client";
import Layout from "@/components/Layout.js";
import ReactDOM from "react-dom";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import { getSession } from "@/lib/utils/utils";
import { useEffect, useState } from "react";
import { config } from "@/config/config.js";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import JobPlan from "@/components/JobPlan";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
//import useFetchProfiles from "@/lib/hooks/useFetchProfiles.js";
import Link from "next/link";
import Image from "next/image";
import TableComponentAdmin from "@/components/TableComponentAdmin";
import VerifiedIcon from '@mui/icons-material/Verified';
import DashboardSummary from "@/components/DashboardSummary";

import JobsTable from "@/components/JobsTable";

import SelectContainer from "@/components/SelectContainer.js"; // นำเข้า SelectContainer
import { toggleButtonClasses } from "@mui/material";
import Cookies from "js-cookie";

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

const Page = () => {

  const [refresh, setRefresh] = useState(false);
  const [jobTemplates, setJobTemplates] = useState([]);
  const [session, setSession] = useState({});
  const [user, setUser] = useState({});
  const [userEnableFunctions, setUserEnableFunctions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isShowDetail, setIsShowDetail] = useState(false);
  const [detail, setDetail] = useState({});
  const [isShowPlan, setIsShowPlan] = useState(false);
  const [planData, setPlanData] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPageJob, setCurrentPageJob] = useState(1);
  const [currentPageJobTemplate, setCurrentPageJobTemplate] = useState(1);

  const [showPlanningColumns, setShowPlanningColumns] = useState(false);
  const [viewMode,setviewMode]=useState(false);
  
  //const { profiles, loading: profilesLoading, error: profilesError } = useFetchProfiles(user?.workgroup_id);
  
// ----------------Cookie---------------------
useEffect(() => {
  const v = Cookies.get("manageJobPage_summaryView"); // "true" | "false" | undefined
  setviewMode(v === "true");
}, []);

const handleClickViewMode = (checked) => {
  setviewMode(checked);
  Cookies.set("manageJobPage_summaryView", String(checked), { expires: 365 });
};
// -------------------------------------------



  //-----------MQTT----------------------------------------->>
  const mqttClient = useRef(null);
  useEffect(() => {
    const client = mqtt.connect(connectUrl, options);
    mqttClient.current = client;
  
    const onConnect = () => {
      console.log("✅ MQTT Connected on Page Active Remove Job");
      if (user?.workgroup_id) client.subscribe(user.workgroup_id);
    };
    client.on("connect", onConnect);
    client.on("error", (err) => console.error("❌ MQTT Error:", err));
    client.on("close", () => console.warn("⚠️ MQTT Disconnected"));
    client.on("message", (t, m) => {
       try {
          if (document.getElementById('page-expire').innerHTML==='true'){ 
                      console.log('Block by page expire!!');
                      return;
          }
        } catch (error) {
                console.error("Error Code: 120\n", error?.stack ?? error);
        }     
      console.log("📩", t, m.toString());      
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
  const handleEventToMqtt = useCallback(() => {
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
   //---------------------------------------------------------------->>
    const jobTemplatesHeader = [
      "ID",
      ...(showPlanningColumns ? ["Plan Start", "Plan End"] : []),
      "Checklist Template Name",
      "Version",
      "Line Name",
      "Profile Group",      
      "Action",
    ];

    const jobsHeader = [
      "",
      "ID",
      "Checklist Name",
      "Line Name",
      "Status",
      "Active",
      "Activator",
      "Action",
    ];

    const enabledFunction = {
      "activate-job-template": "66389056d81a314967236e07",
      "remove-job": "6638906bd81a314967236e09",
    };

    const statusOptions = [
      "All",
      "New",
      "Ongoing",
      "Plan",
      "Waiting for approval",
      "Complete",
      "Retake",
      "Overdue",
    ];

   //------------------------------------------------------------------>>
  const [selectedJobs, setSelectedJobs] = useState([]);
  const handleSelectJob = (jobId) => {
    //console.log("Page handleSelectJob");
    setSelectedJobs((prevSelected) =>
          prevSelected.includes(jobId) ? prevSelected.filter((id) => id !== jobId): [...prevSelected, jobId]
    );
  };
  var [allLineName, setAllLineName] = useState(false);

  const filteredJobs =
    jobs &&
    jobs.filter((job) => {
      // Filter by status
      if (
        filterStatus !== "All" &&
        job.STATUS_NAME !== filterStatus.toLowerCase()
      ) {
        return false;
      }
      return true;
    });

  useEffect(() => {
    setAllLineName([]);
    retrieveSession();
  }, [refresh]);

  const retrieveSession = async () => {
    const session = await getSession();
    setSession(session);
    await fetchUser(session.user_id);
    var bufLineName = await fetchLineNames(session);
    //console.log("tt..=>",tt);
    setAllLineName(bufLineName);
    // try {
    //       const lineNamesResponse = await fetch(
    //         "/api/select-line-name/get-line-name"
    //       );
    //       const lineNamesData = await lineNamesResponse.json();
    //       //console.log("lineNamesData.selectLineNames=>", lineNamesData.selectLineNames);
    //       setAllLineName(lineNamesData.selectLineNames.map((line) => line.name));
    // } catch (error) {

    // }
  };

  const fetchLineNames = async (userSession) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userSession.user_id);

      const response = await fetch(`/api/select-line-name/get-line-name`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === 200) {
        //setSelectLineNames(data.selectLineNames);
        //console.log("data.selectLineNames=>", data.selectLineNames);
        //await setAllLineName(data.selectLineNames.map((line) => line.name));
        //console.log("allLineName=>", allLineName);
        return data.selectLineNames.map((line) => line.name);
      } else {
        console.error("Failed to fetch data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching line names.:", error);
    }
    return [];
  };

  const fetchUser = async (user_id) => {
    try {
      const response = await fetch(`/api/user/get-user/${user_id}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUser(data.user);
      setUserEnableFunctions(data.user.actions);
      await fetchJobTemplates(data.user.workgroup_id);
      await fetchJobs(data.user.workgroup_id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchJobTemplates = async (workgroup_id) => {
    try {
      const response = await fetch(
        `/api/workgroup/get-job-templates-from-workgroup/${workgroup_id}`,
        { next: { revalidate: 10 } }
      );
      const data = await response.json();
      if (data.status === 200) {
        setJobTemplates(data.jobTemplates);
      }
      //console.log('active-remove-job template data',data);

    } catch (err) {
       if(process.env.NEXT_PUBLIC_DEBUG=="true"){
            console.log("Error Code : 108");
            console.log("err", err);
       }
    }
    //showInvalidLineNamePopup;
  };

  const onLineNameSelected = async (linenameSelected, dataJobTemplate,event) => {
   // console.log('object',event);
   // return;     
    //console.log("before dataJobTemplate=>", dataJobTemplate);
    dataJobTemplate.LINE_NAME = linenameSelected;
    //console.log("after dataJobTemplate=>", dataJobTemplate);
    Swal.fire({
      title: "Are you sure?",
      html: `
      <div>
        <p>You won't be confirm for this line: <b>${linenameSelected}</b>!</p>
        <label for="jobCountInput">จำนวนงานที่จะเปิด:</label>
        <input id="jobCountInput" type="number" min="1" max="60" value="1" style="width: 100px; margin-top: 8px;" />
      </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, confirm!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
      preConfirm: () => {
      const jobCount = document.getElementById("jobCountInput").value;
      if (!jobCount || jobCount < 1) {
        Swal.showValidationMessage("กรุณากรอกจำนวนงานที่ถูกต้อง (มากกว่า 0)");
        return false;
      }
      return jobCount;
      }
    }).then((result) => {
      if (result.isConfirmed) {
      // เพิ่มจำนวนงานเข้า dataJobTemplate
      dataJobTemplate.jobCount = Number(result.value);
      activateJobProcess(dataJobTemplate);
      try {
        document.getElementById(
        "allLinePanel-" + dataJobTemplate.jobTemplateID
        ).style.display = "none";
      } catch (error) {}
      }
      event.target.value = "";
    });
    
   
        
  

  };

  function toogleAllLinePanel(b) {
    jobTemplates.forEach((element) => {
      if (element._id != b.jobTemplateID) {
        try {
          document.getElementById("allLinePanel-" + element._id).style.display =
            "none";
        } catch (error) {}
      }
    });
    var allLinePanel = document.getElementById(
      "allLinePanel-" + b.jobTemplateID
    );
    if (allLinePanel.style.display === "none") {
      //  var allLinePanel = document.getElementById('allLinePanel-' + b.jobTemplateID);
      if (allLinePanel.style.display === "none") {
        allLinePanel.style.display = "block";
        allLinePanel.style.opacity = 0;
        let opacity = 0;
        const fadeIn = setInterval(() => {
          if (opacity >= 1) {
            clearInterval(fadeIn);
          }
          allLinePanel.style.opacity = opacity;
          opacity += 0.1;
        }, 30);
      } else {
        let opacity = 1;
        const fadeOut = setInterval(() => {
          if (opacity <= 0) {
            clearInterval(fadeOut);
            allLinePanel.style.display = "none";
          }
          allLinePanel.style.opacity = opacity;
          opacity -= 0.1;
        }, 30);
      }
    } else {
      allLinePanel.style.display = "none";
    }
  }

  const handleActivate = async (jobTemplateSelectedFromUser) => {
    if (
      !jobTemplateSelectedFromUser.LINE_NAME ||
      ["N/A", "NA", "na", "n/a", "Na"].includes(
        jobTemplateSelectedFromUser.LINE_NAME
      )
    ) {
      //alert("กรุณาเลือก Line Name");
      toogleAllLinePanel(jobTemplateSelectedFromUser);
      return;
    }
    activateJobProcess(jobTemplateSelectedFromUser);
  };

  const activateJobProcess = async (checkListTemplate) => {
    try {
      const response = await fetch("/api/job/activate-job-template-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          JobTemplateID: checkListTemplate.jobTemplateID,
          JobTemplateCreateID: checkListTemplate.jobTemplateCreateID,
          ACTIVATER_ID: checkListTemplate.ACTIVATER_ID,
          LINE_NAME: checkListTemplate.LINE_NAME,
          jobCount: checkListTemplate.jobCount || 1, // จำนวนงานที่จะเปิด (ถ้าไม่มีให้เป็น 1)
        }),
      });
      const responseData = await response.json();

      //console.log(  "responseData after active jobs=>",responseData);
      if (responseData.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "The checklist template has been successfully activated",
          confirmButtonText: "OK",
        }).then(async () => {
               // ดึงข้อมูล jobs ใหม่
                //await fetchJobs(user.workgroup_id);
                //setRefresh(true);
                setRefresh((prev) => !prev);
                handleEventToMqtt();
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to activate the checklist template",
        confirmButtonText: "OK",
      });
    }
  };

  // const showInvalidLineNamePopup = (validLineNames, requestData) => {
  //   let selectedValue = null;
  //   const customSelectStyles = () => ({
  //     control: (base) => ({
  //       ...base,
  //       width: "400px",
  //       padding: "8px",
  //       borderRadius: "4px",
  //       border: "1px solid #ccc",
  //       boxShadow: "none",
  //       "&:hover": {
  //         borderColor: "#999",
  //       },
  //       height: "50px",
  //     }),
  //     menu: (base) => ({
  //       ...base,
  //       zIndex: 9999, // เพิ่มค่า z-index ให้สูงกว่า SweetAlert
  //       maxHeight: "400px",
  //       overflowY: "auto", // เพิ่มการเลื่อนแนวตั้งเมื่อมีตัวเลือกเยอะ
  //     }),
  //     option: (base, { isFocused }) => ({
  //       ...base,
  //       padding: "10px",
  //       backgroundColor: isFocused ? "#f0f0f0" : "#fff", // เปลี่ยนสีเมื่อเลือก
  //       cursor: "pointer",
  //     }),
  //   });

  //   const selectContainer = document.createElement('div'); // ประกาศ selectContainer
  //   selectContainer.id = 'select-container';
  //   document.body.appendChild(selectContainer);  // เพิ่มเข้าไปใน document.body

  //   // เปิด SweetAlert popup
  //   Swal.fire({
  //     title: "",
  //     html: "<div id='label-tag' style='height:50px;'></div>",
  //     showCancelButton: true,
  //     confirmButtonText: "ส่ง",
  //     cancelButtonText: "ยกเลิก",
  //     allowOutsideClick: false,
  //     heightAuto: false,
  //     preConfirm: () => {
  //       if (selectedValue) {
  //         return selectedValue;
  //       }
  //       Swal.showValidationMessage("กรุณาเลือกชื่อ line name");
  //       return false;
  //     },
  //     willOpen: () => {
  //       // เรนเดอร์ SelectContainer ลงใน selectContainer ที่ถูกสร้างใน document.body
  //       const popup = Swal.getPopup();  // ดึง DOM ของ SweetAlert
  //       const rect = popup.getBoundingClientRect();
  //       const x = rect.left + window.scrollX;  // ตำแหน่ง X ของ SweetAlert
  //       const y = rect.top + window.scrollY;   // ตำแหน่ง Y ของ SweetAlert

  //       ReactDOM.render(
  //         <SelectContainer
  //           validLineNames={validLineNames}
  //           onSelect={(value) => selectedValue = value}
  //           position={{ x, y }}  // ส่งตำแหน่ง x, y ไปยัง SelectContainer

  //         />,
  //         selectContainer,  // เรนเดอร์ SelectContainer ใน selectContainer
  //         () => {
  //           // Callback function นี้จะถูกเรียกเมื่อการเรนเดอร์เสร็จสมบูรณ์
  //              // console.log('SelectContainer has been rendered');
  //              setTimeout(() => {
  //                     var labelTag = document.getElementById('label-tag');

  //                     const labelTagRect = labelTag.getBoundingClientRect();
  //                     const labelTagTop = labelTagRect.top + window.scrollY;
  //                     const labelTagLeft = labelTagRect.left + window.scrollX;
  //                     //console.log("Label Tag Position - Top:", labelTagTop, "Left:", labelTagLeft);
  //                     try {
  //                             var lineElement=document.getElementById('select-container-1');
  //                             lineElement.style.top = labelTagTop + 'px';
  //                             lineElement.style.left = labelTagLeft + 'px';
  //                     } catch (error) {

  //                     }
  //               }, 20);

  //         }

  //       );

  //     },
  //     willClose: () => {
  //       // ลบ SelectContainer ออกจาก DOM เมื่อ SweetAlert ปิด
  //       ReactDOM.unmountComponentAtNode(selectContainer);
  //       document.body.removeChild(selectContainer);
  //     }
  //   }).then((result) => {
  //           if (result.isConfirmed) {
  //             // ส่งค่า line name ใหม่ไปที่ API
  //             handleSubmitWithNewLineName(selectedValue, requestData);
  //           }
  //   });

  // };

  // ฟังก์ชันสำหรับการส่งค่า line name ใหม่
  // const handleSubmitWithNewLineName = async (newLineName, requestData) => {
  //   const data = {
  //     JobTemplateID: requestData.jobTemplateID,
  //     ACTIVATER_ID: requestData.ACTIVATER_ID,
  //     JobTemplateCreateID: requestData.jobTemplateCreateID,
  //     LINE_NAME: newLineName, // ส่งค่า line name ใหม่
  //   };

  //   try {
  //     const res = await fetch("/api/job/activate-job-template-manual-new", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     const response = await res.json();
  //     if (response.status === 200) {
  //       Swal.fire({
  //         title: "สำเร็จ!",
  //         text: "สร้าง job ใหม่เรียบร้อยแล้ว!",
  //         icon: "success",
  //         confirmButtonText: "ตกลง",
  //       }).then(() => {
  //         // อัปเดตข้อมูล jobTemplates และ jobs โดยไม่ต้องรีเฟรชหน้า
  //         setRefresh((prev) => !prev);
  //       });
  //     } else {
  //       Swal.fire({
  //         title: "เกิดข้อผิดพลาด",
  //         text: response.error || "ไม่สามารถสร้าง job ใหม่ได้",
  //         icon: "error",
  //         confirmButtonText: "ตกลง",
  //       });
  //     }
  //   } catch (error) {
  //     Swal.fire({
  //       title: "Oops...",
  //       text: error.message,
  //       icon: "error",
  //       confirmButtonText: "ตกลง",
  //     });
  //   }
  // };

  const handlePlan = (data) => {
    setPlanData(data);
    setIsShowPlan((prev) => !prev);
  };
  const handleSelectProfileGroup = (value) => {
    //setPlanData(data);
    //setIsShowPlan((prev) => !prev);
    alert('handleSelectProfileGroup',value); 
  };


  // const fetchJobs = async (workgroup_id) => {
  //           setJobs([]);  
  //             const fetchStream = async (workgroup_id) => {
  //               const res = await fetch(`/api/job/get-jobs-from-workgroup/${workgroup_id}`);
  //               const reader = res.body?.getReader();
  //               const decoder = new TextDecoder();
  //               let buffer = '';
            
  //               if (!reader) return;
            
  //               while (true) {
  //                 const { value, done } = await reader.read();
  //                 if (done) break;
            
  //                 buffer += decoder.decode(value, { stream: true });
            
  //                 let boundary;
  //                 while ((boundary = buffer.indexOf('\n')) >= 0) {
  //                   const chunk = buffer.slice(0, boundary).trim();
  //                   buffer = buffer.slice(boundary + 1);
            
  //                   if (chunk) {
  //                     try {
  //                       const data = JSON.parse(chunk);
  //                       //console.log('📦 ได้ข้อมูล:', data);
  //                       if (Array.isArray(data)) {
                          
  //                         setJobs(prev => [...prev, ...data]);
  //                       }
            
  //                     } catch (err) {
  //                       //console.error('❌ JSON parse error:', err, chunk);
  //                     }
  //                   }
  //                 }
  //               }
  //             };
             
  //             fetchStream(workgroup_id);

  // };





  const handleRemove = async (job_id) => {
 
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: true,
    });

    swalWithBootstrapButtons
      .fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/api/job/remove-job`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ job_ids: [job_id] }), // ✅ ส่งเป็น array เสมอ
            });

            const data = await response.json();
            if (data.status === 200) {
              swalWithBootstrapButtons.fire({
                title: "Deleted!",
                text: "Your job has been deleted.",
                icon: "success",
              });
              setRefresh((prev) => !prev);
            } else {
              swalWithBootstrapButtons.fire({
                title: "Error!",
                text: data.error || "Failed to delete job.",
                icon: "error",
              });
            }
          } catch (error) {
            console.error("Error deleting job:", error);
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your job is safe :)",
            icon: "error",
          });
        }
      });
  };

  // ฟังก์ชันลบงานที่เลือก
  const handleDeleteSelected = async () => {
    // alert('handleDeleteSelected');   


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

   //console.log("selectedJobs",selectedJobs);

    //return;
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
        } else {
          Swal.fire(
            "Error!",
            result.error || "Failed to delete jobs.",
            "error"
          );
        }
      } catch (err) {
         if(process.env.NEXT_PUBLIC_DEBUG=="true"){
              console.error(err);
              console.log("Error Code : 109");
         }
        Swal.fire("Error!", "Failed to delete jobs.", "error");
      }
    }
  };



  const jobTemplatesBody = jobTemplates.map((jobTemplate, index) => {
    const data = {
      jobTemplateID: jobTemplate._id,
      jobTemplateName:jobTemplate.JOB_TEMPLATE_NAME,
      jobTemplateCreateID: jobTemplate.JobTemplateCreateID,
      ACTIVATER_ID: user._id,
      LINE_NAME: jobTemplate.LINE_NAME,     
    };

    //console.log("allLineNamev=>", allLineName);
    // console.log("jobTemplate=>", jobTemplate);
    const planStart =jobTemplate.onPlanStatus.start ?  new Date(jobTemplate.onPlanStatus.start).toISOString().split('T')[0] : "";
    const planEnd = jobTemplate.onPlanStatus.end ? new Date(jobTemplate.onPlanStatus.end).toISOString().split('T')[0] : "";


    const baseRow = {
      ID: index + 1,
      ...(showPlanningColumns
    ? {
        "Plan Start": planStart,
        "Plan End": planEnd,
      }
    : {}),
      "Checklist Template Name": jobTemplate.JOB_TEMPLATE_NAME,
      "Version":jobTemplate.CHECKLIST_VERSION,
      "Line Name": jobTemplate.LINE_NAME,
      //"Create At": jobTemplate.createdAt,
      "Profile Group":jobTemplate?.PROFILE_GROUP||"Unknow",
      Action: (
        <div
          className="flex gap-1 items-center justify-center"
          style={{ border: "1px solid none" }}
        >
          <div style={{ border: "1px solid none" }}>
            <div className="py-3 inline-block">
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded "
                onClick={() => handlePlan(data)}
                disabled={
                  !userEnableFunctions.some(
                    (action) =>
                      action._id === enabledFunction["activate-job-template"]
                  )
                }
                style={{
                  cursor: !userEnableFunctions.some(
                    (action) =>
                      action._id === enabledFunction["activate-job-template"]
                  )
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Plan
              </button>
            </div>
            &nbsp;&nbsp;
            <button
              className="bg-orange-500 hover:bg-orange-700 text-white font-semibold py-2 px-2 rounded"
              onClick={() => handleActivate(data)}
              disabled={
                !userEnableFunctions.some(
                  (action) =>
                    action._id === enabledFunction["activate-job-template"]
                )
              }
              style={{
                cursor: !userEnableFunctions.some(
                  (action) =>
                    action._id === enabledFunction["activate-job-template"]
                )
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Activate
            </button>
            &nbsp;&nbsp;
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-2 rounded"
              onClick={() => handleViewDetial(data)}
              disabled={
                !userEnableFunctions.some(
                  (action) =>
                    action._id === enabledFunction["activate-job-template"]
                )
              }
              style={{
                cursor: !userEnableFunctions.some(
                  (action) =>
                    action._id === enabledFunction["activate-job-template"]
                )
                  ? "not-allowed"
                  : "pointer",
                display: "none",
              }}
            >
              details
            </button>
            <div
              id={"allLinePanel-" + data.jobTemplateID}
              style={{ display: "none" }}
            >
              <center style={{ padding: "5px", border: "1px solid none" }}>
                <select                  
                  onChange={(event) =>
                    onLineNameSelected(event.target.value, data,event)
                  }
                  style={{ padding: "10px" }}
                >
                  <option value="">Select Line</option>{" "}
                  {/* Option เริ่มต้น */}
                  {allLineName.map((lineName) => (
                    <option key={lineName} value={lineName}>
                      {lineName}
                    </option>
                  ))}
                </select>
              </center>
            </div>
          </div>
        </div>
      ),
    };



    return baseRow;

  });
  //console.log("----------------------------------------------------------");
  const jobsBody =
    filteredJobs &&
    filteredJobs.map((job, index) => {

      //console.log('job',job);  

      return {
        checkbox: (
          <input
            type="checkbox"
            checked={selectedJobs.includes(job._id)}
            onChange={() => handleSelectJob(job._id)}
          />
        ),
        ID: index + 1,
        "Checklist Name": job.JOB_NAME,
        "Line Name": job.LINE_NAME,
        Status: (
          <div
            style={{ backgroundColor: job.STATUS_COLOR ,position:'relative'}}
           // className="px-4 text-[12px] font-bold py-1 rounded-full text-white shadow-xl ipadmini:text-sm whitespace-nowrap overflow-hidden text-ellipsis select-none"
             className="py-1 select-none rounded-2xl text-white font-bold shadow-xl text-[12px] ipadmini:text-sm flex justify-center items-center px-5"
          >
          {job.STATUS_NAME ? job.STATUS_NAME : "pending"}&nbsp;&nbsp;&nbsp;{  
                (job.IMAGE_FILENAME || job.IMAGE_FILENAME_2)?(
                  <div style={{position:'absolute',right:'1px'}}> 
                         <VerifiedIcon color="white"  />
                  </div>                  
                ):""
              }
          </div>
        ),

        Active: job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : "Not Active",
        Activator: job.ACTIVATER_NAME,
        Action: (
          //check permission
          <div className="flex gap-2 items-center justify-center">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded"
              onClick={() => handleRemove(job._id)}
              disabled={
                !userEnableFunctions.some(
                  (action) => action._id === enabledFunction["remove-job"]
                )
              }
              style={{
                cursor: !userEnableFunctions.some(
                  (action) => action._id === enabledFunction["remove-job"]
                )
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ),
      };
    });

  const ShowDetailModal = ({ onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
      const input = document.getElementById("npm-install");
      input.select();
      document.execCommand("copy");
      setIsCopied(true);

      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    };

    // Disable background scrolling when modal is open
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }, []);

    return (
      <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 ">
        <div className="bg-white p-5 rounded-lg w-2/3  flex flex-col gap-6 relative">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Detail</h1>
            <h2 className="text-sm text-secondary">
              To activate through third-party, you need to send a GET request
              with the following pattern:
            </h2>
            <div className="grid grid-cols-8 gap-2 w-full max-w-[23rem]">
              <label htmlFor="npm-install" className="sr-only">
                Label
              </label>
              <input
                id="npm-install"
                type="text"
                className="col-span-6 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={detail.link}
                readOnly
              />
              <button
                onClick={copyToClipboard}
                className="col-span-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 items-center inline-flex justify-center"
              >
                <span>{isCopied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
          <button
            className="bg-red-700 text-white font-bold py-2 px-4 self-end absolute top-0 right-0 hover:bg-red-800 shadow-lg rounded-sm"
            onClick={() => setIsShowDetail(false)} // Close modal on button click
          >
            <CloseIcon className="size-18" />
          </button>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">How to retrieve the Data ?</h1>
            <p className="text-sm text-secondary">
              You can use the following URL pattern followed by the Checklist ID
              that was sent to you after activation through the above URL.
            </p>
            <p className="text-sm text-black bg-gray-300 p-2 font-bold">
              Example:{" "}
              {`http://10.171.134.51:3000/api/job/get-job-value?job_id=job_id`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleViewDetial = (data) => {
    //console.log(data);
    //&LineName=${data.LINE_NAME}
    const link = `${config.host_link}/api/job/activate-job-template-third-party?jobTemID=${data.jobTemplateID}&actID=${data.ACTIVATER_ID}&jobTemCreateID=${data.jobTemplateCreateID}`;
    setDetail(() => ({
      link: link,
    }));
    setIsShowDetail(true);
  };

  const handleOnpageChange = (page) => {
    jobTemplates.forEach((element) => {
      try {
        document.getElementById("allLinePanel-" + element._id).style.display =
          "none";
      } catch (error) {}
    });
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-5">
      <h1 className="text-3xl font-bold text-primary flex items-center mb-4 p-4 bg-white rounded-xl">
        <Link href="/pages/job-manage">
          <ArrowBackIosNewIcon />
        </Link>
        <Image
          src="/assets/card-logo/management.png"
          alt="wd logo"
          width={50}
          height={50}
        />
        WorkGroup: {user?.workgroup}{" "}
      </h1>
      <div className="mb-4 p-2 bg-white rounded-xl" style={{position:'relative'}}>
        <h1 className="text-2xl font-bold">Checklist Templates</h1> 
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  
           <label className="inline-flex items-center space-x-2 select-none "
              style={{position:'absolute',right:'5px',top:'5px'}}
           >
              <label
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium 
                            text-gray-700 bg-blue-100 cursor-pointer select-none
                            hover:bg-blue-500 hover:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-400
                            active:scale-95 transition-all duration-150 shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={showPlanningColumns}
                    onChange={() => setShowPlanningColumns(!showPlanningColumns)}
                    className="hidden"
                  />
                  <span className="ml-2">Columns Plan</span>
                </label>

             
             </label>   
        <TableComponent
          headers={jobTemplatesHeader}
          datas={jobTemplatesBody}
          TableName="Checklist Templates"
          searchColumn="Checklist Template Name"
          filterColumn="Line Name"
          filterColumn1="Profile Group"
          //onPageChange={handleOnpageChange}
          handleSelectProfileGroup={handleSelectProfileGroup}
          onPageChange={(page) => setCurrentPageJobTemplate(page)}
          currentPage={currentPageJobTemplate}
        />
      </div>
      
      <div className="mb-4 p-4 bg-white rounded-xl">
      <span>
                <label htmlFor="summaryView" style={{ paddingRight: "5px", cursor: "pointer" }}>
                  Summary View&nbsp;:
                </label>
                &nbsp;&nbsp;
                <input
                  id="summaryView"                     // ✅ ใช้ id เพื่อเชื่อมกับ label
                  type="checkbox"
                  checked={viewMode}
                  onChange={(e) => handleClickViewMode(e.target.checked)}
                  style={{
                    transform: "scale(1.8)",
                    padding: "10px",
                    cursor: "pointer",
                  }}
                />
          </span>     
         {viewMode===true ? (
            <div className="flex flex-col gap-5 w-full text-sm font-thin bg-white rounded-xl p-4">
              <DashboardSummary refresh={refresh} />
            </div>
          ) : (
            <div className="flex flex-col gap-5 w-full text-sm font-thin bg-white rounded-xl p-4">
              <JobsTable
                  refresh={refresh} 
                  handleEventToMqtt={handleEventToMqtt}
              />
              
            </div>
          )} 

      </div>
      {isShowDetail && <ShowDetailModal />}
      {isShowPlan && (
        <JobPlan
          data={planData}
          onClose={() => setIsShowPlan(false)} // Close modal handler
          setRefresh={setRefresh}
          handleEventToMqtt={handleEventToMqtt}
        />
      )}
    </Layout>
  );
};

export default Page;
