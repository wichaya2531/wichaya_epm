"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";
import ChatIcon from "@mui/icons-material/Chat";
import ImageIcon from "@mui/icons-material/Image";
import { useState, useEffect } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import Image from "next/image";
import { Img } from "@chakra-ui/react";
import Swal from "sweetalert2";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HistoryIcon from '@mui/icons-material/History';


const JobForm = ({
  jobData,
  jobItems,
  handleApprove,
  handleShowJobItemDescription,
  handleShowTestMethodDescription,
  toggleJobItem,
  isShowJobItem,
  toggleJobInfo,
  isShowJobInfo,
  toggleAddComment,
  view,
  preview_1,
  preview_2,  
  onclicktoShow,
  handleUploadFileToJob,
  user
}) => {

  const [isWaiting, setIsWaiting] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [multiValues, setMultiValues] = useState({});

  // ── multi-field helpers ───────────────────────────────────────────────────
  const shouldUseMulti = (jobItemName = "") => {
    const s = String(jobItemName);
    return s.includes("{") && s.includes(",");
  };

  const parseKeysInBrace = (jobItemName = "") => {
    if (!shouldUseMulti(jobItemName)) return [];
    const m = String(jobItemName).match(/\{([^}]+)\}/);
    if (!m) return [];
    return m[1].split(",").map((v) => v.trim()).filter(Boolean);
  };

  const parseKeyValuePairs = (s = "") => {
    const out = {};
    String(s || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((part) => {
      const [k, ...rest] = part.split(":");
      const key = (k || "").trim();
      const val = rest.join(":").trim();
      if (key) out[key] = val;
    });
    return out;
  };

  // initialize multiValues จาก jobItems เมื่อโหลดเสร็จ
  useEffect(() => {
    const next = {};
    (jobItems || []).forEach((item) => {
      const keys = parseKeysInBrace(item.JobItemName);
      if (keys.length === 0) return;

      const raw = String(item.ActualValue || "").trim();
      const mapByPair = raw.includes(":") ? parseKeyValuePairs(raw) : null;
      const parts = raw.split(",").map((s) => s.trim()).filter((s) => s !== "");

      next[item.JobItemID] = {};
      keys.forEach((k, i) => {
        next[item.JobItemID][k] =
          (mapByPair && mapByPair[k] !== undefined ? mapByPair[k] : parts[i]) ?? "";
      });
    });
    setMultiValues(next);
  }, [jobItems]);
  //console.log("jobData.=>", jobData);
  //console.log("jobItems.=>", jobItems);
  //console.log(jobData.IMAGE_FILENAME);

  const onApproveClick = async () => {
    setIsWaiting(true); // 🔹 เปลี่ยนสถานะปุ่มเป็น "Wait..."
    try {
      await handleApprove(true);
    } finally {
      // 🔹 รอให้ทำงานเสร็จก่อนค่อยกลับมาเป็นปกติ
      setIsWaiting(false);
    }
  };


  const handleShowComment = (item) => {
    Swal.fire({
      title: "Comment",
      text: item.Comment || "No comment available",
      icon: "info",
      confirmButtonText: "Close",
    });
  };

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
    <form className="flex flex-col gap-8" onSubmit={handleApprove}>
      <h1
        className="text-3xl font-bold text-primary flex items-center cursor-pointer"
        onClick={toggleJobInfo}
      >
        <Link href="/pages/job-approve">
          <ArrowBackIosNewIcon />
        </Link>
        Checklist Header
        {isShowJobInfo ? (
          <ArrowDropUpIcon className="size-14" />
        ) : (
          <ArrowDropDownIcon className="size-14" />
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
             className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                          focus:outline-none focus:border-blue-500"
            value={jobData.JobID}
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
            Checklist Name
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.LINE_NAME}
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
            Checklist Version
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.WorkgroupName}
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
            Activated By
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.SubmittedBy}
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
            Timeout
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            Submited At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.SubmitedAt}
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
            LastestUpdate At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.LastestUpdate}
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
            Status
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
           // className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            {process.env.NEXT_PUBLIC_LABEL_WD_TAG}
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.WD_TAG}
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
            {/* Machine Name */}
            {process.env.NEXT_PUBLIC_LABEL_MACHINE_NAME}
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            //className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            value={jobData.MachineName}
            disabled
          />
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
                      {
                        //--------------------------------------------------------->>                        
                      }
                      <div className={`${showPanel ? "" : "hidden"}`} style={{border:'1px solid none',position:'relative'}}>
                          <div className={`flex flex-col`}
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

                            <div className={`flex flex-col `}
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

                      {
                        //---------------------------------------------------------->>
                      }
        </div>  

        <div className="flex flex-col hidden">

                  <label
                    htmlFor="image-file"
                    className="text-sm ipadmini:text-md font-bold text-gray-600 pb-4"
                  >Evident before(PM Sticker)</label>
                  {jobData.IMAGE_FILENAME ? (
                    <img
                      src={`/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME} // ใช้เพียงชื่อไฟล์
                      alt="Job Image"
                      width={200}
                      height={200}
                      onClick={() =>
                        onclicktoShow(
                          `/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME
                        )
                      }
                    />
                  ) : (
                    <p className="text-gray-500">&nbsp;</p> // ข้อความแสดงเมื่อไม่มีข้อมูล
                  )}



        </div>
        <div className="flex flex-col hidden" >
          <label
            htmlFor="image-file"
            className="text-sm ipadmini:text-md font-bold text-gray-600 pb-4"
          > Evident after(PM Sticker)</label>
          {jobData.IMAGE_FILENAME_2 ? (
            <img
              src={`/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME_2} // ใช้เพียงชื่อไฟล์
              alt="Job Image"
              width={200}
              height={200}
              onClick={() =>
                onclicktoShow(
                  `/api/viewPicture?imgName=` + jobData.IMAGE_FILENAME_2
                )
              }
            />
          ) : (
            <p className="text-gray-500">&nbsp;</p> // ข้อความแสดงเมื่อไม่มีข้อมูล
          )}
        </div>


      </div>
      <hr />
      <div className="flex flex-col gap-8">
        <h1
          className="text-3xl font-bold text-primary flex items-center cursor-pointer"
          onClick={toggleJobItem}
        >
          Checklist Items
          {isShowJobItem ? (
            <ArrowDropUpIcon className="size-14" />
          ) : (
            <ArrowDropDownIcon className="size-14" />
          )}
        </h1>
        <div
          className={`overflow-x-auto ${
            isShowJobItem ? "" : "hidden"
          } flex flex-col gap-5`}
        >
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
            <thead className="bg-[#347EC2] text-white text-sm text-center">
              <tr>
                <th className="w-[50px] px-2 py-2">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE}</th>
                <th className="w-[50px] px-2 py-2">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME}</th>
                <th className="w-[150px] px-2 py-2">{process.env.NEXT_PUBLIC_UPPER_SPEC}/{process.env.NEXT_PUBLIC_LOWER_SPEC}</th>
                <th className="w-[150px] px-2 py-2">Actual Value</th>
                <th className="w-[150px] px-2 py-2">Attach</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {jobItems.map((item, index) => (
                <tr key={index} className="bg-white border-b border-solid border-[#C6C6C6] hover:bg-gray-100 hover:shadow-lg font-bold">

                  {/* ── Item Title ─────────────────────────────────────────── */}
                  <td className="border px-4 py-2 w-[25vw] max-w-[25vw] align-middle">
                    <div className="whitespace-normal break-words">
                      {item.JobItemTitle}
                    </div>
                  </td>

                  {/* ── Item Name (strip {Zone1,Zone2}) ────────────────────── */}
                  <td className="border px-3 py-2 relative w-[25vw] max-w-[25vw]">
                    <div
                      className="pr-8 whitespace-normal break-words"
                      title={item.JobItemName?.replace(/\{[^}]*\}/g, "").trim()}
                    >
                      {item.JobItemName?.replace(/\{[^}]*\}/g, "").trim()}
                    </div>
                    <InfoIcon
                      className="absolute bottom-1 right-1 text-blue-600 size-5 cursor-pointer"
                      onClick={() => handleShowTestMethodDescription(item)}
                    />
                  </td>

                  {/* ── USL / LSL ──────────────────────────────────────────── */}
                  <td className="border px-4 py-2 w-[150px]">
                    <div>
                      {process.env.NEXT_PUBLIC_UPPER_SPEC}{" "}
                      <b style={{ color: "red" }}>↑</b> : {item.UpperSpec}
                    </div>
                    <div>
                      {process.env.NEXT_PUBLIC_LOWER_SPEC}{" "}
                      <b style={{ color: "blue" }}>↓</b> : {item.LowerSpec}
                    </div>
                  </td>
                  {/* <td className="border px-4 py-2">
                    <input
                      type="text"
                      id={`before_value_${item.JobItemID}`}
                      value={item.BeforeValue2 || item.BeforeValue || ""}
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-not-allowed"
                      disabled
                      style={{
                        backgroundColor: getPastelColorForValue(
                          item.BeforeValue2 || item.BeforeValue || ""
                        ),
                      }}
                    />
                  </td> */}
                  {/* ── Actual Value ───────────────────────────────────────── */}
                  <td className="border px-4 py-2 relative w-[25vw] max-w-[25vw]">
                    {/* ── History + Comment icons ─────────────────────────── */}
                    <span className="absolute bottom-1 right-1 cursor-pointer">
                      <HistoryIcon
                        sx={{ color: "#1E40AF", fontSize: 25 }}
                        onClick={() => handleShowHistory(item)}
                      />
                    </span>

                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        {(() => {
                          const keys = parseKeysInBrace(item.JobItemName);
                          const isMulti = keys.length > 0;

                          const combined = [
                            item.ActualValue ?? "",
                            item.Value !== null && item.Value !== undefined && item.Value !== ""
                              ? item.Value : "",
                          ].filter(Boolean).join(",");

                          if (isMulti) {
                            return (
                              <div className="grid grid-cols-2 gap-4 w-[90%] place-items-start">
                                {keys.map((k) => (
                                  <div key={k} className="w-full">
                                    <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
                                      <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 border-b border-gray-200">
                                        {k}
                                      </div>
                                      <div className="p-2">
                                        <input
                                          type="text"
                                          value={multiValues?.[item.JobItemID]?.[k] ?? ""}
                                          disabled
                                          className="w-full text-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-gray-100 cursor-not-allowed"
                                          style={{
                                            backgroundColor: getPastelColorForValue(
                                              multiValues?.[item.JobItemID]?.[k] || ""
                                            ),
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="grid gap-2 w-[90%]">
                              <input
                                type="text"
                                value={combined}
                                disabled
                                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg text-center w-full p-1.5 cursor-not-allowed"
                                style={{
                                  backgroundColor: getPastelColorForValue(item.ActualValue || ""),
                                }}
                              />
                            </div>
                          );
                        })()}
                      </div>

                      {item.Comment !== null && (
                        <span className="shrink-0 absolute top-1 right-1 cursor-pointer">
                          <ChatIcon
                            className="text-blue-600 size-6 cursor-pointer"
                            onClick={() => handleShowComment(item)}
                            title="Show comment"
                          />
                        </span>
                      )}
                    </div>
                  </td>
                  {/* ── Attach ─────────────────────────────────────────────── */}
                  <td className="border py-2 relative">
                    <center>
                      {item.IMG_ATTACH ? (
                        <div className="pt-2">
                           <img
                            src={
                              `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                            }
                            alt="Job Image"
                            width={200}
                            height={200}
                            onClick={() =>
                              onclicktoShow(
                                `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                              )
                            }
                          />
                        </div>
                       
                      ) : (
                        <p className="text-gray-500">&nbsp;</p> // ข้อความแสดงเมื่อไม่มีข้อมูล
                      )}
                      
                      {item.IMG_ATTACH_1 ? (
                        <div className="pt-2">
                           <img
                          src={
                            `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH_1
                          }
                          alt="Job Image"
                          width={200}
                          height={200}
                          onClick={() =>
                            onclicktoShow(
                              `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH_1
                            )
                          }
                        />
                        </div>
                       
                      ) : (
                        <p className="text-gray-500">&nbsp;</p> // ข้อความแสดงเมื่อไม่มีข้อมูล
                      )}                      
                    </center>
                  </td>
                  {/* <td className="border py-2 relative">
                                        <div className="cursor-pointer" >
                                            <ImageIcon className="text-blue-600 size-15" />
                                        </div>
                                    </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view ? (
          ""
        ) : (
          <div className="flex justify-end gap-4 mt-4">
            {/* ปุ่ม Approve */}
            <button
                  type="button"
                  name="action"
                  value="approve"
                  disabled={isWaiting}
                  className={`font-bold py-2 px-4 rounded text-white transition ${
                    isWaiting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-700"
                  }`}
                  onClick={onApproveClick}
                >
                  {isWaiting ? "Wait..." : "Approve"}
                </button>

            {/* ปุ่ม Disapprove */}
            <button
              type="button"
              name="action"
              value="disapprove"
              variant="contained"
              color="secondary"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() =>
                handleApprove(false, "Disapproval reason goes here")
              }
            >
              Disapprove
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default JobForm;
