"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import Select from "react-select";
import { useState,useEffect } from "react";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { blue } from "@mui/material/colors";
import Swal from "sweetalert2";
import ChatIcon from "@mui/icons-material/Chat";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import EditNoteIcon from '@mui/icons-material/EditNote';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HistoryIcon from '@mui/icons-material/History';




const JobForm = ({
  jobData,
  jobItems,
  machines,
  machineName,
  handleInputChange,
  handleBeforeValue,
  handleOptionInputChange,
  handleWdChange,
  handleSubmit,
  handleShowJobItemDescription,
  handleShowTestMethodDescription,
  toggleJobItem,
  isShowJobItem,
  toggleJobInfo,
  isShowJobInfo,
  view,
  toggleAddComment,
  handleUploadFileToJob,
  onItemImgChange,
  //handleUploadFileToJobItem,
  preview_1,
  preview_2,
  onclicktoShow,
  machineAsLinename,
  user
}) => {

console.log('jobItems',jobItems); // jmp:1234

const [isMenuVisible, setIsMenuVisible] = useState(false);

  const [rotation, setRotation] = useState(0);
  const toggleMenu = () => {
    setIsMenuVisible((prev) => !prev);
    setRotation((prev) => prev + 90); // เพิ่มรอบละ 360°
  };

 const autoFullItems = (dataValue) => {
      toggleMenu();
        //setIsMenuVisible((prev) => !prev);
        //setRotation((prev) => prev + 90); // เพิ่มรอบละ 360°
         jobItems.forEach(element => {
                  //console.log('element',element.JobItemID);
                  try {
                          document.getElementById(element.JobItemID+"/"+jobData.LINE_NAME).value=dataValue;
                  } catch (error) {
                          console.log(error);
                  }  

                  try {
                    handleInputChange({ target: { value: dataValue } }, element);
                  } catch (error) {
                    console.log(error);
                  }
                  
  
          })
      

        // console.log('jobItems',jobItems);
        //   const updatedJobItems = jobItems.map(item => ({
        //     ...item,
        //     ActualValue: "OK"
        //   }));
        //   setJobItems(updatedJobItems); // <- สำคัญ
        //   console.log('jobItems',jobItems);
  };

   
   let imgItemSelectBeforeUpload=0;


  const [showPanel, setShowPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPictureRequired = jobData.PICTURE_EVEDENT_REQUIRE;

  const [showWebcam, setShowWebcam] = useState(false);
  const [previewItemPicture, setPreviewItemPicture] = useState(null);

  var jobItemSelected = null;


const handleToviewApproves = async (jobDataInfo) => {
  //console.log("jobDataInfo.JobID", jobDataInfo.JobID);
          try {
            const response = await fetch(
              `/api/job/get-approves-by-job-id?job_id=${encodeURIComponent(jobDataInfo.JobID)}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                next: { revalidate: 10 },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch roles");
            }

            const responseData = await response.json();
            //console.log("responseData", responseData);

              const tableHtml = `
                <table style="width:100%; border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th style="border-bottom:1px solid #ddd; padding:8px;">Name</th>
                      <th style="border-bottom:1px solid #ddd; padding:8px;">Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${responseData.Approvers
                      .map(
                        (u) => `
                        <tr>
                          <td style="padding:6px; border-bottom:1px solid #eee;"> 👤${u.EMP_NAME}</td>
                          <td style="padding:6px; border-bottom:1px solid #eee;">${u.USERNAME}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              `;
            Swal.fire({
              title: "Approver List",
              html: tableHtml,
              width: 500,
              icon: "info",
              confirmButtonText: "Close",
            });

          } catch (error) {
            console.error("Failed to fetch roles:", error);
          }
};

  const preHandleSubmit = (e) => {
      // ตรวจสอบเงื่อนไขก่อนส่งฟอร์ม
      setIsSubmitting(true);
      handleSubmit(e);
      setTimeout(() => {
            setIsSubmitting(false);
      }, 15000);
  };




  const handleUploadFileToJobItem = (item) => {
    jobItemSelected = item;
    try {
      const fileInput = document.getElementById("item-fileInput");
      fileInput.setAttribute("data-upload-type", "default");
      fileInput.click();
    } catch (error) {}
  };

  const handleUploadFileToJobItemResize = (item,InputSelect) => {
    jobItemSelected = item;
    imgItemSelectBeforeUpload=InputSelect;
    try {
      const fileInput = document.getElementById("item-fileInput");
      fileInput.setAttribute("data-upload-type", "resize");
      fileInput.click();
    } catch (error) {
      console.error(error);
    }
  };

  const handleShowComment = (item) => {
    //console.log("jobForm item=>",item);

    Swal.fire({
      title: "Comment",
      text: item.Comment || "No comment available",
      icon: "info",
      confirmButtonText: "Close",
    });
  };

  const handleGuideItemSelected = (valueItem, item) => {

        // console.log("Line name ",jobData.LINE_NAME);
        // console.log("item",item);


    try {
      document.getElementById(item.JobItemID+"/"+jobData.LINE_NAME).value = valueItem;
    } catch (error) {}

    try {
      handleInputChange({ target: { value: valueItem } }, item);
    } catch (error) {}

    // try {
    //   document.getElementById(
    //     "guide-input-panel-" + item.JobItemID
    //   ).style.display = "none";
    // } catch (error) {}
  };

  const handleHiddenSelectGuideInput = (item) => {
    //console.log("item",item);
    try {
      document.getElementById(
        "guide-input-panel-" + item.JobItemID
      ).style.display = "none";
    } catch (error) {}
  };

  const handleOnFocusItemInput = (item) => {
    //console.log("handleOnFocus ->",item);
    if (item.input_type==="Numeric") {
          return;
    }
    jobItems.forEach((element) => {
      if (element.JobItemID === item.JobItemID) {
        return;
      }
      try {
        document.getElementById(
          "guide-input-panel-" + element.JobItemID
        ).style.display = "none";
      } catch (error) {}
    });

    var toggleInput = document.getElementById(
      "guide-input-panel-" + item.JobItemID
    ).style.display;
    if (toggleInput === "block") {
      document.getElementById(
        "guide-input-panel-" + item.JobItemID
      ).style.display = "none";
    } else {
      document.getElementById(
        "guide-input-panel-" + item.JobItemID
      ).style.display = "block";
    }
  };

  const handleUploadFileToJobItemOnChange = async (event) => {
    const file = event.target.files[0];
    //setPreviewItemPicture(URL.createObjectURL(file)); // แสดง preview ของไฟล์
    //console.log("jobItemSelected",jobItemSelected);
    try {
      document.getElementById(
        "item-img-" + jobItemSelected.JobItemID
      ).style.display = "block";
    } catch (error) {
      console.error(error);
    }
    try {
      var valuePath = await uploadJobItemPictureToServer(file);
      //console.log("imgItemSelectBeforeUpload", imgItemSelectBeforeUpload);
      document.getElementById("item-img-"+imgItemSelectBeforeUpload+"-"+jobItemSelected.JobItemID).src =
        URL.createObjectURL(file);
      document.getElementById("item-img-"+imgItemSelectBeforeUpload+"-"+jobItemSelected.JobItemID).style.display = "block";  
      //console.log("valuePath",valuePath);
      onItemImgChange(valuePath, jobItemSelected,imgItemSelectBeforeUpload);
    } catch (error) {
      alert(error.message);
    }
    //alert(itemIdSelected);
  };

  const uploadJobItemPictureToServer = async (inputFile) => {
    if (!inputFile) {
      alert("Please select a file first.");
      return;
    }

    const uploadType = document
      .getElementById("item-fileInput")
      .getAttribute("data-upload-type");
    const uploadUrl =
      uploadType === "resize"
        ? "/api/uploadPicture/ItemResize"
        : "/api/uploadPicture/Item";

    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("job_item_id", jobItemSelected.JobItemID);

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.result) {
        return data.filePath;
      } else {
        alert("Failed to upload file. Error " + data.error);
      }
    } catch (error) {
      alert("An error occurred while uploading the file." + error.message);
    }
  };

  // const handleCloseWebcam = () => {
  //   //setShowWebcam(false);
  // };

  // console.log("jobData",jobData);

  const colorValues = [
    "Pass",
    "OK",
    "Good",
    "Not Change",
    "Fail",
    "Change",
    "Not Change",
    "Done",
    "Check",
    "Unknown",
  ];
  const getPastelColorForValue = (value) => {
    const colors = new Map([
      ["pass", "rgba(198, 255, 198, 0.6)"],
      ["ok", "rgba(198, 255, 198, 0.6)"],
      ["good", "rgba(204, 229, 255, 0.6)"],
      ["change", "rgba(255, 227, 153, 0.6)"],
      ["not change", "rgba(255, 239, 204, 0.6)"],
      ["fail", "rgba(255, 182, 193, 0.6)"],
      ["done", "rgba(221, 160, 221, 0.6)"],
      ["check", "rgba(255, 255, 204, 0.6)"],
    ]);
    return colors.get(value.toLowerCase()) || "rgba(0, 0, 0, 0)"; // ค่าโปร่งใสสำหรับกรณีอื่น ๆ
  };

    function handleShowHistory(item) {
      const safe = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));

      Swal.fire({
        title: "History",
        html: `
          <div style="text-align:left;font-size:14px;line-height:1.6">
            <div style='display:none;'><b>BeforeValue2:</b> ${safe(item.BeforeValue2)}</div>
            <div><b>BeforeValue:</b> ${safe(item.BeforeValue)}</div>
            <div><b>LastestUpdate:</b> ${safe(item.LastestUpdate)}</div>
          </div>
        `,
        icon: "info",
        showCloseButton: true,
        confirmButtonText: "Close",
        width: 420,
      });
    }
  return (
    <form
      className="flex flex-col gap-8 p-4 bg-white rounded-xl"
      onSubmit={preHandleSubmit}
    >
      <input
        type="file"
        style={{ display: "none" }}
        id="item-fileInput"
        onChange={handleUploadFileToJobItemOnChange}
      />

      <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
        <Link href="/pages/dashboard">
          <ArrowBackIosNewIcon />
        </Link>
        Checklist Header
        {isShowJobInfo ? (
          <ArrowDropUpIcon
            style={{ fontSize: "5rem" }}
            onClick={toggleJobInfo}
          />
        ) : (
          <ArrowDropDownIcon
            style={{ fontSize: "5rem" }}
            onClick={toggleJobInfo}
          />
        )}
      </h1>

      
      <div
        className={`grid grid-cols-4 ipadmini:grid-cols-4 gap-x-6 w-full gap-y-2 ${
          isShowJobInfo ? "" : "hidden"
        }`}
      >
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
             className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Checklist Id
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
             className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.JobID}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
           // className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Checklist Name
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.Name}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Document No.
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.DocumentNo}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Line Name.
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.LINE_NAME}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
           // className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1  
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Checklist Version
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.ChecklistVer}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"  
          >
            Workgroup Name
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.WorkgroupName}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
           // className="text-sm ipadmini:text-md font-bold text-gray-600"
           className="pointer-events-none absolute left-3 bg-white px-1
                       text-gray-500 text-sm transition-all z-10
                       peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                       peer-valid:top-1 peer-valid:text-xs"
          >
            Activated By
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.ActivatedBy}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Submitted By
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.SubmittedBy}
            disabled
          />
        </div>

        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Timeout
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.Timeout}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Activated At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.ActivatedAt}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            LastestUpdate At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.LastestUpdate}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Submitted At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.SubmitedAt}
            disabled
          />
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Status
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.Status}
            disabled
          />
        </div>

        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
            //className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            {/* WD Tag / Machine ID */}
            {process.env.NEXT_PUBLIC_LABEL_WD_TAG}[{machines.length===0?" (No Machine Data)":machines.length}]
          </label>
          {view ? (
            /* view mode และมีข้อมูล WD tag อยู่แล้ว */    
            <input
              type="text"
              id="disabled-input"
              aria-label="disabled input"
              //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
              value={jobData.WD_TAG}
              disabled
            />
          )
          //  : jobData.WD_TAG ? (
          //   /* edit mode และมีข้อมูล WD tag อยู่แล้ว */    
          //   <Select
          //     className="mb-5"
          //     options={machines.map((item) => ({
          //       value: item.wd_tag,
          //       label: item.wd_tag,
          //     }))}
               
          //     onChange={(selectedOption) => handleWdChange(selectedOption)}
          //     name="wd_tag"
          //     placeholder={jobData.WD_TAG}
          //     disabled
          //   />
          // ) 
          : (
            /* edit mode กรณีที่ไม่มี wd tag */    
            <Select
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
              inputId="my-wd-tag-select"   // 👈 ตั้ง id ที่นี่
              options={machines.map((item) => ({
                value: item.wd_tag,
                label: item.wd_tag,
              }))}

               value={{
                 value: machineAsLinename.value, // นี่คือค่าที่คุณ set (string หรือ object)
                 label: machineAsLinename.label,
               }}

              onChange={(selectedOption) => handleWdChange(selectedOption)}
              name="wd_tag"
            />
          )}
        </div>
        <div className="relative flex flex-col">
          <label
            htmlFor="text-input"
           // className="text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            {/* Machine Name */}
            {process.env.NEXT_PUBLIC_LABEL_MACHINE_NAME}
          </label>
          {view ? (
            jobData.MachineName ? (
              <input
                type="text"
                id="disabled-input"
                aria-label="disabled input"
                //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
                value={jobData.MachineName}
                disabled
              />
            ) : (
              <input
                type="text"
                id="disabled-input"
                aria-label="disabled input"
                //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
                value="No Machine Assigned"
                disabled
              />
            )
          ) : (
            <input
              type="text"
              id="disabled-input"
              aria-label="disabled input"
              //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
              value={machineName}
              placeholder={jobData.MachineName}
              disabled
            />
          )}
        </div>



        <div className="flex flex-col">


            {/* ปุ่ม Hide/Unhide */}
            <div
               onClick={() => setShowPanel(!showPanel)}
               className="cursor-pointer w-full border text-right text-sm ipadmini:text-md font-bold text-gray-800 pb-1 cursor-pointer"
               style={{borderRadius:'0.5em'}} 
            >
              Job Evident &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;   {showPanel ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </div>
            <div className={`${showPanel ? "" : "hidden"}`} style={{border:'1px solid none',position:'relative'}}>

                      <div className={`flex flex-col `}
                           style={{border:'1px solid none',position:'relative'}} 
                      >
                        {
                          <label
                            htmlFor="text"
                            className=" text-sm ipadmini:text-md font-bold text-gray-600 "
                          >
                            &nbsp; Sticker Before {" "}
                          </label>
                        }

                        {(
                          <div 
                              className="flex flex-col items-center"
                              style={{position:'absolute',border:'1px solid none',right:'5px'}}
                          >
                            {/* ซ่อน input อัปโหลดไฟล์ */}
                                <input
                                  type="file"
                                  id="fileInput-1"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleUploadFileToJob(e.target.files[0], "fileInput-1")
                                  }
                                  accept="image/*"
                                />

                            {/* ปุ่มอัปโหลดไฟล์ที่ตกแต่ง */}

                            {user.role==="Admin Group"?(
                                  <label
                                        htmlFor="fileInput-1"
                                        className="cursor-pointer"
                                  >
                                    <img
                                      src="/assets/images/image.png"
                                      alt="person"
                                      width={30}
                                      height={30}
                                    />
                                </label>
                            ):""}
                                
                                

                          </div>
                        )}

                        {/* แสดงตัวอย่างรูปภาพถ้ามี */}
                        {preview_1 && (
                          <img src={preview_1} alt="Preview" width={200} className="mt-4" />
                        )}
                        {/*  แสดงตัวอย่างรูปภาพถ้ามี*/}
                        {jobData.IMAGE_FILENAME && (
                          <img
                            src={`/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME} // ใช้เพียงชื่อไฟล์
                            alt="Preview"
                            width={200}
                            className="mt-4"
                            onClick={() =>
                              onclicktoShow(
                                `/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME
                              )
                            }
                          />
                        )}
                      </div>

                      {
                        //-------------------------------------------------------------------------------------------->>
                        <p style={{borderBottom:'2px solid gray',padding:'5px'}}></p>  
                      }    

                        <div className={`flex flex-col`}
                             style={{borderTop:'1px solid none',position:'relative',paddingTop:'5px'}}  
                        >
                          {
                            <label
                              htmlFor="text"
                              className="text-sm ipadmini:text-md font-bold text-gray-600"
                            >
                              &nbsp;  Sticker After{" "}
                            </label>
                          }

                          {(
                            <div className="flex flex-col items-center"
                                style={{position:'absolute',border:'1px solid none',right:'5px'}}
                            >
                              {/* ซ่อน input อัปโหลดไฟล์ */}
                              <input
                                type="file"
                                id="fileInput-2"
                                className="hidden"
                                onChange={(e) =>
                                  handleUploadFileToJob(e.target.files[0], "fileInput-2")
                                }
                                accept="image/*"
                              />

                              {/* ปุ่มอัปโหลดไฟล์ที่ตกแต่ง */}
                                {user.role==="Admin Group"?(
                                    <label
                                      htmlFor="fileInput-2"
                                        className="cursor-pointer"
                                    // className="cursor-pointer bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-1 rounded-lg flex items-center gap-2 focus:ring-4 focus:outline-none"
                                    >
                                        <img
                                          src="/assets/images/image.png"
                                          alt="person"
                                          width={30}
                                          height={30}
                                        />
                                     </label>
                                ):""}
                              
                            </div>
                          )}

                          {/* แสดงตัวอย่างรูปภาพถ้ามี */}
                          {preview_2 && (
                            <img src={preview_2} alt="Preview" width={200} className="mt-4" />
                          )}
                          {/*  แสดงตัวอย่างรูปภาพถ้ามี*/}
                          {jobData.IMAGE_FILENAME_2 && (
                            <img
                              src={`/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME_2} // ใช้เพียงชื่อไฟล์
                              alt="Preview"
                              width={200}
                              className="mt-4"
                              onClick={() =>
                                onclicktoShow(
                                  `/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME_2
                                )
                              }
                            />
                          )}
                        </div>
            </div>
             <div
               className="p-5"
             >
              {
                  jobData.DISAPPROVE_REASON!=""?(<div>
                     <ChatIcon
                        className="text-blue-600 size-8 cursor-default"
                  />
                  {
                    " : "+jobData.DISAPPROVE_REASON
                  }
                  </div>):""

              }
                
            </div> 
        </div>
        <div className="flex flex-col">
            <label
              htmlFor="text-input"
              className="text-sm ipadmini:text-md font-bold text-gray-600"
            >
                   <InfoIcon onClick={() => handleToviewApproves(jobData)} /> Approve By :<a href="#" style={{color:'blue',textDecorationLine:'underline'}}> {jobData.ApproverName||""}</a>
            </label>
        </div>

      </div>
      <hr />
      <div className="flex flex-col gap-2">


        <div style={{position:'relative',border:'1px solid none',display:'inline-block',width:'100%'}}>
              <div style={{position:'relative',border:'1px solid none',display:'inline-block',width:'20em'}}>
                <h1 className="text-2xl font-bold text-primary flex items-center cursor-pointer">
                    Checklist Items
                    {isShowJobItem ? (
                      <ArrowDropUpIcon
                        style={{ fontSize: "5rem" }}
                        onClick={toggleJobItem}
                      />
                    ) : (
                      <ArrowDropDownIcon
                        style={{ fontSize: "5rem" }}
                        onClick={toggleJobItem}
                      />
                    )}
                </h1>          
              </div>   
              { !view && (
                    <div 
                      onClick={toggleMenu}
                      className="absolute right-1 inline-block w-8  hover:border-[3px] hover:border-gradient-to-r hover:from-blue-500 hover:to-cyan-400 transition-transform duration-200 hover:scale-125"              
                    >
                        <AutorenewIcon
                          className="text-black text-[32px] transition-transform duration-[5500ms] ease-in-out"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        />
                    </div>
                  )              
               }           
                    

                    {/* แถบเมนูลับ */}
                    {isMenuVisible && (
                      <div className="absolute top-10 right-0 bg-white border border-green-500 shadow-lg p-4 rounded-lg w-48">
                        <p className="text-sm text-gray-800 border-b border-gray-400 cursor-default">***Fill Items***</p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600 cursor-default">
                         <li onClick={() => autoFullItems("Pass")}
                                className="hover:bg-yellow-100 cursor-pointer px-2 py-1"
                          >⚙️ All "Pass"</li>
                         <li onClick={() => autoFullItems("Line not run")}
                                className="hover:bg-yellow-100 cursor-pointer px-2 py-1"
                          >⚙️ All "Line not run"</li>
                        </ul>
                      </div>
                    )}
        </div>                    
         
      
        <div
          className={`overflow-x-auto ${
            isShowJobItem ? "" : "hidden"
          } flex flex-col gap-1`}
        >
          {/* <div>
                    xxxx
            </div> */}
          <div className="flex flex-wrap gap-2 mt-4">
            {colorValues.map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getPastelColorForValue(value) }}
                ></span>
                <span className="text-sm text-gray-700">{value}</span>
              </div>
            ))}
            
          </div>
          <table className="table-auto border-collapse w-full text-sm">
            <thead className="text-center">
              <tr className="bg-gray-200">
                <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE} </th>
                <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME} </th>
                <th className="w-[50px] px-4 py-2">{process.env.NEXT_PUBLIC_UPPER_SPEC+"/"+  process.env.NEXT_PUBLIC_LOWER_SPEC}</th>
                {/* <th className="w-[50px] px-4 py-2"></th> */}
                {/* <th className="w-[150px] px-4 py-2">Before Value</th> */}
                <th className="w-[150px] px-4 py-2">Actual Value</th>
                <th className="w-[150px] px-4 py-2">Attach</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {jobItems.map((item, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2 relative">
                    <div>{item.JobItemTitle}</div>
                  </td>
                  <td className="border px-4 py-2 relative">
                    <div>{item.JobItemName} </div>
                    <InfoIcon
                      className="absolute right-1 top-1 text-blue-600 size-8 cursor-pointer "
                      style={{ display: "none" }}
                      onClick={() => handleShowJobItemDescription(item)}
                    />

                    <InfoIcon
                      className="absolute right-1 bottom-0 text-blue-600 size-8 cursor-pointer "
                      onClick={() => handleShowTestMethodDescription(item)}
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <div>
                      {process.env.NEXT_PUBLIC_UPPER_SPEC}{" "}
                      <b style={{ color: "red", fontWeight: "1200" }}>↑</b> :{" "}
                      {item.UpperSpec}
                    </div>
                    <div>
                      {process.env.NEXT_PUBLIC_LOWER_SPEC}{" "}
                      <b style={{ color: "blue", fontWeight: "1200" }}>↓</b> :{" "}
                      {item.LowerSpec}
                    </div>
                  </td>
                  {/* <td className="border px-1 py-1 w-[125px]  relative disabled">
                    {view ? (
                      <input
                        type="text"
                        id={`before_value_2${item.JobItemID}`}
                        value={item.BeforeValue2 || item.BeforeValue || ""}
                        className="bg-gray-100 w-[125px] border border-gray-100 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                        disabled
                        title={"Lastest Update: " + item.LastestUpdate}
                        style={{
                          backgroundColor: getPastelColorForValue(
                            item.BeforeValue2 || item.BeforeValue || ""
                          ),
                        }}
                      />
                    ) : item.input_type==="Numeric" ? (<input
                      type="number"
                      step="0.01"
                      id={`before_value_2${item.JobItemID}`}
                      onChange={(e) => handleBeforeValue(e, item)}
                      className="bg-white border w-[125px]  border-gray-100 text-gray-300 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                      placeholder={item.BeforeValue || ""}
                      disabled
                      title={"Lastest Update: " + item.LastestUpdate}
                    />) : (
                      <input
                        type="text"
                        id={`before_value_2${item.JobItemID}`}
                        onChange={(e) => handleBeforeValue(e, item)}
                        className="bg-white border w-[125px]  border-gray-100 text-gray-300 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                        placeholder={item.BeforeValue || ""}
                        disabled
                        title={"Lastest Update: " + item.LastestUpdate}
                      />
                    )}
                  </td> */}
                  <td className="border px-4 py-2 relative">
                   {/* ROW หลัก: ไอคอนซ้าย → ช่องอินพุต → ไอคอนคอมเมนต์ขวา */}
                      <div className="flex items-center gap-3 w-full">
                        {/* History icon (ฟ้า) */}
                        <span className="shrink-0">
                          <HistoryIcon sx={{ color: "#1E40AF", fontSize: 30 }} 
                           onClick={() => handleShowHistory(item)}
                          />
                        </span>

                        {/* กล่องอินพุต/แสดงค่า กินพื้นที่ที่เหลือ */}
                        <div className="flex-1">
                          {view ? (
                            <input
                              type="text"
                              id={item.JobItemID}
                              value={item.ActualValue+(item.Value && item.Value !==null?' , '+item.Value:"")}
                              className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg
                                        focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 cursor-default"
                              disabled
                              title="This is a tooltip"
                              style={{ backgroundColor: getPastelColorForValue(item.ActualValue || "") }}
                            />
                          ) : item.input_type === "Numeric" ? (
                            <input
                              type="number"
                              step="0.01"
                              id={`${item.JobItemID}/${jobData.LINE_NAME}`}
                              defaultValue={item.ActualValue || ""}
                              onChange={(e) => handleInputChange(e, item)}
                              className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1
                                        focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                              placeholder="Enter value"
                              onFocus={() => handleOnFocusItemInput(item)}
                              autoComplete="on"
                            />
                          ) : (
                            
                            <input
                              type="text"
                              id={`${item.JobItemID}/${jobData.LINE_NAME}`}
                              defaultValue={item.ActualValue || ""}
                              onChange={(e) => handleInputChange(e, item)}
                              className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1
                                        focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                              placeholder="Enter value jmp:1234"
                              onFocus={() => handleOnFocusItemInput(item)}
                              autoComplete="on"
                            />

                            
                          )}
                        </div>

                        {/* ไอคอนคอมเมนต์ด้านขวา */}
                        <span className="shrink-0">
                          {view ? (
                            item.Comment !== null ? (
                              <ChatIcon
                                className="text-blue-600 size-6 cursor-pointer"
                                onClick={() => handleShowComment(item)}
                                title="Show comment"
                              />
                            ) : (
                              <span className="w-6 h-6 inline-block" /> // เว้นช่องให้ layout คงที่
                            )
                          ) : (
                            <ChatIcon
                              className="text-blue-600 size-6 cursor-pointer"
                              onClick={() => toggleAddComment(item)}
                              title="Add comment"
                            />
                          )}
                        </span>
                      </div>

                      {/* แผง select (ถ้ามี) แสดงด้านล่าง แยกบรรทัด เพื่อให้แถวบนคงที่และสวย */}
                      <div
                        id={`guide-input-panel-${item.JobItemID}`}
                        style={{ padding: "10px", display: "none" }}
                        className="w-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <select
                              id={`item-${item.JobItemID}`}
                              name="item-guide-select"
                              defaultValue=""
                              onChange={(e) => handleGuideItemSelected(e.target.value, item)}
                              className="
                                w-full appearance-none rounded-lg border border-gray-300 bg-white
                                px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm
                                outline-none transition
                                hover:border-blue-400
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
                                dark:focus:border-blue-500 dark:focus:ring-blue-400
                              "
                            >
                              <option value="" disabled>— Select —</option>
                              <option value="Pass">✅ Pass</option>
                              <option value="Fail">❌ Fail</option>
                              {item.guide_input?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>                          
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">▾</span>
                          </div>
                          <div className="relative flex-1">
                             <input
                                    type="text"
                                    className="
                                    w-full appearance-none rounded-lg border border-gray-300 bg-white
                                    px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm
                                    outline-none transition
                                    hover:border-blue-400
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                    dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
                                    dark:focus:border-blue-500 dark:focus:ring-blue-400
                                  "
                                  placeholder="Optional"
                                  defaultValue={item.Value || ""}
                                  onChange={(e) => handleOptionInputChange(e, item)}
                                  //  className="bg-gray-100 w-[125px] border border-gray-100 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                                  // disabled
                                  // title={"Lastest Update: " + item.LastestUpdate}
                                  
                                  />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleHiddenSelectGuideInput(item)}
                            title="Hide panel"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md
                                      bg-red-600 text-white text-sm font-medium shadow-sm
                                      hover:bg-blue-700 active:scale-[0.98]
                                      focus:outline-none focus:ring-2 focus:ring-red-300
                                      cursor-pointer select-none"
                          >
                            X
                          </button>

                        </div>
                      </div>

                  </td>

                  <td className="border py-2 relative">
                      <center>
                        {/*  แสดงตัวอย่างรูปภาพถ้ามี*/}
                        {item.IMG_ATTACH && (
                          <img
                            src={`/api/viewPictureItem?imgName=` + item.IMG_ATTACH} // ใช้เพียงชื่อไฟล์
                            alt="Preview"
                            width={200}
                            className="mt-4"
                            onClick={() =>
                              onclicktoShow(
                                `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                              )
                            }
                          />
                        )}

                        {/*  แสดงตัวอย่างรูปภาพถ้ามี*/}
                        {item.IMG_ATTACH_1 && (
                          <img
                            src={`/api/viewPictureItem?imgName=` + item.IMG_ATTACH_1} // ใช้เพียงชื่อไฟล์
                            alt="Preview"
                            width={200}
                            className="mt-4"
                            onClick={() =>
                              onclicktoShow(
                                `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH_1
                              )
                            }
                          />
                        )}
                      </center>
                        

                    <center>
                      {/* <p>IMG_ATTACH:{item.IMG_ATTACH}</p>   */}
                        {/* {<img
                            `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                          )
                        }
                      />
                    )}


                    <center>
                      {/* <p>IMG_ATTACH:{item.IMG_ATTACH}</p>   */}
                        {/* {<img
                        id={"item-img-" + item.JobItemID}
                        style={{ display: "none" }}
                        // src={`/api/viewPicture?imgName=`+item.IMG_ATTACH} // ใช้เพียงชื่อไฟล์
                        width={200}
                        className="mt-4"
                        alt="Preview"
                      />} */}
                    </center>
                    {view === false && (
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-4 items-center">
                            {/* ช่องที่ 1 */}
                            <div className="flex flex-col justify-center items-center p-2">
                              <img
                                id={"item-img-1-" + item.JobItemID}
                                style={{ display: "none",border:'1px solid gray',borderRadius:'0.1em' }}
                                width={200}
                                className="mt-4"
                                alt="Preview"
                              />
                              <CameraAltIcon
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  color: "#1E40AF",
                                }}
                                className="cursor-pointer"
                                onClick={() => handleUploadFileToJobItemResize(item, 1)}
                              />
                            </div>

                            {/* ช่องที่ 2 */}
                            <div className="flex flex-col justify-center items-center p-2">
                              <img
                                id={"item-img-2-" + item.JobItemID}
                               style={{ display: "none",border:'1px solid gray',borderRadius:'0.1em' }}
                                width={200}
                                className="mt-4"
                                alt="Preview"
                              />
                              <CameraAltIcon
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  color: "#1E40AF",
                                }}
                                className="cursor-pointer"
                                onClick={() => handleUploadFileToJobItemResize(item, 2)}
                              />
                            </div>
                          </div>

                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {!view && jobData.Status && jobData.Status !== "complete" && (
           <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-14 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary'}`}
          >
            {isSubmitting ? 'Waiting...' : 'Submit'}
          </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default JobForm;
