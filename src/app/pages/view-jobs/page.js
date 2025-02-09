"use client";
import Layout from "@/components/Layout.js";
import useFetchJobValue from "@/lib/hooks/useFetchJobValue";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import useFetchStatus from "@/lib/hooks/useFetchStatus";
import useFetchMachines from "@/lib/hooks/useFetchMachines";
import TestMethodDescriptionModal from "@/components/TestMethodDescriptionModal";
import ItemInformationModal from "@/components/ItemInformationModal";
import AddCommentModal from "@/components/AddCommentModal";
import { useRouter } from "next/navigation";
import JobForm from "./JobForm";
import mqtt from "mqtt";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import { setTime } from "@syncfusion/ej2-react-schedule";
import { set } from "mongoose";
// import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
// import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
// import InfoIcon from "@mui/icons-material/Info";
// import Select from "react-select";
// import CameraAltIcon from "@mui/icons-material/CameraAlt";

const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
  username: process.env.NEXT_PUBLIC_MQT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
};

const Page = ({ searchParams }) => {
  const router = useRouter();
  const job_id = searchParams.job_id;
  const [view, setView] = useState(false);
  //var view = searchParams.view;  
  //console.log("use Page view-jobs/page.js ",searchParams.view);
  //console.log("process.env.NEXT_PUBLIC_MQT_USERNAME",connectUrl);

  const [refresh, setRefresh] = useState(false);
  var { jobData, jobItems, isLoading, error } = useFetchJobValue(
    job_id,
    refresh
  );
  const {
    machines,
    isLoading: machinesLoading,
    error: machinesError,
  } = useFetchMachines();
  const { user } = useFetchUser(refresh);
  const [isShowJobInfo, setIsShowJobInfo] = useState(true);
  const [isShowJobItem, setIsShowJobItem] = useState(true);
  const [jobItemDetail, setJobItemDetail] = useState(null);
  const [testMethodDescription, setTestMethodDescription] = useState(null);
  const [AddCommentForm, setAddCommentForm] = useState(false);
  var [commentDetail, setCommentDetail] = useState(null);
  // let [inputValues, setInputValues] = useState([]);
  // const { status } = useFetchStatus(refresh);
  const [machineName, setMachineName] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
   const mqttClient = mqtt.connect(connectUrl, options);
  //const [selectedFile, setSelectedFile] = useState(null);
  const [wdtagImg_1, setWdtagImg_1] = useState(null);
  const [wdtagImg_2, setWdtagImg_2] = useState(null);
  const [preview_1, setPreview_1] = useState(null);
  const [preview_2, setPreview_2] = useState(null);

  //const [message, setMessage] = useState("");....

  const handleShowComment = (item) => {
    //console.log("jobForm item=>",item);

    Swal.fire({
      title: "Comment",
      text: item.Comment || "No comment available",
      icon: "info",
      confirmButtonText: "Close",
    });
  };

  const handleToShowOnClick = (item) => {
    Swal.fire({
      title: item.title,
      html: `<img src="${item}" alt="${item}" style="max-width: 100%; height: auto;" />`,
      confirmButtonText: "OK",
      width: "auto",
      height: "80%",
    });
  };

  const updateJobStatusToOngoing = async () => {
    const body = {
      JOB_ID: job_id,
    };
    try {
      const response = await fetch(`/api/job/update-job-status/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 10 },
      });

      if (!response.ok) {
        console.log("Error:", response.statusText);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    const asyncEffect = async () => {
      // console.log("jobData", jobData);

      if (user && jobData) {
        // Ensure both user.workgroup_id and jobData.WorkGroupID are defined
        if (user.workgroup_id && jobData.WorkGroupID) {
          //console.log("searchParams.view=="+searchParams.view);
          //setView(false);
          const viewMode = sessionStorage.getItem("viewMode");
          if (user.workgroup_id.toString() !== jobData.WorkGroupID.toString()) {
              //console.log("A");
              setView(true);
              //setView("true");
          } else {
            if (viewMode === "false") {
              //setView("false");
              setView(false);
              try{
                updateJobStatusToOngoing();
              }catch(err){}
              
              //console.log("B");
            }
            if (viewMode === "true") {
              //setView("true");
              setView(true);
              //console.log("C");
            }
          }
        } else {
        }
      }

      mqttClient.on("connect", () => {});
      mqttClient.on("error", (err) => {
        mqttClient.end();
      });

      jobItems.forEach((item) => {
        //console.log("mqttClient item ",item);
        mqttClient.subscribe(item.JobItemTemplateMqtt /*item.JobItemID*/, (err) => {
          if (!err) {
          } else {
            console.error("Subscription error: ", err);
          }
        });

      });
    };

    asyncEffect();

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [jobItems, user, jobData]);

  // useEffect(() => {
  //   if (view === "false") {
             
  //   }
  // }, [view]);
  
  mqttClient.on("message", (topic, message) => {
    jobItems.forEach(element => {
          if (element.JobItemTemplateMqtt==topic) {
             try{
                  document.getElementById(element.JobItemID.toString()).placeholder = message.toString();
             }catch(err){
             
             } 
          
          }
    });
    
  });

  const toggleJobInfo = () => {
    setIsShowJobInfo(!isShowJobInfo);
  };

  const handleIMGItemChange = (filePath, item) => {
    const value = filePath;

    for (var t in jobItems) {
      if (jobItems[t].JobItemID == item.JobItemID) {
        jobItems[t].IMG_ATTACH = value;
      }
    }
  };

  const handleInputChange = (e, item) => {
    //console.log('item ',item);

    for (var t in jobItems) {
      if (jobItems[t].JobItemID == item.JobItemID) {
        jobItems[t].value = e.target.value;
      }
    }
  };

  const toggleJobItem = () => {
    setIsShowJobItem(!isShowJobItem);
  };

  const toggleAddComment = (item) => {
    Swal.fire({
      title: "Add Comment to " + item.JobItemName,
      html:
        `<textarea id="comment" class="swal2-textarea" placeholder="Enter your comment">` +
        item.Comment +
        `</textarea>`,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const comment = Swal.getPopup().querySelector("#comment").value;
        if (!comment) {
          Swal.showValidationMessage("Please enter a comment");
        }
        return comment;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        for (var t in jobItems) {
          if (jobItems[t].JobItemID === item.JobItemID) {
            jobItems[t].Comment = result.value;
          }
        }
      }
    });
  };

  const handleUploadFileToJob = (files,event) => {
   console.log("event",event);

    const file =files ;//event.target.files[0];
    //setSelectedFile(file);
    if(event=="fileInput-1"){
      setPreview_1(URL.createObjectURL(file)); // แสดง preview ของไฟล์
    }else if(event=="fileInput-2"){
      setPreview_2(URL.createObjectURL(file)); // แสดง preview ของไฟล์
    }
    

    setTimeout(() => {
      uploadJobPictureToServer(file,event);
    }, 10);
  };

  const uploadJobPictureToServer = async (inputFile,selector) => {
    if (!inputFile) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("job_id", jobData.JobID);

    try {
      const res = await fetch("/api/uploadPicture", {
        method: "POST",
        body: formData,
      });

      const data = await res.json(); // อ่าน response จาก API

      if (data.result) {
        if(selector=="fileInput-1"){
          setWdtagImg_1(data.filePath);
        }else if(selector=="fileInput-2"){
          setWdtagImg_2(data.filePath);
        }

        
      } else {
        alert("Failed to upload file. Error " + data.error);
      }
    } catch (error) {
      //console.error(error);
      alert("An error occurred while uploading the file.");
    }
  };

  const handleBeforeValue = (e, item) => {
    const value = e.target.value.trim(); // ลบช่องว่างออกจากค่าที่กรอก

    // ตรวจสอบว่าเมื่อผู้ใช้ไม่กรอกค่า (ช่องว่างหรือค่าว่างเปล่า), จะตั้งค่า BeforeValue2 เป็น ""
    for (let t in jobItems) {
      if (jobItems[t].JobItemID === item.JobItemID) {
        // ถ้าค่าในช่องว่างหรือลบออกหมด ให้ตั้งค่า BeforeValue เป็น ""
        jobItems[t].BeforeValue2 = value === "" ? "" : value; // กำหนดค่าใหม่ให้ BeforeValue2
      }
    }

    // ตรวจสอบค่าที่อัปเดต
    console.log("Updated jobItems:", jobItems);
  };

  const handleSubmit = async (e) => {
    //alert('On Submit');
    e.preventDefault();

    const wdTag = e.target.wd_tag.value.trim(); // ตัดช่องว่าง

    // ตรวจสอบว่า jobData มีข้อมูลหรือไม่
    if (!jobData || !jobData.JobID) {
      Swal.fire({
        title: "Error!",
        text: "Job data is missing or invalid.",
        icon: "error",
      });
      return;
    }

    // ตรวจสอบว่า wd_tag ไม่ว่างเปล่า
    if (!wdTag) {
      Swal.fire({
        title: "Error!",
        text: "Please fill in the WD Tag / Machine ID.",
        icon: "error",
      });
      return;
    }


    //console.log("wdtagImg_1",wdtagImg_1);
    
   if(jobData.IMAGE_FILENAME_2 && jobData.IMAGE_FILENAME){
          // มี Attach ไฟล์ อยู่แล้ว  
          //console.log("jobData.IMAGE_FILENAME 1,2 A");
   }else{
           // ไม่มี Attach ไฟล์ 
          console.log("jobData.IMAGE_FILENAME 1,2 B");
          if (jobData.PICTURE_EVEDENT_REQUIRE===true && (wdtagImg_1==null || wdtagImg_2==null) ) {
            Swal.fire({
              title: "Error!",
              text: "Please upload Evident picture.",
              icon: "error",
            });
            return;
          }
   }   


    


   // return ;

    // ตรวจสอบว่า inputValues มีข้อมูลหรือไม่
    // if (!Array.isArray(inputValues) || inputValues.length === 0) {
    //   Swal.fire({
    //     title: "Error!",
    //     text: "Please add at least one job item.",
    //     icon: "error",
    //   });
    //   return;
    // }

    const jobInfo = {
      JobID: jobData.JobID,
      wd_tag: wdTag,
      submittedBy: user._id,
      wdtagImage_1: wdtagImg_1,
      wdtagImage_2: wdtagImg_2,
    };

    const formData = new FormData();
    //formData.append("wdtagPictuer", selectedFile);
    formData.append("jobData", JSON.stringify(jobInfo)); // ใช้ JSON.stringify
    formData.append("jobItemsData", JSON.stringify(jobItems)); // ใช้ inputValues

    try {
      const response = await fetch("/api/job/update-job", {
        method: "POST",
        body: formData, // ส่งข้อมูลในรูปแบบ FormData
      });

      // เช็คสถานะการตอบกลับ
      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire({
          title: "Error!",
          text: errorData.message || "An error occurred.",
          icon: "error",
        });
        return;
      }

      const data = await response.json();
      if (data.status === 455) {
        Swal.fire({
          title: "Error!",
          text: data.message,
          icon: "error",
        });
      } else {
        Swal.fire({
          title: "Success!",
          text: "Checklist updated successfully!",
          icon: "success",
        }).then(() => {
          window.history.replaceState({}, "", "/pages/dashboard");
          if (router) {
            router.push("/pages/dashboard");
          }
        });
        e.target.reset();
        //setRefresh((prev) => !prev);
        setTimeout(() => {
          router.push("/pages/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating the checklist.",
        icon: "error",
      });
    }
  };

  const handleShowTestMethodDescription = (item) => {
    Swal.fire({
      title: item.JobItemName,
      html: `<div style="text-align:left;">
        <p><strong>Description&nbsp;:&nbsp;</strong> ${
          item.description || ""
        }</p>
        <p><strong>Test Location&nbsp;:&nbsp;</strong> ${
          item.TestLocationName
        }</p>
        <p><strong>Test Method&nbsp;:&nbsp;</strong> ${item.TestMethod}</p>
        <div style='padding:10px;'>
          ${
            item.File
              ? `<img src="/api/viewItem-template?imgName=${item.File}" alt="${item.File}" style="max-width: 100%; height: auto;" />`
              : ""
          }
        </div>
      </div>`,
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleShowJobItemDescription = (item) => {
    setJobItemDetail(item);
  };

  const handleWdChange = (selectedOption) => {
    const wd_tag = selectedOption.value;
    machines.forEach((machine) => {
      if (machine.wd_tag === wd_tag) {
        setMachineName(machine.name);
      }
    });
  };


  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      {/* <input
        type="file"
        style={{ display: "none" }}
        id="fileInput-1"
        //onChange={handleFileChangeOnItem}
      /> */}
      <JobForm
        jobData={jobData}
        jobItems={jobItems}
        machines={machines}
        machineName={machineName}
        handleInputChange={handleInputChange}
        handleBeforeValue={handleBeforeValue}
        handleWdChange={handleWdChange}
        handleSubmit={handleSubmit}
        handleShowJobItemDescription={handleShowJobItemDescription}
        handleShowTestMethodDescription={handleShowTestMethodDescription}
        toggleJobItem={toggleJobItem}
        isShowJobItem={isShowJobItem}
        toggleJobInfo={toggleJobInfo}
        isShowJobInfo={isShowJobInfo}
        view={view}
        toggleAddComment={toggleAddComment}
        handleUploadFileToJob={handleUploadFileToJob}
        //handleUploadFileToJobItem={handleUploadFileToJobItem}
        onItemImgChange={handleIMGItemChange}
        preview_1={preview_1}
        preview_2={preview_2}

        onclicktoShow={handleToShowOnClick}
      />

      {testMethodDescription && (
        <TestMethodDescriptionModal
          showDetail={showDetail}
          setTestMethodDescription={setTestMethodDescription}
        />
      )}
      {jobItemDetail && (
        <ItemInformationModal
          setJobItemDetail={setJobItemDetail}
          jobItemDetail={jobItemDetail}
        />
      )}
      {AddCommentForm && <div>&nbsp;</div>}
    </Layout>
  );
};

export default Page;
