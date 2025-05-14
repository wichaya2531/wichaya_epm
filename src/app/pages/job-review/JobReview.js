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


  const [showPanel, setShowPanel] = useState(false);
  //console.log("jobData.=>", jobData);
  //console.log("jobItems.=>", jobItems);
  //console.log(jobData.IMAGE_FILENAME);
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            value={jobData.ActivatedAt}
            disabled
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Submited At
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            value={jobData.SubmitedAt}
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            value={jobData.LastestUpdate}
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
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            value={jobData.WD_TAG}
            disabled
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            {/* Machine Name */}
            {process.env.NEXT_PUBLIC_LABEL_MACHINE_NAME}
          </label>
          <input
            type="text"
            id="disabled-input"
            aria-label="disabled input"
            className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
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
            <thead className="text-center">
              <tr className="bg-gray-200">
              <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE} </th>
              <th className="w-[50px]">{process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME} </th>
                {/* <th className="w-[50px] px-4 py-2">
                                    Test Method
                                </th> */}
                <th className="w-[50px] px-4 py-2">{process.env.NEXT_PUBLIC_UPPER_SPEC+"/"+  process.env.NEXT_PUBLIC_LOWER_SPEC}</th>
                <th className="w-[50px] px-4 py-2">Before Value</th>
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

                    <InfoIcon
                      className="absolute right-1 bottom-0 text-blue-600 size-4 cursor-pointer "
                      onClick={() => handleShowTestMethodDescription(item)}
                    />
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
                  <td className="border px-4 py-2">
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
                  </td>
                  <td className="border  py-2 relative">
                    <input
                      type="text"
                      id={`actual_value_${item.JobItemID}`}
                      value={item.ActualValue}
                      className=" bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-not-allowed"
                      disabled
                      style={{
                        backgroundColor: getPastelColorForValue(
                          item.ActualValue || ""
                        ),
                      }}
                    />
                    {item.Comment !== null ? (
                      <ChatIcon
                        className="absolute right-1 top-0 text-blue-600 size-6 cursor-pointer "
                        // style={{ display: "none" }}
                        onClick={() => handleShowComment(item)}
                      />
                    ) : (
                      <div></div>
                    )}
                  </td>
                  <td className="border px-4 py-2 relative">
                    <center>
                      <label
                        htmlFor="image-file"
                        className="text-sm ipadmini:text-md font-bold text-gray-600"
                      ></label>
                      {item.IMG_ATTACH ? (
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
              variant="contained"
              color="primary"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleApprove(true)}
            >
              Approve
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
