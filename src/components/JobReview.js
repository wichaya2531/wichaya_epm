"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";
import ChatIcon from "@mui/icons-material/Chat";
import ImageIcon from "@mui/icons-material/Image";
import { useState } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import Image from "next/image";
import { Img } from "@chakra-ui/react";
import Swal from "sweetalert2";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HistoryIcon from '@mui/icons-material/History';
import toast from "react-hot-toast";
import { useEffect } from "react";

import useFetchJobValue from "@/lib/hooks/useFetchJobValue";  

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
const JobForm = ({
  job_id,
  // jobData,
  // jobItems,
   handleApprove,
  // handleShowJobItemDescription,
  // handleShowTestMethodDescription,
  // toggleJobItem,
  // isShowJobItem,
  // toggleJobInfo,
  // isShowJobInfo,
  // toggleAddComment,
  // view,
  // preview_1,
  // preview_2,  
  // onclicktoShow,
  // handleUploadFileToJob,
  // user
}) => {
  const [showTip, setShowTip] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [activeTip, setActiveTip] = useState(null);   // เก็บ ID ของปุ่มที่กำลังโชว์ balloon
  const [isApproving, setIsApproving] = useState(true);

  const { jobData, jobItems, isLoading, error } = useFetchJobValue(
    job_id,
    refresh
  );

  const preApprove = async (job_id, isApproved, comment) => {
    setIsApproving(true);
       await handleApprove(job_id, isApproved, comment);
    setIsApproving(false);
  }

useEffect(() => {
  if (!isLoading) {
     // setTimeout(() => {
        setIsApproving(false);
     // }, 2500);
  }
}, [isLoading]);

  // const [showPanel, setShowPanel] = useState(false);
//console.log("jobData.=>", jobData);
//console.log("jobItems.=>", jobItems);
  // //console.log(jobData.IMAGE_FILENAME);
  // const handleShowComment = (item) => {
  //   Swal.fire({
  //     title: "Comment",
  //     text: item.Comment || "No comment available",
  //     icon: "info",
  //     confirmButtonText: "Close",
  //   });
  // };





  //  function handleShowHistory(item) {
  //       const safe = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));
  
  //       Swal.fire({
  //         title: "History",
  //         html: `
  //           <div style="text-align:left;font-size:14px;line-height:1.6">
  //             <div style='display:none;'><b>BeforeValue2:</b> ${safe(item.BeforeValue2)}</div>
  //             <div><b>BeforeValue:</b> ${safe(item.BeforeValue)}</div>
  //             <div><b>LastestUpdate:</b> ${safe(item.LastestUpdate)}</div>
  //           </div>
  //         `,
  //         icon: "info",
  //         showCloseButton: true,
  //         confirmButtonText: "Close",
  //         width: 420,
  //       });
  //     }

   const handleShowComment = (item) => {
   // console.log(item);
      //toast.success("xxxx=>"+item.Comment);
      //console.log('item.Comment',item.Comment);
          // ✅ แสดง balloon tips
        // ✅ แสดง balloon เฉพาะปุ่มที่กด
    setActiveTip(item.JobItemID);
    setTimeout(() => setActiveTip(null), 2000); // ซ่อน balloon หลัง 2 วิ         
    setShowTip(true);
    setTimeout(() => setShowTip(false), 2000); // ซ่อนหลัง 2 วิ
   }       


  return (
    
  <div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-4">
         {/* Row 1 */}
         {/* column 1 */}
         <div className="relative flex items-center gap-1 mb-1">
           <label
            htmlFor="text-input"
               className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
           >
             Checklist ID
           </label>
            <input  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                        focus:outline-none focus:border-blue-500"
            
            value={jobData.JobID} disabled />
           
            
        </div>
        {/* column 2 */}
        <div className="relative flex items-center gap-1 mb-1">
           <label
             htmlFor="text-input"
             //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
           >
             Checklist Name
           </label>
            <input    className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 
             focus:outline-none focus:border-blue-500 
             text-gray-800 text-sm truncate"
            value={jobData.Name} disabled />
         </div>
          {/* column 3 */}     
         <div className="relative flex items-center gap-1 mb-1">
           <label
             htmlFor="text-input"
             //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
           >
             Document No
           </label>
          <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2   
                        focus:outline-none focus:border-blue-500"
            value={jobData.DocumentNo} disabled />
         </div>
         {/* Row  2 */} 
         {/* column 1 */} 
        <div className="relative flex items-center gap-1 mb-1">
           <label
             htmlFor="text-input"
            // className=" min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
           >
             Line Name 
           </label>
           <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.LINE_NAME} disabled />
         </div>
         {/* column 2 */} 
         <div className="relative flex items-center gap-1 mb-1">
           <label
             htmlFor="text-input"
             //className=" min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"  
           >
             Version
           </label>
            <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.ChecklistVer} disabled />
         </div>
        {/* column 3 */} 
        <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Workgroup
          </label>
         <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.WorkgroupName} disabled />
        </div>
          {/* Row  3 */} 
         {/* column 1 */} 
        <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
          >
            Activated By
          </label>
          <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.ActivatedBy} disabled />
        </div>
         {/* column 2 */} 
         <div className="relative flex items-center gap-1 mb-1">
           <label
             htmlFor="text-input"
             //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1     
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
           >
             Submitted By
           </label>
            <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.SubmittedBy} disabled />
         </div>
          {/* column 3 */}
          <div className="relative flex items-center gap-1 mb-1">
            <label
              htmlFor="text-input"
              //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600 text-right"
              className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
            >
              Timeout
            </label>
             <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.Timeout} disabled />
          </div>
         {/* Row  4 */} 
         {/* column 1 */} 
          <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
            className="pointer-events-none absolute left-3 top-0 bg-white px-1
                        text-gray-500 text-sm transition-all z-10
                        peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                        peer-valid:top-1 peer-valid:text-xs"
          >
            Activated At
          </label>
           <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.ActivatedAt} disabled />
        </div>   
          {/* column 2 */}     
        <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
            className="pointer-events-none absolute left-3 top-0 bg-white px-1
                        text-gray-500 text-sm transition-all z-10
                        peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                        peer-valid:top-1 peer-valid:text-xs"
          >
            Submited At
          </label>
           <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.SubmitedAt} disabled />
        </div>
          {/* column 3 */}     
         <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
            className="pointer-events-none absolute left-3 top-0 bg-white px-1
                        text-gray-500 text-sm transition-all z-10
                        peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                        peer-valid:top-1 peer-valid:text-xs"
          >
            LastestUpdate At
          </label>
           <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.LastestUpdate} disabled />
        </div>
           {/* Row  5 */} 
         {/* column 1 */}        
        <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
           // className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
           className="pointer-events-none absolute left-3 top-0 bg-white px-1
                       text-gray-500 text-sm transition-all z-10
                       peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                       peer-valid:top-1 peer-valid:text-xs"
          >
            Status
          </label>
           <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
            value={jobData.Status} disabled />
        </div>
         {/* column 2 */}        
       <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
           // className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
            className="pointer-events-none absolute left-3 top-0 bg-white px-1
                       text-gray-500 text-sm transition-all z-10
                       peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                       peer-valid:top-1 peer-valid:text-xs"
          >
            {/* WD Tag / Machine ID */}
            {process.env.NEXT_PUBLIC_LABEL_WD_TAG} : 
          </label>
          <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                      focus:outline-none focus:border-blue-500"
            value={jobData.WD_TAG} disabled />
        </div>     
         {/* column 3 */}        
         <div className="relative flex items-center gap-1 mb-1">
          <label
            htmlFor="text-input"
            //className="min-w-[120px] text-sm ipadmini:text-md font-bold text-gray-600"
            className="pointer-events-none absolute left-3 top-0 bg-white px-1
                        text-gray-500 text-sm transition-all z-10
                        peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                        peer-valid:top-1 peer-valid:text-xs"
          >
            {/* Machine Name */}
            {process.env.NEXT_PUBLIC_LABEL_MACHINE_NAME} :
          </label>
          <input className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                      focus:outline-none focus:border-blue-500"
            value={jobData.MachineName} disabled />
        </div>

    </div>
    <hr></hr> 
    <div className="flex flex-col">
        {/* <h1
          className="text-3xl font-bold text-primary flex items-center cursor-pointer"
          //onClick={toggleJobItem}
        >
          Checklist Items
         
        </h1> */}


      {/* <div className="flex flex-wrap gap-2 mt-4">
        {colorValues.map((value) => (
          <div key={value} className="flex items-center space-x-2">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getPastelColorForValue(value) }}
            ></span>
            <span className="text-sm text-gray-700">{value}</span>
          </div>
        ))}
      </div> */}
      <table className="table-auto border-collapse w-full text-sm">
        <thead className="text-center">
          <tr className="bg-gray-200">
          <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE} </th>
          <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME} </th>
            {/* <th className="w-[50px] px-4 py-2">
                                Test Method
                            </th> */}
            <th className="w-[50px] px-4 py-2">{process.env.NEXT_PUBLIC_UPPER_SPEC+"/"+  process.env.NEXT_PUBLIC_LOWER_SPEC}</th>
            {/* <th className="w-[50px] px-4 py-2">Before Value</th> */}
            <th className="w-[150px] py-2">Actual Value</th>
            <th className="w-[150px] px-4 py-2">Attach</th>
            {/* <th className="w-[5px] px-2 py-2">See images</th> */}
          </tr>
        </thead>  

        <tbody className="text-center">
              {jobItems.map((item, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2 relative">
                    <div>{item.JobItemTitle} </div>
                  </td>
                  <td className="border px-4 py-2 relative">
                    <div>{item.JobItemName} </div>
                    <InfoIcon
                      className="absolute right-1 top-1 text-blue-600 size-4 cursor-pointer "
                      style={{ display: "none" }}
                      onClick={() => handleShowJobItemDescription(item)}
                    />

                    {/* <InfoIcon
                      className="absolute right-1 bottom-0 text-blue-600 size-4 cursor-pointer "
                      onClick={() => handleShowTestMethodDescription(item)}
                    /> */}
                  </td>
                  {/* <td className="border px-4 py-2 relative">
                                        <div>{item.TestMethod} </div>
                                        <InfoIcon
                                            className="absolute right-1 top-1 text-blue-600 size-4 cursor-pointer "
                                            onClick={() => handleShowTestMethodDescription(item)}

                                        />
                                    </td> */}
                  <td className="border px-4 py-2">
                    {" "}
                    <div>
                      Upper{" "}
                      <b style={{ color: "red", fontWeight: "1200" }}>↑</b> :{" "}
                      {item.UpperSpec}
                    </div>
                    <div>
                      Lower{" "}
                      <b style={{ color: "blue", fontWeight: "1200" }}>↓</b> :{" "}
                      {item.LowerSpec}
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
                  <td className="border  py-2 relative">

                   
                    <span className="shrink-0" style={{padding:'5px'}}>
                      {/* <HistoryIcon sx={{ color: "#1E40AF", fontSize: 30 }} 
                        onClick={() => handleShowHistory(item)}
                      /> */}
                    </span>
                    <input
                      type="text"
                      id={`actual_value_${item.JobItemID}`}
                      value={item.ActualValue+(item.Value && item.Value !==null?' , '+item.Value:"")}
                      className=" bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-not-allowed"
                      disabled
                      style={{
                        backgroundColor: getPastelColorForValue(
                          item.ActualValue || ""
                        ),
                      }}
                    />
                    {item.Comment !== null ? (
                      <span style={{padding:'5px'}}>
                      {/* ✅ balloon tips แสดงใน modal */}
                          {/* ✅ balloon แสดงเหนือ ChatIcon */}
                          {activeTip === item.JobItemID && (
                            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs rounded py-2 px-4 shadow-md animate-fade-in">
                              💬 {item.Comment}
                              <div className="absolute left-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600 transform -translate-x-1/2"></div>
                            </div>
                          )}

                          <ChatIcon
                            className=" right-1 top-0 text-blue-600 size-6 cursor-pointer "
                            // style={{ display: "none" }}
                            //title={item.Comment}
                            onClick={() => handleShowComment(item)}
                          />
                      </span>
                        

                    ) : (
                      <span></span>
                    )}
                  </td>
                  <td className="border px-4 py-2 relative">
                    <center>
                      <label
                        htmlFor="image-file"
                        className="text-sm ipadmini:text-md font-bold text-gray-600"
                      ></label>
                      {item.IMG_ATTACH ? (
                        <div className="pt-2">
                           <img
                            src={
                              `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                            }
                            alt="Job Image"
                            width={200}
                            height={200}
                            // onClick={() =>
                            //   onclicktoShow(
                            //     `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH
                            //   )
                            // }
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
                          // onClick={() =>
                          //   onclicktoShow(
                          //     `/api/viewPictureItem/?imgName=` + item.IMG_ATTACH_1
                          //   )
                          // }
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

      {/* ----------------------------------*/}
          <div className="flex justify-end gap-4 mt-4">
            {/* ปุ่ม Approve */}
            <button
              type="button"
              name="action"
              value="approve"
              variant="contained"
              color="primary"
              disabled={isApproving}
              className={`text-white font-bold py-2 px-4 rounded 
                ${isApproving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-700'}`}
                  //onClick={() => preApprove(job_id, true)}
                  onClick={async () => {
                    setIsApproving(true);
                    await preApprove(job_id, true);
                    setIsApproving(false);
                  }}
            >
              {isApproving ? 'Waiting...' : 'Approve'}
            </button>

            {/* ปุ่ม Disapprove */}
            <button
              type="button"
              name="action"
              value="disapprove"
              variant="contained"
              color="secondary"
              disabled={isApproving}
              className={`text-white font-bold py-2 px-4 rounded 
                ${isApproving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-700'}`}
              onClick={async () => {
                setIsApproving(true);
                await preApprove(job_id, false, "Disapproval reason goes here");
                setIsApproving(false);
              }}
            >
              {isApproving ? 'Waiting...' : 'Disapprove'}
            </button>
          </div>
    </div>      


</div>
  );
};

export default JobForm;
