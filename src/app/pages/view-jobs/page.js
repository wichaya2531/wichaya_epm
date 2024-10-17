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
import mqtt from "mqtt";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import Select from "react-select";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
  username: process.env.NEXT_PUBLIC_MQT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
};

const Page = ({ searchParams }) => {
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
  const [inputValues, setInputValues] = useState([]);
  const { status } = useFetchStatus(refresh);
  const [machineName, setMachineName] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const mqttClient = mqtt.connect(connectUrl, options);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

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

      mqttClient.on("connect", () => {});

      mqttClient.on("error", (err) => {
        mqttClient.end();
      });

      jobItems.forEach((item) => {
        mqttClient.subscribe(item.JobItemID, (err) => {
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

  useEffect(() => {
    if (view === "false") {
      updateJobStatusToOngoing();
    }
  }, [view]);

  mqttClient.on("message", (topic, message) => {
    document.getElementById(topic.toString()).placeholder = message.toString();
  });

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

  const handleInputChange = (e, item) => {
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

  const handleAddImages = (b) => {
    imgItemFileSelected = b;
    document.getElementById("fileInput-1").click();
  };
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file)); // แสดง preview ของไฟล์
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่าไฟล์ถูกเลือกหรือไม่
    if (!selectedFile) {
      Swal.fire({
        title: "Error!",
        text: "Please select a file first.",
        icon: "error",
      });
      return;
    }

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
    };

    const formData = new FormData();
    formData.append("file", selectedFile);
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
        setRefresh((prev) => !prev);
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
    setShowDetail(item);
    setTestMethodDescription(true);
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
      <input
        type="file"
        style={{ display: "none" }}
        id="fileInput-1"
        onChange={handleFileChangeOnItem}
      />
      <form
        className="flex flex-col gap-8 p-4 bg-white rounded-xl"
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
          <div className="flex flex-col items-center">
            {/* ซ่อนปุ่มอัปโหลดไฟล์ */}
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept="image/*"
            />

            {/* ปุ่มอัปโหลดไฟล์ที่ตกแต่ง */}
            <label
              htmlFor="fileInput"
              className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <CameraAltIcon className="mr-2" />
              อัปโหลดไฟล์
            </label>

            {/* แสดงตัวอย่างรูปภาพถ้ามี */}
            {preview && (
              <img src={preview} alt="Preview" width={200} className="mt-4" />
            )}
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
                  <th className="w-[50px] px-4 py-2">Lower/Upper</th>
                  {/* <th className="w-[50px] px-4 py-2"></th> */}
                  <th className="w-[150px] py-2">Before Value</th>
                  <th className="w-[150px] px-4 py-2">Actual Value</th>
                  <th className="w-[150px] px-4 py-2">Attach</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {jobItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 relative">
                      <div>{item.JobItemTitle} </div>
                      <InfoIcon
                        className="absolute right-1 top-1 text-blue-600 size-4 cursor-pointer"
                        onClick={() => handleShowJobItemDescription(item)}
                      />

                      <InfoIcon
                        className="absolute right-1 bottom-0 text-orange-600 size-4 cursor-pointer"
                        onClick={() => handleShowTestMethodDescription(item)}
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <div>
                        Upper <b>↑</b> : {item.UpperSpec}
                      </div>
                      <div>
                        Lower <b>↓</b> : {item.LowerSpec}
                      </div>
                    </td>
                    <td className="border py-2 relative">
                      {view === "true" ? (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          value={item.BeforeValue}
                          className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                          disabled
                          title={"Lastest Update: " + item.LastestUpdate}
                        />
                      ) : item.BeforeValue ? (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          value={item.BeforeValue}
                          className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center w-3/4 p-1.5 cursor-default"
                          title={"Lastest Update: " + item.LastestUpdate}
                          disabled
                        />
                      ) : (
                        <input
                          type="text"
                          id={`before_value_${item.JobItemID}`}
                          onChange={(e) => handleBeforeValue(e, item)}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 w-full p-1.5"
                          placeholder="fill in value"
                          title={"Lastest Update: " + item.LastestUpdate}
                        />
                      )}
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
                    <td className="border py-2 relative">
                      <center>
                        <img
                          id={"item-img-" + item.JobItemID}
                          width={200}
                          className="mt-4"
                        />
                      </center>

                      <div>
                        <CameraAltIcon
                          className="text-blue-600 size-10 cursor-pointer"
                          style={{ transform: "scale(1.5)" }}
                          onClick={() => handleAddImages(item.JobItemID)}
                        />
                      </div>
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
