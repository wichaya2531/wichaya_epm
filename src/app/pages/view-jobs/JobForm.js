"use client";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import InfoIcon from "@mui/icons-material/Info";
import Select from "react-select";
import { useState, useEffect, useRef } from "react";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Swal from "sweetalert2";
import ChatIcon from "@mui/icons-material/Chat";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HistoryIcon from "@mui/icons-material/History";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";

const JobForm = ({
  jobData,
  jobItems,
  machines,
  machineName,
  handleInputChange,
  handleBeforeValue,
  handleOptionInputChange,
  handleWdChange,
  handleMachineChange,
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
  preview_1,
  preview_2,
  onclicktoShow,
  machineAsLinename,
  user,
  wdTagOptions,
  machineOptions,
  selectedMachine,
  wdTagEnabled,
  onWdTagEnabledChange,
}) => {
  const [pageLoading, setPageLoading] = useState(true);
  const [showWdTagTip, setShowWdTagTip] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [showPanel, setShowPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiValues, setMultiValues] = useState({});

  const jobItemSelectedRef = useRef(null);
  const imgItemSelectBeforeUploadRef = useRef(0);

  const toggleMenu = () => {
    setIsMenuVisible((prev) => !prev);
    setRotation((prev) => prev + 90);
  };

  useEffect(() => {
    const done = Array.isArray(jobItems);
    setPageLoading(!done);
  }, [jobItems]);

  useEffect(() => {
    setShowWdTagTip(true);

    const timer = setTimeout(() => {
      setShowWdTagTip(false);
      localStorage.setItem("wdTagEnabled_tip_shown", "true");
    }, 9000);

    return () => clearTimeout(timer);
  }, []);

  const autoFullItems = (dataValue) => {
    toggleMenu();

    const nextMultiValues = {};

    jobItems.forEach((element) => {
      // ข้าม Numeric input — ไม่ใส่ค่าลงไป
      if (element?.input_type === "Numeric") return;

      const keys = parseKeysInBrace(element?.JobItemName || "");

      if (keys.length > 0) {
        // Multi-field item: build merged "Zone1:Pass,Zone2:Pass" value
        const row = {};
        keys.forEach((k) => { row[k] = dataValue; });
        nextMultiValues[element.JobItemID] = row;

        const merged = keys.map((k) => `${k}:${dataValue}`).join(",");
        try {
          handleInputChange({ target: { value: merged } }, element);
        } catch (error) {
          console.log(error);
        }
      } else {
        // Simple field: update DOM + handleInputChange
        try {
          const el = document.getElementById(
            `${element.JobItemID}/${jobData.LINE_NAME}`
          );
          if (el) el.value = dataValue;
        } catch (error) {
          console.log(error);
        }

        try {
          handleInputChange({ target: { value: dataValue } }, element);
        } catch (error) {
          console.log(error);
        }
      }
    });

    // Update multiValues state once for all multi-field items
    if (Object.keys(nextMultiValues).length > 0) {
      setMultiValues((prev) => ({ ...prev, ...nextMultiValues }));
    }
  };



const isEmptyValue = (v) => {
  return v === null || v === undefined || String(v).trim() === "";
};

const isMultiFieldMissing = (item, key) => {
  return isEmptyValue(multiValues?.[item.JobItemID]?.[key]);
};


  const shouldUseMulti = (jobItemName = "") => {
    const s = String(jobItemName);
    return s.includes("{") && s.includes(",");
  };

  const parseKeysInBrace = (jobItemName = "") => {
    if (!shouldUseMulti(jobItemName)) return [];
    const m = String(jobItemName).match(/\{([^}]+)\}/);
    if (!m) return [];
    return m[1]
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const parseKeyValuePairs = (s = "") => {
    const out = {};
    String(s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((part) => {
        const [k, ...rest] = part.split(":");
        const key = (k || "").trim();
        const val = rest.join(":").trim();
        if (key) out[key] = val;
      });
    return out;
  };

  useEffect(() => {
    const next = {};

    (jobItems || []).forEach((item) => {
      const keys = parseKeysInBrace(item.JobItemName);
      if (keys.length === 0) return;

      const raw = String(item.ActualValue || "").trim();
      const mapByPair = raw.includes(":") ? parseKeyValuePairs(raw) : null;

      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      next[item.JobItemID] = {};
      keys.forEach((k, i) => {
        next[item.JobItemID][k] =
          (mapByPair && mapByPair[k] !== undefined ? mapByPair[k] : parts[i]) ??
          "";
      });
    });

    setMultiValues(next);
  }, [jobItems]);

const handleMultiChange = (item, key, value) => {
  setMultiValues((prev) => {
    const id = item.JobItemID;
    const row = { ...(prev[id] || {}), [key]: value };
    const keys = parseKeysInBrace(item.JobItemName);
    const merged = keys.map((k) => `${k}:${row[k] ?? ""}`).join(",");

    try {
      handleInputChange({ target: { value: merged } }, item);
    } catch (err) {
      console.log(err);
    }

    return { ...prev, [id]: row };
  });
};

  const handleToviewApproves = async (jobDataInfo) => {
    try {
      const response = await fetch(
        `/api/job/get-approves-by-job-id?job_id=${encodeURIComponent(
          jobDataInfo.JobID
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          next: { revalidate: 10 },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch roles");

      const responseData = await response.json();

      const tableHtml = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom:1px solid #ddd; padding:8px;">Name</th>
              <th style="border-bottom:1px solid #ddd; padding:8px;">Username</th>
            </tr>
          </thead>
          <tbody>
            ${(responseData.Approvers || [])
              .map(
                (u) => `
                <tr>
                  <td style="padding:6px; border-bottom:1px solid #eee;">👤 ${u.EMP_NAME}</td>
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
    setIsSubmitting(true);
    handleSubmit(e);
    setTimeout(() => setIsSubmitting(false), 15000);
  };

  const handleUploadFileToJobItemResize = (item, inputSelect) => {
    jobItemSelectedRef.current = item;
    imgItemSelectBeforeUploadRef.current = inputSelect;

    try {
      const fileInput = document.getElementById("item-fileInput");
      fileInput.setAttribute("data-upload-type", "resize");
      fileInput.click();
    } catch (error) {
      console.error(error);
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

  const handleGuideItemSelected = (valueItem, item) => {
    try {
      const el = document.getElementById(
        `${item.JobItemID}/${jobData.LINE_NAME}`
      );
      if (el) el.value = valueItem;
    } catch (error) {}

    try {
      handleInputChange({ target: { value: valueItem } }, item);
    } catch (error) {}
  };

  const handleHiddenSelectGuideInput = (item) => {
    try {
      const el = document.getElementById(`guide-input-panel-${item.JobItemID}`);
      if (el) el.style.display = "none";
    } catch (error) {}
  };

  const handleOnFocusItemInput = (item) => {
    if (item.input_type === "Numeric") return;

    jobItems.forEach((element) => {
      if (element.JobItemID === item.JobItemID) return;
      try {
        const el = document.getElementById(
          `guide-input-panel-${element.JobItemID}`
        );
        if (el) el.style.display = "none";
      } catch (error) {}
    });

    const target = document.getElementById(`guide-input-panel-${item.JobItemID}`);
    if (!target) return;

    if (target.style.display === "block") {
      target.style.display = "none";
    } else {
      target.style.display = "block";
    }
  };

  const handleUploadFileToJobItemOnChange = async (event) => {
    const file = event.target.files?.[0];
    const jobItemSelected = jobItemSelectedRef.current;
    const imgItemSelectBeforeUpload = imgItemSelectBeforeUploadRef.current;

    if (!file || !jobItemSelected) return;

    try {
      const valuePath = await uploadJobItemPictureToServer(file);

      const imgEl = document.getElementById(
        `item-img-${imgItemSelectBeforeUpload}-${jobItemSelected.JobItemID}`
      );

      if (imgEl) {
        imgEl.src = URL.createObjectURL(file);
        imgEl.style.display = "block";
      }

      onItemImgChange(valuePath, jobItemSelected, imgItemSelectBeforeUpload);
    } catch (error) {
      alert("Code 01 => " + error.message);
    } finally {
      event.target.value = "";
    }
  };

  const uploadJobItemPictureToServer = async (inputFile) => {
    if (!inputFile) {
      alert("Please select a file first.");
      return;
    }

    const uploadType = document
      .getElementById("item-fileInput")
      ?.getAttribute("data-upload-type");

    const uploadUrl =
      uploadType === "resize"
        ? "/api/uploadPicture/ItemResize"
        : "/api/uploadPicture/Item";

    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("job_item_id", jobItemSelectedRef.current?.JobItemID);

    try {
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();

      if (data.result) return data.filePath;
      throw new Error(data.error || "Upload failed");
    } catch (error) {
      alert("An error occurred while uploading the file. " + error.message);
      throw error;
    }
  };

  const colorValues = [
    "Pass",
    "OK",
    "Good",
    "Not Change",
    "Fail",
    "Change",
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
    return colors.get(String(value || "").toLowerCase()) || "rgba(0, 0, 0, 0)";
  };

  function handleShowHistory(item) {
    const safe = (v) =>
      v === null || v === undefined || v === "" ? "-" : String(v);

    Swal.fire({
      title: "History",
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6">
          <div style='display:none;'><b>BeforeValue2:</b> ${safe(
            item.BeforeValue2
          )}</div>
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

  const selectedWdTagValue =
    machineAsLinename?.value && machineAsLinename?.label
      ? machineAsLinename
      : jobData?.WD_TAG
      ? { value: jobData.WD_TAG, label: jobData.WD_TAG }
      : null;

  const selectedMachineValue = selectedMachine
    ? selectedMachine
    : jobData?.MachineName
    ? {
        value: jobData?.WD_TAG || jobData?.MachineName,
        label: jobData.MachineName,
        wd_tag: jobData?.WD_TAG || "",
      }
    : null;

  return (
    <>
      {pageLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
            <div className="text-gray-800 font-semibold">
              Loading checklist items...
            </div>
            <div className="text-gray-500 text-sm">Please wait</div>
          </div>
        </div>
      )}

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
          <Link href="/pages/dashboard" className="inline-flex items-center">
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
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Checklist Id
            </label>
            <textarea
              rows={2}
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 bg-gray-100 resize-none whitespace-pre-wrap break-words leading-snug"
              value={String(jobData?.JobID ?? "")}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Checklist Name
            </label>
            <textarea
              rows={2}
              value={jobData?.Name || ""}
              disabled
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 bg-gray-100 resize-none whitespace-pre-wrap break-all"
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Document No.
            </label>
            <textarea
              rows={2}
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 bg-gray-100 resize-none whitespace-pre-wrap break-words leading-snug"
              value={String(jobData?.DocumentNo ?? "")}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Line Name.
            </label>
            <textarea
              rows={2}
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 bg-gray-100 resize-none whitespace-pre-wrap break-words leading-snug"
              value={String(jobData?.LINE_NAME ?? "")}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Checklist Version
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.ChecklistVer || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Workgroup Name
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.WorkgroupName || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Activated By
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.ActivatedBy || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Submitted By
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.SubmittedBy || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Timeout
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.Timeout || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Activated At
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.ActivatedAt || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              LastestUpdate At
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.LastestUpdate || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Submitted At
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.SubmitedAt || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm z-10">
              Status
            </label>
            <input
              type="text"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2"
              value={jobData?.Status || ""}
              disabled
            />
          </div>

          <div className="relative flex flex-col">
            {!view ? (
              <label className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                <span>
                  {process.env.NEXT_PUBLIC_LABEL_WD_TAG || "WD Tag"} [{machines.length}]
                </span>

                <Tooltip
                  title="ปุ่มสำหรับกรองเครื่องที่ถูกสร้างภายใน workgroup นี้ Slide ปิด เพื่อแสดงจำนวนเครื่องทั้งหมด"
                  placement="top"
                  arrow
                  open={showWdTagTip}
                  disableHoverListener
                  disableFocusListener
                  disableTouchListener
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: "14px",
                        fontWeight: 500,
                        backgroundColor: "#5577e6ff",
                        color: "#FFFFFF",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "#1E40AF",
                      },
                    },
                  }}
                >
                  <span className="inline-block w-0 h-0" />
                </Tooltip>

                <button
                  type="button"
                  onClick={() => onWdTagEnabledChange?.(!wdTagEnabled)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                    wdTagEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-pressed={wdTagEnabled}
                  aria-label="Toggle WD Tag"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      wdTagEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            ) : (
              <label className="text-sm text-gray-600 font-semibold">
                {process.env.NEXT_PUBLIC_LABEL_WD_TAG || "WD Tag"}
              </label>
            )}

            {view ? (
              <input
                className="border rounded-md px-3 py-2 bg-gray-100"
                value={jobData?.WD_TAG || ""}
                disabled
              />
            ) : (
              <Select
                inputId="my-wd-tag-select"
                options={wdTagOptions}
                value={selectedWdTagValue}
                onChange={handleWdChange}
                name="wd_tag"
                placeholder="Select WD-Tag..."
              />
            )}
          </div>

          <div className="relative flex flex-col">
            <label className="text-sm text-gray-600 font-semibold">
              {process.env.NEXT_PUBLIC_LABEL_MACHINE_NAME || "Machine"}
            </label>

            {view ? (
              <input
                className="border rounded-md px-3 py-2 bg-gray-100"
                value={jobData?.MachineName || "No Machine Assigned"}
                disabled
              />
            ) : (
              <Select
                inputId="my-machine-select"
                options={machineOptions}
                value={selectedMachineValue}
                onChange={handleMachineChange}
                placeholder="Select Machine..."
              />
            )}
          </div>

          <div className="flex flex-col">
            <div
              onClick={() => setShowPanel(!showPanel)}
              className="cursor-pointer w-full border text-right text-sm ipadmini:text-md font-bold text-gray-800 pb-1"
              style={{ borderRadius: "0.5em" }}
            >
              Job Evident &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {showPanel ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </div>

            <div
              className={`${showPanel ? "" : "hidden"}`}
              style={{ position: "relative" }}
            >
              <div className="flex flex-col" style={{ position: "relative" }}>
                <label className="text-sm ipadmini:text-md font-bold text-gray-600">
                  &nbsp; Sticker Before
                </label>

                <div
                  className="flex flex-col items-center"
                  style={{ position: "absolute", right: "5px" }}
                >
                  <input
                    type="file"
                    id="fileInput-1"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadFileToJob(e.target.files[0], "fileInput-1")
                    }
                    accept="image/*"
                  />

                  {user?.role === "Admin Group" ? (
                    <label htmlFor="fileInput-1" className="cursor-pointer">
                      <img
                        src="/assets/images/image.png"
                        alt="upload"
                        width={30}
                        height={30}
                      />
                    </label>
                  ) : null}
                </div>

                {preview_1 && (
                  <img src={preview_1} alt="Preview" width={200} className="mt-4" />
                )}

                {jobData?.IMAGE_FILENAME && (
                  <img
                    src={`/api/viewPicture?imgName=${jobData.IMAGE_FILENAME}`}
                    alt="Preview"
                    width={200}
                    className="mt-4"
                    onClick={() =>
                      onclicktoShow(`/api/viewPicture?imgName=${jobData.IMAGE_FILENAME}`)
                    }
                  />
                )}
              </div>

              <p style={{ borderBottom: "2px solid gray", padding: "5px" }}></p>

              <div
                className="flex flex-col"
                style={{ position: "relative", paddingTop: "5px" }}
              >
                <label className="text-sm ipadmini:text-md font-bold text-gray-600">
                  &nbsp; Sticker After
                </label>

                <div
                  className="flex flex-col items-center"
                  style={{ position: "absolute", right: "5px" }}
                >
                  <input
                    type="file"
                    id="fileInput-2"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadFileToJob(e.target.files[0], "fileInput-2")
                    }
                    accept="image/*"
                  />

                  {user?.role === "Admin Group" ? (
                    <label htmlFor="fileInput-2" className="cursor-pointer">
                      <img
                        src="/assets/images/image.png"
                        alt="upload"
                        width={30}
                        height={30}
                      />
                    </label>
                  ) : null}
                </div>

                {preview_2 && (
                  <img src={preview_2} alt="Preview" width={200} className="mt-4" />
                )}

                {jobData?.IMAGE_FILENAME_2 && (
                  <img
                    src={`/api/viewPicture?imgName=${jobData.IMAGE_FILENAME_2}`}
                    alt="Preview"
                    width={200}
                    className="mt-4"
                    onClick={() =>
                      onclicktoShow(`/api/viewPicture?imgName=${jobData.IMAGE_FILENAME_2}`)
                    }
                  />
                )}
              </div>
            </div>

            <div className="p-5">
              {jobData?.DISAPPROVE_REASON ? (
                <div>
                  <ChatIcon className="text-blue-600 size-8 cursor-default" />
                  {" : " + jobData.DISAPPROVE_REASON}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm ipadmini:text-md font-bold text-gray-600">
              <InfoIcon onClick={() => handleToviewApproves(jobData)} /> Approve By :
              <a href="#" style={{ color: "blue", textDecorationLine: "underline" }}>
                {" "}
                {jobData?.ApproverName || ""}
              </a>
            </label>
          </div>
        </div>

        <hr />

        <div className="flex flex-col gap-2">
          <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
            <div style={{ position: "relative", display: "inline-block", width: "20em" }}>
              <h1 className="text-2xl font-bold text-primary flex items-center cursor-pointer">
                Checklist Items
                {isShowJobItem ? (
                  <ArrowDropUpIcon style={{ fontSize: "5rem" }} onClick={toggleJobItem} />
                ) : (
                  <ArrowDropDownIcon style={{ fontSize: "5rem" }} onClick={toggleJobItem} />
                )}
              </h1>
            </div>

            {!view && (
              <div
                onClick={toggleMenu}
                className="absolute right-1 inline-block w-8 hover:border-[3px] transition-transform duration-200 hover:scale-125"
              >
                <AutorenewIcon
                  className="text-black text-[32px] transition-transform duration-[5500ms] ease-in-out"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
            )}

            {isMenuVisible && (
              <div className="absolute top-10 right-0 bg-white border border-green-500 shadow-lg p-4 rounded-lg w-48 z-20">
                <p className="text-sm text-gray-800 border-b border-gray-400 cursor-default">
                  ***Fill Items***
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 cursor-default">
                  <li
                    onClick={() => autoFullItems("Pass")}
                    className="hover:bg-yellow-100 cursor-pointer px-2 py-1"
                  >
                    ⚙️ All "Pass"
                  </li>
                  <li
                    onClick={() => autoFullItems("Line not run")}
                    className="hover:bg-yellow-100 cursor-pointer px-2 py-1"
                  >
                    ⚙️ All "Line not run"
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className={`overflow-x-auto ${isShowJobItem ? "" : "hidden"} flex flex-col gap-1`}>
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
                  <th className="w-[50px]">
                    {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE}[{jobItems.length}]
                  </th>
                  <th className="w-[50px]">
                    {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME}
                  </th>
                  <th className="w-[150px] px-4 py-2">
                    {process.env.NEXT_PUBLIC_UPPER_SPEC}/{process.env.NEXT_PUBLIC_LOWER_SPEC}
                  </th>
                  <th className="w-[150px] px-4 py-2">Actual Value</th>
                  <th className="w-[150px] px-4 py-2">Attach</th>
                </tr>
              </thead>

              <tbody className="text-center">
                {jobItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 w-[25vw] max-w-[25vw] align-middle">
                      <div className="whitespace-normal break-words">
                        {item.JobItemTitle}
                      </div>
                    </td>

                    <td className="border px-3 py-2 relative w-[25vw] max-w-[25vw]">
                      <div
                        className="pr-10 whitespace-normal break-words"
                        title={item.JobItemName?.replace(/\{[^}]*\}/g, "").trim()}
                      >
                        {item.JobItemName?.replace(/\{[^}]*\}/g, "").trim()}
                      </div>

                      <InfoIcon
                        className="absolute bottom-1 right-1 text-blue-600 size-5 cursor-pointer"
                        onClick={() => handleShowTestMethodDescription(item)}
                      />
                    </td>

                    <td className="border px-4 py-2 w-[150px]">
                      <div>
                        {process.env.NEXT_PUBLIC_UPPER_SPEC}{" "}
                        <b style={{ color: "red", fontWeight: "1200" }}>↑</b> : {item.UpperSpec}
                      </div>
                      <div>
                        {process.env.NEXT_PUBLIC_LOWER_SPEC}{" "}
                        <b style={{ color: "blue", fontWeight: "1200" }}>↓</b> : {item.LowerSpec}
                      </div>
                    </td>

                    <td className="border px-4 py-2 relative w-[25vw] max-w-[25vw]">
                      <div className="flex items-center gap-3 w-full">
                        <span className="absolute bottom-1 right-1 cursor-pointer">
                          <HistoryIcon
                            sx={{ color: "#1E40AF", fontSize: 25 }}
                            onClick={() => handleShowHistory(item)}
                          />
                        </span>

                        <div className="flex-1">
                          {(() => {
                            const keys = parseKeysInBrace(item.JobItemName);
                            const isMulti = keys.length > 0;

                            const combined = [
                              item.ActualValue ?? "",
                              item.Value !== null &&
                              item.Value !== undefined &&
                              item.Value !== ""
                                ? item.Value
                                : "",
                            ]
                              .filter(Boolean)
                              .join(",");

                            const viewMap = isMulti ? parseKeyValuePairs(combined) : null;

                           if (view) {
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
                                                  disabled={view}
                                                  onChange={(e) => handleMultiChange(item, k, e.target.value)}
                                                  className={`w-full text-center rounded-lg border px-3 py-1.5 text-sm ${
                                                    isMultiFieldMissing(item, k)
                                                      ? "border-red-400 bg-red-50"
                                                      : "border-gray-300"
                                                  }`}
                                                  placeholder={`Enter ${k}`}
                                                />

                                                {isMultiFieldMissing(item, k) && (
                                                  <div className="mt-1 text-xs text-red-500 text-center">
                                                    Please enter {k}
                                                  </div>
                                                )}
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
                                        id={item.JobItemID}
                                        value={combined}
                                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg text-center w-full p-1.5 cursor-default"
                                        disabled
                                        style={{
                                          backgroundColor: getPastelColorForValue(item.ActualValue || ""),
                                        }}
                                      />
                                    </div>
                                  );
                                }

                            if (item.input_type === "Numeric") {
                              return (
                                <input
                                  type="number"
                                  step="0.01"
                                  id={`${item.JobItemID}/${jobData.LINE_NAME}`}
                                  defaultValue={item.ActualValue || ""}
                                  onChange={(e) => handleInputChange(e, item)}
                                  className="bg-white border w-[80%] border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center p-1.5 rounded-lg"
                                  placeholder="Enter value"
                                  onFocus={() => handleOnFocusItemInput(item)}
                                  autoComplete="on"
                                />
                              );
                            }

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
                                            onChange={(e) =>
                                              handleMultiChange(item, k, e.target.value)
                                            }
                                            className="w-full text-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <input
                                type="text"
                                id={`${item.JobItemID}/${jobData.LINE_NAME}`}
                                defaultValue={item.ActualValue || ""}
                                onChange={(e) => handleInputChange(e, item)}
                                className="bg-white border border-gray-300 text-gray-900 text-sm ring-secondary ring-1 focus:ring-blue-500 focus:border-blue-500 text-center w-[80%] p-1.5 rounded-lg"
                                placeholder="Enter value"
                                onFocus={() => handleOnFocusItemInput(item)}
                                autoComplete="on"
                              />
                            );
                          })()}
                        </div>

                        <span className="shrink-0 absolute top-1 right-1 cursor-pointer">
                          {view ? (
                            item.Comment !== null ? (
                              <ChatIcon
                                className="text-blue-600 size-6 cursor-pointer"
                                onClick={() => handleShowComment(item)}
                                title="Show comment"
                              />
                            ) : (
                              <span className="w-6 h-6 inline-block" />
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
                              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                              <option value="" disabled>
                                — Select —
                              </option>
                              <option value="Pass">✅ Pass</option>
                              <option value="Fail">❌ Fail</option>
                              {item.guide_input?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                              ▾
                            </span>
                          </div>

                          <div className="relative flex-1">
                            <input
                              type="text"
                              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              placeholder="Optional"
                              defaultValue={item.Value || ""}
                              onChange={(e) => handleOptionInputChange(e, item)}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleHiddenSelectGuideInput(item)}
                            title="Hide panel"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-sm font-medium shadow-sm hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer select-none"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="border py-2 relative">
                      <center>
                        {item.IMG_ATTACH && (
                          <img
                            src={`/api/viewPictureItem?imgName=${item.IMG_ATTACH}`}
                            alt="Preview"
                            width={200}
                            className="mt-4"
                            onClick={() =>
                              onclicktoShow(`/api/viewPictureItem/?imgName=${item.IMG_ATTACH}`)
                            }
                          />
                        )}

                        {item.IMG_ATTACH_1 && (
                          <img
                            src={`/api/viewPictureItem?imgName=${item.IMG_ATTACH_1}`}
                            alt="Preview"
                            width={200}
                            className="mt-4"
                            onClick={() =>
                              onclicktoShow(`/api/viewPictureItem/?imgName=${item.IMG_ATTACH_1}`)
                            }
                          />
                        )}
                      </center>

                      {view === false && (
                        <div className="relative">
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="flex flex-col justify-center items-center p-2">
                              <img
                                id={`item-img-1-${item.JobItemID}`}
                                style={{
                                  display: "none",
                                  border: "1px solid gray",
                                  borderRadius: "0.1em",
                                }}
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

                            <div className="flex flex-col justify-center items-center p-2">
                              <img
                                id={`item-img-2-${item.JobItemID}`}
                                style={{
                                  display: "none",
                                  border: "1px solid gray",
                                  borderRadius: "0.1em",
                                }}
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
            {!view && jobData?.Status && jobData.Status !== "complete" && (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-14 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-secondary"
                }`}
              >
                {isSubmitting ? "Waiting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default JobForm;