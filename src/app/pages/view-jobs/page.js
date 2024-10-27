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
  //console.log("use Page view-jobs/page.js");
  const router = useRouter();
  const job_id = searchParams.job_id;
  const [view, setView] = useState(searchParams.view);
  const [refresh, setRefresh] = useState(false);
  const { jobData, jobItems, isLoading, error } = useFetchJobValue(
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
  const [commentDetail, setCommentDetail] = useState(null);
  var [inputValues, setInputValues] = useState([]);
 // const { status } = useFetchStatus(refresh);
  const [machineName, setMachineName] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  // const mqttClient = mqtt.connect(connectUrl, options);
  //const [selectedFile, setSelectedFile] = useState(null);
  const [wdtagImg, setWdtagImg] = useState(null);
  const [preview, setPreview] = useState(null);

  //const [message, setMessage] = useState("");....

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
          if (user.workgroup_id.toString() !== jobData.WorkGroupID.toString()) {
            setView("true");
          } else {
            if (searchParams.view === "false") {
              setView("false");
            }
            if (searchParams.view === "true") {
              setView("true");
            }
          }
        } else {
        }
      }

      // mqttClient.on("connect", () => {});

      // mqttClient.on("error", (err) => {
      //   mqttClient.end();
      // });

      jobItems.forEach((item) => {
        // mqttClient.subscribe(item.JobItemID, (err) => {
        //   if (!err) {
        //   } else {
        //     console.error("Subscription error: ", err);
        //   }
        // });
      });
    };

    asyncEffect();

    return () => {
      // if (mqttClient) {
      //   mqttClient.end();
      // }
    };
  }, [jobItems, user, jobData]);

  useEffect(() => {
    if (view === "false") {
      updateJobStatusToOngoing();
    }
  }, [view]);

  // mqttClient.on("message", (topic, message) => {
  //   document.getElementById(topic.toString()).placeholder = message.toString();
  // });

  const toggleJobInfo = () => {
    setIsShowJobInfo(!isShowJobInfo);
  };

  const handleBeforeValue = (e, item) => {
    const value = e.target.value;
    setInputValues((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.jobItemID === item.JobItemID
      );
      if (existingIndex !== -1) {
        const updatedValues = [...prev];
        updatedValues[existingIndex] = {
          ...updatedValues[existingIndex],
          BeforeValue: value,
        };
        return updatedValues;
      }
      return [
        ...prev,
        {
          ...item,
          jobItemID: item.JobItemID,
          BeforeValue: value,
        },
      ];
    });
  };

  const handleIMGItemChange = ( filePath,item) => {
            const value = filePath;
            for(var t in inputValues){
                  //console.log(inputValues[t]);
                  if (inputValues[t].jobItemID==item.JobItemID) {
                        inputValues[t].IMG_ATTACH=value;
                  }
            }   
  }

  const handleInputChange = (e, item) => {
    //console.log('item ',item);
    const value = e.target.value;
    setInputValues((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.jobItemID === item.JobItemID
      );
      if (existingIndex !== -1) {
        const updatedValues = [...prev];
        updatedValues[existingIndex] = {
          ...updatedValues[existingIndex],
          value: value,
        };
        return updatedValues;
      }
      return [
        ...prev,
        {
          ...item,
          jobItemID: item.JobItemID,
          value: value,
        },
      ];
    });
  };

  var imgItemFileSelected = null;

  // const handleAddImages = (b) => {
  //   imgItemFileSelected = b;
  //   document.getElementById("fileInput-1").click();
  // };
  const handleFileChangeOnItem = (event) => {
    const file = event.target.files[0];
    try {
      document.getElementById("item-img-" + imgItemFileSelected).src =
        URL.createObjectURL(file);
    } catch (error) {}
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const comment = e.target.comment.value;
    setInputValues((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.jobItemID === commentDetail.JobItemID
      );
      if (existingIndex !== -1) {
        const updatedValues = [...prev];
        updatedValues[existingIndex] = {
          ...updatedValues[existingIndex],
          Comment: comment,
        };
        return updatedValues;
      }
      return [
        ...prev,
        {
          ...commentDetail,
          jobItemID: commentDetail.JobItemID,
          Comment: comment,
        },
      ];
    });
    setAddCommentForm(false);
  };

  const toggleJobItem = () => {
    setIsShowJobItem(!isShowJobItem);
  };

  const toggleAddComment = (item) => {
    setCommentDetail(item);
    setAddCommentForm((prev) => !prev);
  };

  // const handleUploadFileToJobItem = (jobItemID) => {
  //       alert('on page handleUploadFileToJobItem');
  // };

  const handleUploadFileToJob = (event) => {
    const file = event.target.files[0];
    //setSelectedFile(file);
    setPreview(URL.createObjectURL(file)); // แสดง preview ของไฟล์

    setTimeout(() => {
      uploadJobPictureToServer(file);
    },10);
  };

  const uploadJobPictureToServer = async (inputFile) => {
   if (!inputFile) {
     alert('Please select a file first.');
     return;
   }
    const formData = new FormData();
    formData.append('file', inputFile);
    formData.append('job_id', jobData.JobID);

      try {
        const res = await fetch('/api/uploadPicture', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json(); // อ่าน response จาก API

      if (data.result) {
        setWdtagImg(data.filePath);
      } else {
        alert('Failed to upload file. Error '+data.error);
      }
    } catch (error) {
      //console.error(error);
      alert('An error occurred while uploading the file.');
    }
  };


  const handleSubmit = async (e) => {
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
        text: "Please fill in the WD Tag.",
        icon: "error",
      });
      return;
    }

    // ตรวจสอบว่า inputValues มีข้อมูลหรือไม่
    if (!Array.isArray(inputValues) || inputValues.length === 0) {
      Swal.fire({
        title: "Error!",
        text: "Please add at least one job item.",
        icon: "error",
      });
      return;
    }

    const jobInfo = {
      JobID: jobData.JobID,
      wd_tag: wdTag,
      submittedBy: user._id,
      wdtagImage: wdtagImg,
    };

   //  console.log("inputValues", inputValues);
   
    const formData = new FormData();
    //formData.append("wdtagPictuer", selectedFile);
    formData.append("jobData", JSON.stringify(jobInfo)); // ใช้ JSON.stringify
    formData.append("jobItemsData", JSON.stringify(inputValues)); // ใช้ inputValues
   
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
        <p><strong>Description&nbsp;:&nbsp;</strong> ${item.description || ''}</p>
        <p><strong>Test Location&nbsp;:&nbsp;</strong> ${item.TestLocationName}</p>
        <p><strong>Test Method&nbsp;:&nbsp;</strong> ${item.TestMethod}</p>
        <div style='padding:10px;'>
          ${item.File ? `<img src="/api/viewItem-template?imgName=${item.File}" alt="${item.File}" style="max-width: 100%; height: auto;" />` : ''}
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
        preview={preview}
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
      {AddCommentForm && (
        <AddCommentModal
          toggleAddComment={toggleAddComment}
          handleSubmitComment={handleSubmitComment}
          commentDetail={commentDetail}
        />
      )}
    </Layout>
  );
};

export default Page;
