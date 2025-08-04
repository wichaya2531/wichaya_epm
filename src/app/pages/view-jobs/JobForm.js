"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import Select from "react-select";
import { useState } from "react";
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




const JobForm = ({
  jobData,
  jobItems,
  machines,
  machineName,
  handleInputChange,
  handleBeforeValue,
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
  //view=false;
  //console.log('user',user);
  //console.log('jobData',jobData);
  //console.log("jobData.WD_TAG",jobData.WD_TAG);
  // console.log("machines",machines);
  //const existsLinenameInMachine = machines.some(machine => machine.wd_tag === jobData.LINE_NAME);
 
  //console.log(' jobData.Name',jobData.Name);
  //const text = "Test1[TD-123]";

 
  // if(machineNameTrap[1]){
  //       console.log('machineName from trap',machineNameTrap[1]);
  // }
  //var wdtagMatchLinename=false;



  

  //   machineAsLinename={
  //     value:jobData.WD_TAG,
  //     label:jobData.WD_TAG
  //   }
  

  // console.log('jobData',jobData);
  // console.log('wd tag ตรงกับ line name  ',wdtagMatchLinename);
  // console.log('linename',jobData.LINE_NAME);
  // console.log('wd_tag',jobData.WD_TAG);
  // console.log('machinename',jobData.MachineName);

  
  // if(!wdtagMatchLinename){
  //         //console.log('OK');
  //           machineAsLinename={
  //            value:jobData.WD_TAG,
  //            label:jobData.WD_TAG
  //          }
  // }


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
         //jmp:1
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

   



  const [showPanel, setShowPanel] = useState(false);


  const isPictureRequired = jobData.PICTURE_EVEDENT_REQUIRE;

  const [showWebcam, setShowWebcam] = useState(false);
  const [previewItemPicture, setPreviewItemPicture] = useState(null);

  var jobItemSelected = null;

  const handleUploadFileToJobItem = (item) => {
    jobItemSelected = item;
    try {
      const fileInput = document.getElementById("item-fileInput");
      fileInput.setAttribute("data-upload-type", "default");
      fileInput.click();
    } catch (error) {}
  };

  const handleUploadFileToJobItemResize = (item) => {
    jobItemSelected = item;
    try {
      const fileInput = document.getElementById("item-fileInput");
      fileInput.setAttribute("data-upload-type", "resize");
      fileInput.click();
    } catch (error) {}
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

    try {
      document.getElementById(
        "guide-input-panel-" + item.JobItemID
      ).style.display = "none";
    } catch (error) {}
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
      document.getElementById("item-img-" + jobItemSelected.JobItemID).src =
        URL.createObjectURL(file);
      //console.log("valuePath",valuePath);
      onItemImgChange(valuePath, jobItemSelected);
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

  return (
    <form
      className="flex flex-col gap-8 p-4 bg-white rounded-xl"
      onSubmit={handleSubmit}
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
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Checklist Id
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.JobID}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Checklist Name
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.Name}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Document No.
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.DocumentNo}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Line Name.
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.LINE_NAME}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Checklist Version
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.ChecklistVer}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Workgroup Name
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.WorkgroupName}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Activated By
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.ActivatedBy}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Submitted By
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.SubmittedBy}
            disabled
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Timeout
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.Timeout}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Activated At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.ActivatedAt}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            LastestUpdate At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.LastestUpdate}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Submitted At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.SubmitedAt}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Status
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
            value={jobData.Status}
            disabled
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            {/* WD Tag / Machine ID */}
            {process.env.NEXT_PUBLIC_LABEL_WD_TAG}
          </label>
          {view ? (
            /* view mode และมีข้อมูล WD tag อยู่แล้ว */    
            <input
              type="text"
              id="disabled-input"
              aria-label="disabled input"
              className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
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
              className="mb-5"
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
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
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
                className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
                value={jobData.MachineName}
                disabled
              />
            ) : (
              <input
                type="text"
                id="disabled-input"
                aria-label="disabled input"
                className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              />
            )
          ) : (
            <input
              type="text"
              id="disabled-input"
              aria-label="disabled input"
              className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
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
                    Approve By :<a href="#" style={{color:'blue',textDecorationLine:'underline'}}> {jobData.ApproverName||""}</a>
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
                <th className="w-[150px] px-4 py-2">Before Value</th>
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
                  <td className="border px-4 py-2 relative">
                    {view ? (
                      <input
                        type="text"
                        id={`before_value_2${item.JobItemID}`}
                        value={item.BeforeValue2 || item.BeforeValue || ""}
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
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
                      className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                      placeholder={item.BeforeValue || ""}
                      disabled
                      title={"Lastest Update: " + item.LastestUpdate}
                    />) : (
                      <input
                        type="text"
                        id={`before_value_2${item.JobItemID}`}
                        onChange={(e) => handleBeforeValue(e, item)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                        placeholder={item.BeforeValue || ""}
                        disabled
                        title={"Lastest Update: " + item.LastestUpdate}
                      />
                    )}
                  </td>
                  <td className="border px-4 py-2 relative">
                    {view ? (
                      <input
                        type="text"
                        id={item.JobItemID}
                        value={item.ActualValue}
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                        disabled
                        title="This is a tooltip"
                        style={{
                          backgroundColor: getPastelColorForValue(
                            item.ActualValue || ""
                          ),
                        }}
                      />
                    ) : item.input_type=="Numeric" ? (
                        <input
                          type="number"
                          step="0.01"
                          id={item.JobItemID+"/"+jobData.LINE_NAME}
                          defaultValue={item.ActualValue || ""}
                          onChange={(e) => handleInputChange(e, item)}
                          className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                          placeholder="Enter value"
                          onFocus={() => handleOnFocusItemInput(item)}
                          autoComplete="on"
                        />
                    ): (
                        <div>
                          <div>
                            <input
                              type="text"
                              id={item.JobItemID+"/"+jobData.LINE_NAME}
                              defaultValue={item.ActualValue || ""}
                              onChange={(e) => handleInputChange(e, item)}
                              className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                              placeholder="Enter value"
                              onFocus={() => handleOnFocusItemInput(item)}
                              autoComplete="on"
                            />
                          </div>
                          <div
                            id={"guide-input-panel-" + item.JobItemID}
                            style={{ padding: "10px", display: "none" }}
                          >
                            <select
                              className="mb-5"
                              name="item-guide-select"
                              id={'item-'+item.JobItemID}
                              style={{
                                padding: "5px",
                                border: "1px solid green",
                                borderRadius: "5px",
                              }}
                              onChange={(e) =>
                                handleGuideItemSelected(e.target.value, item)
                              }
                            >
                              <option value="เพิ่มเติม">--Select--</option>
                              <option value="Pass">Pass</option>
                              <option value="Fail">Fail</option>
                              {item.guide_input.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                            <span
                              onClick={() => handleHiddenSelectGuideInput(item)}
                              style={{
                                paddingLeft: "10px",
                                cursor: "default",
                                color: "blue",
                              }}
                            >
                              [hide]
                            </span>
                          </div>
                        </div>
                      )
                    
                    }

                    {view ? (
                      item.Comment !== null ? (
                        <ChatIcon
                          className="absolute right-[2px] top-1 text-blue-600 size-8 cursor-pointer"
                          onClick={() => handleShowComment(item)}
                        />
                      ) : (
                        <div></div>
                      )
                    ) : (
                      <ChatIcon
                        className="absolute right-[2px] top-1 text-blue-600 size-8 cursor-pointer"
                        onClick={() => toggleAddComment(item)}
                      />
                    )}
                  </td>

                  <td className="border py-2 relative">
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

                    <center>
                      {/* <p>IMG_ATTACH:{item.IMG_ATTACH}</p>   */}
                      <img
                        id={"item-img-" + item.JobItemID}
                        style={{ display: "none" }}
                        // src={`/api/viewPicture?imgName=`+item.IMG_ATTACH} // ใช้เพียงชื่อไฟล์
                        width={200}
                        className="mt-4"
                        alt="Preview"
                      />
                    </center>
                    {view === false && (
                      <div className="relative">
                        <div className="flex flex-grow justify-center items-center">
                          <CameraAltIcon
                            style={{
                              width: "60px",
                              height: "60px",
                              color: "#1E40AF",
                            }}
                            className="cursor-pointer"
                            onClick={() =>
                              handleUploadFileToJobItemResize(item)
                            }
                          />
                        </div>
                        <div className="flex justify-end items-end w-full">
                          <TripOriginIcon
                            style={{
                              width: "20px",
                              height: "20px",
                            }}
                            className="cursor-pointer"
                            onClick={() => handleUploadFileToJobItem(item)}
                          />
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
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-14 py-3 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default JobForm;
