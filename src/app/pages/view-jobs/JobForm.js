"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import Select from "react-select";
import React, { useState, useRef, useCallback } from "react";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import Webcam from "react-webcam";

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
}) => {
  const [image, setImage] = useState(null);
  const webcamRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // สร้าง Blob จากภาพที่จับได้
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "webcam_image.jpg", {
            type: "image/jpeg",
          });
          setImage(URL.createObjectURL(file)); // ตั้งค่าภาพที่ถูกจับให้แสดง
          setShowWebcam(false); // ปิดเว็บแคมหลังจับภาพ
        });
    }
  }, [webcamRef]);

  const handleUploadImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // แสดงภาพที่อัปโหลด
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImages = () => {
    setShowWebcam(true);
  };

  const handleCloseWebcam = () => {
    setShowWebcam(false);
  };

  // console.log("jobData",jobData);
  return (
    <form
      className="flex flex-col gap-8 mb-4 p-4 bg-white rounded-xl"
      onSubmit={handleSubmit}
    >
      <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
        Checklist Information
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
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 w-full gap-y-2 ${
          isShowJobInfo ? "" : "hidden"
        }`}
      >
        {[
          { label: "Checklist Id", value: jobData.JobID },
          { label: "Checklist Name", value: jobData.Name },
          { label: "Document No.", value: jobData.DocumentNo },
          { label: "Line Name", value: jobData.LINE_NAME },
          { label: "Checklist Version", value: jobData.ChecklistVer },
          { label: "Workgroup Name", value: jobData.WorkgroupName },
          { label: "Activated By", value: jobData.ActivatedBy },
          { label: "Submitted By", value: jobData.SubmittedBy },
          { label: "Timeout", value: jobData.Timeout },
          { label: "Activated At", value: jobData.ActivatedAt },
          { label: "Lastest Update At", value: jobData.LastestUpdate },
          { label: "Submitted At", value: jobData.SubmitedAt },
          { label: "Status", value: jobData.Status },
        ].map(({ label, value }, index) => (
          <div className="flex flex-col" key={index}>
            <label
              htmlFor={`text-input-${index}`}
              className="text-sm ipadmini:text-md font-bold text-gray-600"
            >
              {label}
            </label>
            <input
              type="text"
              id={`disabled-input-${index}`}
              aria-label="disabled input"
              className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              value={value}
              disabled
            />
          </div>
        ))}
        <div className="flex flex-col">
          <label
            htmlFor="text-input"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            WD Tag
          </label>
          {view === "true" ? (
            <input
              type="text"
              id="disabled-input"
              aria-label="disabled input"
              className="mb-5 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-default"
              value={jobData.WD_TAG}
              disabled
            />
          ) : jobData.WD_TAG ? (
            <Select
              className="mb-5"
              options={machines.map((item) => ({
                value: item.wd_tag,
                label: item.wd_tag,
              }))}
              onChange={(selectedOption) => handleWdChange(selectedOption)}
              name="wd_tag"
              value={{ value: jobData.WD_TAG, label: jobData.WD_TAG }}
              disabled
            />
          ) : (
            <Select
              className="mb-5"
              options={machines.map((item) => ({
                value: item.wd_tag,
                label: item.wd_tag,
              }))}
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
            Machine Name
          </label>
          {view === "true" ? (
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
              disabled
            />
          )}
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="upload-image"
            className="text-sm ipadmini:text-md font-bold text-gray-600"
          >
            Upload Image
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleUploadImage}
            className="mb-5"
          />
          <button
            type="button"
            onClick={handleAddImages}
            className="inline-flex items-center mb-5 bg-primary text-white rounded-lg px-4 py-2"
          >
            <CameraAltIcon className="mr-2" />
            Open Webcam
          </button>
          {showWebcam && (
            <div>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={300}
              />
              <button
                type="button"
                onClick={capture}
                className="bg-secondary text-white rounded-lg px-4 py-2"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={handleCloseWebcam}
                className="bg-red-600 text-white rounded-lg px-4 py-2"
              >
                Close Webcam
              </button>
            </div>
          )}
          {image && <img src={image} alt="Captured" className="mt-4" />}
        </div>
      </div>

      <hr />
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
          Checklist Items Information
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
        <div
          className={`overflow-x-auto ${
            isShowJobItem ? "" : "hidden"
          } flex flex-col gap-5`}
        >
          <table className="table-auto border-collapse w-full text-sm">
            <thead className="text-center">
              <tr className="bg-gray-200">
                <th className="w-[50px]">Item Title </th>
                <th className="w-[50px] px-4 py-2">Lower Spec</th>
                <th className="w-[50px] px-4 py-2">Upper Spec</th>
                <th className="w-[150px] py-2">Before Value</th>
                <th className="w-[150px] px-4 py-2">Actual Value</th>
                {/* <th className="w-[5px] py-2">Add images</th> */}
              </tr>
            </thead>
            <tbody className="text-center">
              {jobItems.map((item, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2 relative">
                    <div>{item.JobItemTitle} </div>
                    <InfoIcon
                      className="absolute right-1 top-1 text-blue-600 size-4 cursor-pointer "
                      onClick={() => handleShowJobItemDescription(item)}
                    />

                    <InfoIcon
                      className="absolute right-1 bottom-0 text-blue-600 size-4 cursor-pointer text-orange-600"
                      onClick={() => handleShowTestMethodDescription(item)}
                    />
                  </td>
                  <td className="border px-4 py-2">{item.UpperSpec}</td>
                  <td className="border px-4 py-2">{item.LowerSpec}</td>
                  <td className="border  py-2 relative">
                    {
                      //if view is true then disable the input field
                      view === "true" ? (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          value={item.BeforeValue}
                          className=" bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                          disabled
                          title={"Lastest Update: " + item.LastestUpdate}
                        />
                      ) : item.BeforeValue ? (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          value={item.BeforeValue}
                          className=" bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                          title={"Lastest Update: " + item.LastestUpdate}
                          disabled
                        />
                      ) : (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          onChange={(e) => handleBeforeValue(e, item)}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500  w-full p-1.5"
                          placeholder="fill in value"
                          title={"Lastest Update: " + item.LastestUpdate}
                        />
                      )
                    }
                  </td>
                  <td className="border px-4 py-2 relative">
                    {view === "true" ? (
                      <input
                        type="text"
                        id={item.JobItemID}
                        value={item.ActualValue}
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                        disabled
                      />
                    ) : item.ActualValue ? (
                      <input
                        type="text"
                        id={item.JobItemID}
                        value={item.ActualValue}
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                        disabled
                      />
                    ) : (
                      <input
                        type="text"
                        id={item.JobItemID}
                        onChange={(e) => handleInputChange(e, item)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-full p-1.5 rounded-lg"
                        placeholder="fill in value"
                      />
                    )}
                    <InfoIcon
                      className="absolute right-[2px] top-1 text-blue-600 size-4 cursor-pointer"
                      onClick={() => toggleAddComment(item)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {view === "true" || jobData.Status === "complete" ? null : (
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
