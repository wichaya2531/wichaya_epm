"use client";
import Layout from "@/components/Layout.js";
import useFetchJobValue from "@/lib/hooks/useFetchJobValue";
import React, { useEffect, useState, useMemo, useCallback, memo, useTransition } from "react";
import Swal from "sweetalert2";
import TestMethodDescriptionModal from "@/components/TestMethodDescriptionModal";
import ItemInformationModal from "@/components/ItemInformationModal";
import { useRouter } from "next/navigation";
import JobForm from "./JobForm";
import useFetchUser from "@/lib/hooks/useFetchUser.js";

const Page = ({ searchParams }) => {
  const [refresh, setRefresh] = useState(false);
  const [, startTransition] = useTransition();

  const [wdTagEnabled, setWdTagEnabled] = useState(true);
  const [wdTagInitDone, setWdTagInitDone] = useState(false);

  const [pageExpire, setPageExpire] = useState(false);
  const router = useRouter();
  const job_id = searchParams.job_id;
  const [view, setView] = useState(true);

  const [machines, setMachines] = useState([]);
  const [machinesLoaded, setMachinesLoaded] = useState(false);

  // -------------------- LocalStorage key --------------------
  const WD_TAG_LS_KEY = "viewJobs_wdTagEnabled";

  const handleWdTagEnabledChange = (enabled) => {
    const val = !!enabled;
    setWdTagEnabled(val);
    // บันทึกการตั้งค่าลง LocalStorage
    try { localStorage.setItem(WD_TAG_LS_KEY, String(val)); } catch {}
  };

  const toId = (v) => {
    if (!v) return "";
    if (typeof v === "object" && v.$oid) return String(v.$oid);
    return String(v);
  };

  const isEmptyValue = (v) => {
    return v === null || v === undefined || String(v).trim() === "";
  };

  const shouldUseMulti = (jobItemName = "") => {
    const s = String(jobItemName || "");
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

  const validateMultiItem = (item) => {
    const keys = parseKeysInBrace(item?.JobItemName || "");
    if (keys.length === 0) {
      return {
        valid: !isEmptyValue(item?.ActualValue),
        missingKeys: [],
      };
    }

    const valueMap = parseKeyValuePairs(item?.ActualValue || "");
    const missingKeys = keys.filter((k) => isEmptyValue(valueMap[k]));

    return {
      valid: missingKeys.length === 0,
      missingKeys,
    };
  };

  useEffect(() => {
    const loadMachines = async () => {
      try {
        let localStorageMachines = localStorage.getItem("machines");
        if (localStorageMachines !== null) {
          localStorageMachines = JSON.parse(localStorageMachines);
          setMachines(localStorageMachines);
        } else {
          const url = `/api/machine/get-machines`;
          const res = await fetch(url, {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const dataResponse = await res.json();
          setMachines(dataResponse.machines || []);
          localStorage.setItem(
            "machines",
            JSON.stringify(dataResponse.machines || [])
          );
        }
      } catch (err) {
        console.error("loadMachines error:", err);
      } finally {
        setMachinesLoaded(true); // ✅ โหลดเสร็จแล้ว (ไม่ว่าจะสำเร็จหรือ error)
      }
    };

    loadMachines();
  }, []);

  const { jobData, jobItems, isLoading, error } = useFetchJobValue(
    job_id,
    refresh,
    view
  );

  const { user } = useFetchUser(refresh);
  const [isShowJobInfo, setIsShowJobInfo] = useState(true);
  const [isShowJobItem, setIsShowJobItem] = useState(true);
  const [jobItemDetail, setJobItemDetail] = useState(null);
  const [testMethodDescription, setTestMethodDescription] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [wdtagImg_1, setWdtagImg_1] = useState(null);
  const [wdtagImg_2, setWdtagImg_2] = useState(null);
  const [preview_1, setPreview_1] = useState(null);
  const [preview_2, setPreview_2] = useState(null);


  // -------------------- init wdTagEnabled: LocalStorage → jobData fallback --------------------
  // รวมเป็น effect เดียวเพื่อกัน race condition (localStorage อาจถูก jobData override ถ้าแยก effect)
  useEffect(() => {
    if (wdTagInitDone) return;
    if (!jobData) return;

    // 1) ตรวจ LocalStorage ก่อนเสมอ
    try {
      const saved = localStorage.getItem(WD_TAG_LS_KEY);
      if (saved !== null) {
        setWdTagEnabled(saved === "true");
        setWdTagInitDone(true);
        return; // ใช้ค่าจาก LocalStorage → ไม่ต้อง auto-init จาก jobData
      }
    } catch {}

    // 2) ไม่มีใน LocalStorage → ใช้ค่าจาก jobData (logic เดิม)
    const hasWdTag = !!String(jobData?.WD_TAG || "").trim();
    setWdTagEnabled(!hasWdTag);
    setWdTagInitDone(true);
  }, [jobData, wdTagInitDone]);

  const machinesFiltered = useMemo(() => {
    if (!wdTagEnabled) return machines || [];
    const jobWGId = toId(jobData?.WorkGroupID);
    return (machines || []).filter((m) => toId(m?.workgroup_id) === jobWGId);
  }, [machines, wdTagEnabled, jobData?.WorkGroupID]);

  const handleToShowOnClick = (item) => {
    Swal.fire({
      title: "Image Preview",
      html: `
        <div style="width: 50vw; height: auto; aspect-ratio: 4 / 3; display: flex; justify-content: center; align-items: center; overflow: hidden;">
          <img id="swal-image" src="${item}" alt="${item}" style="width: 100%; height: auto; object-fit: contain; transition: transform 0.3s ease;" />
        </div>
        <div style="margin-top: 10px; display: flex; justify-content: center; gap: 10px;">
          <button id="rotate-left" class="swal2-confirm swal2-styled" style="background-color: #3085d6;">⟲</button>
          <button id="ok-button" class="swal2-confirm swal2-styled" style="background-color: #28a745;">Close</button>
          <button id="rotate-right" class="swal2-confirm swal2-styled" style="background-color: #3085d6;">⟳</button>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: "auto",
      didOpen: () => {
        let rotation = 0;

        document.getElementById("rotate-left")?.addEventListener("click", () => {
          rotation -= 90;
          const img = document.getElementById("swal-image");
          if (img) img.style.transform = `rotate(${rotation}deg)`;
        });

        document.getElementById("rotate-right")?.addEventListener("click", () => {
          rotation += 90;
          const img = document.getElementById("swal-image");
          if (img) img.style.transform = `rotate(${rotation}deg)`;
        });

        document.getElementById("ok-button")?.addEventListener("click", () => {
          Swal.close();
        });
      },
    });
  };

  const updateJobStatusToOngoing = async () => {
    if (!user?._id || !user?.workgroup_id || !job_id) return;

    const body = {
      JOB_ID: job_id,
      user_id: user._id,
      workgroup_id: user.workgroup_id,
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

      const msg = await response.json();
      console.log("Job status updated to Ongoing successfully", msg);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    const asyncEffect = async () => {
      if (user && jobData) {
        if (user.workgroup_id && jobData.WorkGroupID) {
          const viewMode = sessionStorage.getItem("viewMode");

          if (user.workgroup_id.toString() !== jobData.WorkGroupID.toString()) {
            setView(true);
          } else {
            if (viewMode === "false") {
              setView(false);
              try {
                await updateJobStatusToOngoing();
              } catch (err) {}

            }

            if (viewMode === "true") {
              setView(true);
            }
          }
        }
      }
    };

    asyncEffect();
  }, [jobItems, user, jobData]);

  const toggleJobInfo = () => {
    setIsShowJobInfo(!isShowJobInfo);
  };

  const handleIMGItemChange = (filePath, item, imgItemSelectBeforeUpload) => {
    const value = filePath;
    for (let t in jobItems) {
      if (jobItems[t].JobItemID == item.JobItemID) {
        if (imgItemSelectBeforeUpload === 1) {
          jobItems[t].IMG_ATTACH = value;
        } else if (imgItemSelectBeforeUpload === 2) {
          jobItems[t].IMG_ATTACH_1 = value;
        }
      }
    }
  };

  const handleInputChange = (e, item) => {
    for (let t in jobItems) {
      if (jobItems[t].JobItemID == item.JobItemID) {
        jobItems[t].value = e.target.value;
        jobItems[t].ActualValue = e.target.value;
      }
    }
  };

  const handleOptionInputChange = (e, item) => {
    for (let t in jobItems) {
      if (jobItems[t].JobItemID == item.JobItemID) {
        jobItems[t].Value = e.target.value;
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
        (item.Comment || "") +
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
        for (let t in jobItems) {
          if (jobItems[t].JobItemID === item.JobItemID) {
            jobItems[t].Comment = result.value;
          }
        }
      }
    });
  };

  const handleUploadFileToJob = (files, event) => {
    const file = files;
    if (!file) return;

    if (event === "fileInput-1") {
      setPreview_1(URL.createObjectURL(file));
    } else if (event === "fileInput-2") {
      setPreview_2(URL.createObjectURL(file));
    }

    setTimeout(() => {
      uploadJobPictureToServer(file, event);
    }, 10);
  };

  const uploadJobPictureToServer = async (inputFile, selector) => {
    if (!inputFile || !jobData?.JobID) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("job_id", jobData.JobID);
    formData.append("selector", selector);

    try {
      const res = await fetch("/api/uploadPicture", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.result) {
        if (selector === "fileInput-1") {
          setWdtagImg_1(data.filePath);
        } else if (selector === "fileInput-2") {
          setWdtagImg_2(data.filePath);
        }
      } else {
        alert("Failed to upload file. Error " + data.error);
      }
    } catch (error) {
      alert("An error occurred while uploading the file.");
    }
  };

  const handleBeforeValue = (e, item) => {
    const value = e.target.value.trim();

    for (let t in jobItems) {
      if (jobItems[t].JobItemID === item.JobItemID) {
        jobItems[t].BeforeValue2 = value === "" ? "" : value;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const wdTag = e.target.wd_tag?.value?.trim();

    if (!jobData || !jobData.JobID) {
      Swal.fire({
        title: "Error!",
        text: "Job data is missing or invalid.",
        icon: "error",
      });
      return;
    }

    if (!wdTag || wdTag === "....") {
      Swal.fire({
        title: "Error!",
        text: "Please fill in the " + process.env.NEXT_PUBLIC_LABEL_WD_TAG + ".",
        icon: "error",
      });
      return;
    }

    let fillAllItems = true;
    let valueItemABnormal = false;
    let invalidMultiItem = null;

    for (let t in jobItems) {
      const item = jobItems[t];
      const keys = parseKeysInBrace(item?.JobItemName || "");

      if (keys.length > 0) {
        const multiCheck = validateMultiItem(item);

        if (!multiCheck.valid) {
          fillAllItems = false;
          invalidMultiItem = {
            item,
            missingKeys: multiCheck.missingKeys,
          };
          break;
        }
      } else {
        if (isEmptyValue(item?.ActualValue)) {
          fillAllItems = false;
          invalidMultiItem = {
            item,
            missingKeys: [],
          };
          break;
        }
      }

      if (String(item?.ActualValue || "").trim() === "Fail") {
        valueItemABnormal = true;
      }
    }

    if (fillAllItems === false) {
      const itemName =
        invalidMultiItem?.item?.JobItemName?.replace(/\{[^}]*\}/g, "").trim() ||
        "Unknown Item";

      const multiMessage =
        invalidMultiItem?.missingKeys?.length > 0
          ? `Please complete all Multi fields in "${itemName}" : ${invalidMultiItem.missingKeys.join(", ")}`
          : `Please complete "${itemName}".`;

      Swal.fire({
        title: "Error!",
        text: multiMessage,
        icon: "error",
      });
      return;
    }

    const selectedMachineData =
      machinesFiltered.find((m) => m.wd_tag === wdTag) || null;

    const jobInfo = {
      JobID: jobData.JobID,
      wd_tag: wdTag,
      machine_name: selectedMachineData?.name || "",
      mc_tag: {
        WD_TAG: wdTag || "",
        MACHINE_NAME: selectedMachineData?.name || "",
      },
      submittedBy: user?._id,
      wdtagImage_1: wdtagImg_1 || jobData.IMAGE_FILENAME,
      wdtagImage_2: wdtagImg_2 || jobData.IMAGE_FILENAME_2,
      valueItemABnormal: valueItemABnormal,
    };

    const formData = new FormData();
    formData.append("jobData", JSON.stringify(jobInfo));
    formData.append("jobItemsData", JSON.stringify(jobItems));

    try {
      const response = await fetch("/api/job/update-job", {
        method: "POST",
        body: formData,
      });

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
      if (data.status === 455 || data.status === 400) {
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
          showCancelButton: true,
          confirmButtonText: "Done/Close",
          cancelButtonText: "Reuse",
        }).then(async (result) => {
          if (result.isConfirmed) {
            setTimeout(() => {
              window.close();
            }, 500);
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            try {
              const response = await fetch(`../api/job/create-new-job-with-template-id`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  template_id: jobData.JobTemplateID,
                  linename: jobData.LINE_NAME,
                  activate_user_id: user?._id,
                }),
              });

              const data = await response.json();
              if (data.status == 200) {
                const new_job_id = data.response._id;
                setTimeout(() => {
                  router.push("/pages/view-jobs?job_id=" + new_job_id);
                }, 1000);
              }
            } catch (err) {
              console.log("Error Code : 133");
              console.error("📄 Stack trace:\n", err.stack);
              console.error("Error update job:", err);
            }
          }
        });

        e.target.reset();
      }
    } catch (err) {
      console.log("Error Code : 134");
      console.error("📄 Stack trace:\n", err.stack);
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
        <p><strong>Description&nbsp;:&nbsp;</strong> ${item.description || ""}</p>
        <p style="display:none;"><strong>Test Location&nbsp;:&nbsp;</strong> ${
          item.TestLocationName || ""
        }</p>
        <p><strong>Test Method&nbsp;:&nbsp;</strong> ${item.TestMethod || ""}</p>
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

  const uniqueBy = (arr, keyFn) => {
    const seen = new Set();
    return arr.filter((x) => {
      const k = keyFn(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const wdTagOptions = useMemo(() => uniqueBy(
    (Array.isArray(machinesFiltered) ? machinesFiltered : [])
      .filter((m) => m?.wd_tag)
      .map((m) => ({ value: m.wd_tag, label: m.wd_tag })),
    (x) => x.value
  ), [machinesFiltered]);

  const machineOptions = useMemo(() => uniqueBy(
    (Array.isArray(machinesFiltered) ? machinesFiltered : [])
      .filter((m) => m?.name)
      .map((m) => ({
        value: m._id || m.name,
        label: m.name,
        wd_tag: m.wd_tag || "",
      })),
    (x) => x.value
  ), [machinesFiltered]);


  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <JobForm
        jobData={jobData || {}}
        jobItems={jobItems || []}
        machines={machinesFiltered}
        wdTagEnabled={wdTagEnabled}
        onWdTagEnabledChange={handleWdTagEnabledChange}
        handleInputChange={handleInputChange}
        handleOptionInputChange={handleOptionInputChange}
        handleBeforeValue={handleBeforeValue}
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
        onItemImgChange={handleIMGItemChange}
        preview_1={preview_1}
        preview_2={preview_2}
        onclicktoShow={handleToShowOnClick}
        user={user || {}}
        wdTagOptions={wdTagOptions}
        machineOptions={machineOptions}
        machinesLoaded={machinesLoaded}
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
    </Layout>
  );
};

export default Page;