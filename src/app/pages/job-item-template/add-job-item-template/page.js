"use client";
import Layout from "@/components/Layout.js";
import TableComponent from "@/components/TableComponent.js";
import { config } from "@/config/config.js";
import useFetchJobItemTemplates from "@/lib/hooks/useFetchJobItemTemplates";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchJobTemplate from "@/lib/hooks/useFetchJobTemplate";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
import useFetchCards from "@/lib/hooks/useFetchCards";
import { useState, useEffect } from "react";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FaFileCsv, FaDownload } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";

const jobItemTemplateHeader = [
  "ID",
  "Title",
  "Name",
  "Upper_Lower",
  "input_type",
  "Create At",
  "Action",
];
const enabledFunction = {
  "add-job-item-template": "6638600dd81a314967236df5",
  "remove-job-item-template": "66386025d81a314967236df7",
};

const Page = ({ searchParams }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPicture, setItemPicture] = useState(null);
  const [uploadMode, setUploadMode] = useState("resize");
  const jobTemplate_id = searchParams.jobTemplate_id;
  const [refresh, setRefresh] = useState(false);
  const { jobItemTemplates, isLoading: jobItemTemplatesLoading } =
    useFetchJobItemTemplates(jobTemplate_id, refresh);
  const { user, isLoading: userLoading } = useFetchUser(refresh);
  const { jobTemplate, isLoading: jobTemplateLoading } = useFetchJobTemplate(
    jobTemplate_id,
    refresh
  );
  const { locations, isLoading: locationsLoading } =
    useFetchTestLocations(refresh);
  const { cards } = useFetchCards(refresh);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewPictureItem, setPreviewPictureItem] = useState(
    "/assets/images/image.png"
  );

  const pageCard = cards?.find(
    (card) => card.LINK && card.LINK.some((link) => pathname?.includes(link))
  );

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const filePath = await uploadJobPictureToServer(file);
      setPreviewPictureItem("/api/viewItem-template?imgName=" + filePath);
      setSelectedFile(true);
      setItemPicture(filePath);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const openActionMenu = (jobItemTemplate) => {
    const canRemove =
      user &&
      user.actions &&
      user.actions.some(
        (action) => action._id === enabledFunction["remove-job-item-template"]
      );

    Swal.fire({
      title: "Choose Action",
      showCloseButton: true,
      showConfirmButton: false,
      html: `
  <style>
    .swal-actions{
      display:grid;
      grid-template-columns: repeat(2, 1fr);
      gap:8px;
      margin-top:8px;
    }
    .swal-btn{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      width:100%;
      padding:10px 8px;
      border-radius:10px;
      border:1px solid rgba(0,0,0,.12);
      background:#fff;
      color:#111827;
      font-weight:700;
      font-size:13px;
      box-shadow:0 6px 16px rgba(0,0,0,.08);
      cursor:pointer;
      user-select:none;
      transition:transform .08s ease, box-shadow .18s ease, filter .18s ease;
    }
    .swal-btn:hover{
      transform:translateY(-1px);
      box-shadow:0 10px 22px rgba(0,0,0,.12);
      filter:brightness(.97);
    }
    .swal-btn:active{
      transform:translateY(0) scale(.98);
      box-shadow:0 4px 10px rgba(0,0,0,.10);
    }
    .swal-btn.primary { background:#2563eb; border-color:#1d4ed8; color:#fff; }
    .swal-btn.danger  { background:#dc2626; border-color:#b91c1c; color:#fff; }
    .swal-btn[disabled]{
      opacity:.45;
      cursor:not-allowed;
      transform:none !important;
      box-shadow:none !important;
      filter:none !important;
    }
    .swal-note{
      margin-top:10px;
      font-size:12px;
      opacity:.72;
      text-align:center;
    }
  </style>
  <div class="swal-actions">
    <button id="swal-edit"   class="swal-btn primary"><span>✏️</span><span>Edit</span></button>
    <button id="swal-remove" class="swal-btn danger"  ${!canRemove ? "disabled" : ""}><span>🗑️</span><span>Remove</span></button>
  </div>
  <div class="swal-note">* ปุ่มที่ถูกปิดสิทธิ์จะกดไม่ได้</div>
`,
      didOpen: () => {
        const editBtn = document.getElementById("swal-edit");
        const removeBtn = document.getElementById("swal-remove");

        editBtn?.addEventListener("click", () => {
          Swal.close();
          router.push(
            `/pages/edit-job-item-template?jobItemTemplate_id=${jobItemTemplate._id}&jobTemplate_id=${jobTemplate_id}`
          );
        });

        if (removeBtn && canRemove) {
          removeBtn.addEventListener("click", () => {
            Swal.close();
            handleRemove(jobItemTemplate._id);
          });
        }
      },
    });
  };

  const handleUploadFileToJob = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const filePath = await uploadJobPictureToServer(file);
      console.log("filePath", filePath);
      setPreviewPictureItem("/api/viewItem-template?imgName=" + filePath);
      setSelectedFile(true);
      setItemPicture(filePath);
    }
  };

  const uploadJobPictureToServer = async (inputFile) => {
    if (!inputFile) {
      alert("Please select a file first.");
      return null;
    }
    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("JOB_Template_ID", jobTemplate_id);

    const url =
      uploadMode === "resize"
        ? "/api/uploadPicture/Item-templateResize"
        : "/api/uploadPicture/Item-template";

    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.result) {
        return data.filePath;
      } else {
        alert("An error occurred while uploading the file.");
        return null;
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the file.");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.target);
    const data = {
      AUTHOR_ID: user._id,
      JOB_ITEM_TEMPLATE_TITLE: form.get("job_item_template_title"),
      JOB_ITEM_TEMPLATE_NAME: form.get("job_item_template_name"),
      UPPER_SPEC: form.get("upper_spec"),
      LOWER_SPEC: form.get("lower_spec"),
      TEST_METHOD: form.get("test_method"),
      JOB_TEMPLATE_ID: jobTemplate_id,
      JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
      TEST_LOCATION_ID: "667b915a596b4d721ec60c40",
      INPUT_CONVERT: form.get("input-convert") === "on" ? true : false,
    };

    const formData = new FormData();
    formData.append("AUTHOR_ID", data.AUTHOR_ID);
    formData.append("JOB_ITEM_TEMPLATE_TITLE", data.JOB_ITEM_TEMPLATE_TITLE);
    formData.append("JOB_ITEM_TEMPLATE_NAME", data.JOB_ITEM_TEMPLATE_NAME);
    formData.append("UPPER_SPEC", data.UPPER_SPEC);
    formData.append("LOWER_SPEC", data.LOWER_SPEC);
    formData.append("TEST_METHOD", data.TEST_METHOD);
    formData.append("JOB_TEMPLATE_ID", data.JOB_TEMPLATE_ID);
    formData.append("JobTemplateCreateID", data.JobTemplateCreateID);
    formData.append("TEST_LOCATION_ID", data.TEST_LOCATION_ID);
    formData.append("INPUT_CONVERT", data.INPUT_CONVERT);
    formData.append("FILE", itemPicture);

    try {
      const response = await fetch(
        `/api/job-item-template/create-job-item-template`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        Swal.fire("Success", "Product added successfully", "success");
        setRefresh((prev) => !prev);
      } else {
        Swal.fire("Error", result.message || "Failed to add product", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to add product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        Swal.fire("Error", "The file has no data.", "error");
        return;
      }

      const formData = new FormData();

      jsonData.forEach((row) => {
        formData.append(
          "JOB_ITEM_TEMPLATE_TITLE[]",
          row["JOB_ITEM_TEMPLATE_TITLE"]
        );
        formData.append(
          "JOB_ITEM_TEMPLATE_NAME[]",
          row["JOB_ITEM_TEMPLATE_NAME"]
        );
        formData.append("UPPER_SPEC[]", row["UPPER_SPEC"]);
        formData.append("LOWER_SPEC[]", row["LOWER_SPEC"]);
        formData.append("TEST_METHOD[]", row["TEST_METHOD"]);

        formData.append("AUTHOR_ID", user._id);
        formData.append("JOB_TEMPLATE_ID", jobTemplate_id);
        formData.append("JobTemplateCreateID", jobTemplate.JobTemplateCreateID);
        formData.append("TEST_LOCATION_ID", "667b915a596b4d721ec60c40");
      });

      if (selectedFile) {
        console.log("upload file from input");
        formData.append("FILE", selectedFile);
      }

      try {
        const response = await fetch(
          "/api/job-item-template/create-job-item-templates",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();
        if (response.ok) {
          Swal.fire("Success", "Data was uploaded successfully.", "success");
        } else {
          Swal.fire("Error", result.message || "An error occurred.", "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          "An error occurred while sending the data.",
          "error"
        );
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadExcel = () => {
    const data = [
      [
        "JOB_ITEM_TEMPLATE_TITLE",
        "JOB_ITEM_TEMPLATE_NAME",
        "UPPER_SPEC",
        "LOWER_SPEC",
        "TEST_METHOD",
      ],
      ["Item A", "Name A", 50, 40, "Method 1"],
      ["Item B", "Name B", 40, 20, "Method 2"],
      ["Item C", "Name C", 60, 35, "Method 3"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Job Templates");

    XLSX.writeFile(wb, "Job_Item_Template.xlsx");
  };

  const handleMqtt = async (jobItemTemplate) => {
    const idToCopy = jobItemTemplate._id;

    Swal.fire({
      title: "Mqtt Topic ID",
      html: `<p>ID: <strong>${idToCopy + "/{Line_name}"}</strong></p>
               <button id="copy-btn" class="swal2-confirm swal2-styled" style="background-color: #3085d6; color: white;">
                   Copy to Clipboard
               </button>

              <div style="border:1px solid none;width:450px;text-align:left;padding:15px;">
                <p style="padding-left:45px;"><strong>[--------Setting Info-------]</strong></p>

                <p style="padding-left:50px;">Broker IP&nbsp;&nbsp;: &nbsp;&nbsp;<strong>${
                  process.env.NEXT_PUBLIC_MQTT_BROKER_IP
                }</strong></p>
                <p style="padding-left:50px;">Broker Port&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${
                  process.env.NEXT_PUBLIC_MQTT_BROKER_PORT
                }</strong></p>
                <p style="padding-left:50px;">User&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${
                  process.env.NEXT_PUBLIC_MQT_USERNAME
                }</strong></p>
                <p style="padding-left:50px;">Pass&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${
                  process.env.NEXT_PUBLIC_MQT_PASSWORD
                }</strong></p>
              </div>
               `,
      showConfirmButton: false,
      didOpen: () => {
        const copyBtn = document.getElementById("copy-btn");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            const textArea = document.createElement("textarea");
            textArea.value = idToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              document.execCommand("copy");
              Swal.fire("Copied!", "ID has been copied to clipboard.", "success");
            } catch (err) {
              console.log("Error Code : 119");
              Swal.fire("Oops!", "Failed to copy ID.", "error");
            }
            document.body.removeChild(textArea);
          });
        }
      },
    });
  };

  const handleRemove = async (jobItemTemplate_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `/api/job-item-template/remove-job-item-template`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobItemTemplate_id }),
          }
        );

        const data = await response.json();

        if (data.status === 200) {
          Swal.fire("Deleted!", "The item has been deleted.", "success");
          setRefresh((prev) => !prev);
        } else {
          Swal.fire("Error!", data.message || "Failed to delete the item.", "error");
        }
      } catch (err) {
        console.log("Error Code : 120");
        console.log("Error", err);
        Swal.fire("Error!", "Failed to delete the item.", "error");
      }
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
  };

  const handleTypeInputSelect = async (b, valueSelected) => {
    const formData = new FormData();
    formData.append("jobItemTemplateID", b._id);
    formData.append("input-type", valueSelected);

    try {
      const res = await fetch(
        "/api/job-item-template/edit-job-item-template/edit-job-item-template-input-type",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log("data=>", data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePosSelect = async (b, valueSelected) => {
    const formData = new FormData();
    formData.append("jobItemTemplateID", b._id);
    formData.append("pos", valueSelected);

    try {
      const res = await fetch(
        "/api/job-item-template/edit-job-item-template/edit-job-item-template-pos",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  const buffer_position_list = jobItemTemplates.map((_, index) => ({
    id: index + 1,
    name: index + 1,
  }));

  const jobItemTemplateBody = jobItemTemplates.map((jobItemTemplate) => {
    return {
      ID: (
        <div className="flex items-center justify-center gap-2">
          <select
            className="p-2"
            onChange={(e) => handlePosSelect(jobItemTemplate, e.target.value)}
          >
            <option value={jobItemTemplate.pos}>{jobItemTemplate.pos}</option>
            {buffer_position_list.map((point) => (
              <option key={point.id} value={point.name}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
      ),
      Title: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
      Name: jobItemTemplate.JOB_ITEM_TEMPLATE_NAME,
      Upper_Lower:
        jobItemTemplate.UPPER_SPEC + "/" + jobItemTemplate.LOWER_SPEC,
      input_type: (
        <div className="flex items-center justify-center gap-2">
          <select
            className="p-2"
            defaultValue={jobItemTemplate.INPUT_TYPE}
            onChange={(e) =>
              handleTypeInputSelect(jobItemTemplate, e.target.value)
            }
          >
            <option value="Numeric">Numeric</option>
            <option value="String">String</option>
          </select>
        </div>
      ),
      "Create At": jobItemTemplate.createdAt,
      Action: (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="text-white font-bold rounded-lg text-sm px-4 py-2 text-center
                      bg-indigo-500 hover:bg-indigo-600 focus:ring-4 focus:outline-none focus:ring-indigo-300"
            onClick={() => openActionMenu(jobItemTemplate)}
          >
            Actions
          </button>
        </div>
      ),
    };
  });

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-7">
      <div className="flex flex-col gap-3 mb-4 p-4 bg-white rounded-xl">
        <h1 className="flex text-2xl font-bold text-primary flex items-center">
          <Link href="/pages/job-item-template">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src={pageCard?.LOGO_PATH || "/assets/card-logo/management.png"}
            alt="wd logo"
            width={50}
            height={50}
          />
          {jobTemplate.JOB_TEMPLATE_NAME}{" "}
        </h1>
        <h1 className="text-1 font-semibold">
          Add Checklist Item to Checklist Template
        </h1>
      </div>
      <div className="flex flex-col gap-4 mb-4 p-4 bg-white rounded-xl">
        <form onSubmit={handleSubmit} className="flex flex-col justify-center ">
          <div className="grid gap-6 mb-6 md:grid-cols-3 row-span-4">
            <div className="flex flex-col gap-4 justify-center items-center w-full row-span-4">
              <div className="flex justify-between space-x-4">
                <div>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg ${
                      uploadMode === "resize"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setUploadMode("resize")}
                  >
                    Resize
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg ${
                      uploadMode === "default"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setUploadMode("default")}
                  >
                    Default
                  </button>
                </div>
              </div>

              <div
                {...getRootProps()}
                id="fileInputDropzone"
                className="px-5 w-full bg-white rounded-2xl h-full border-2 border-[#4398E7] flex justify-center items-center overflow-hidden"
              >
                <input
                  {...getInputProps()}
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={handleUploadFileToJob}
                  accept="image/*"
                />

                <div className="flex flex-col justify-center items-center">
                  {selectedFile ? (
                    <Image
                      src={previewPictureItem}
                      alt="selected"
                      width={200}
                      height={200}
                    />
                  ) : (
                    <>
                      <Image
                        src="/assets/images/image.png"
                        alt="plus"
                        width={50}
                        height={50}
                      />
                      <h1 className="text-secondary">
                        Drop your image here, or click to select one
                      </h1>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  className="bg-red-500 text-sm font-bold text-white px-4 py-2 rounded-lg drop-shadow-lg hover:bg-red-700 hover:text-white"
                  type="button"
                  onClick={handleClearImage}
                >
                  <div className="flex justify-center items-center gap-2">
                    <p>Clear the image</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Author ─────────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="author" className="block text-sm font-medium text-gray-600 mb-1">
                Author
              </label>
              <textarea
                id="author"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none resize-none"
                value={user?.name || ""}
                disabled
                name="author"
                readOnly
              />
            </div>

            {/* ── Item Title ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="job_item_template_title" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE}
              </label>
              <textarea
                id="job_item_template_title"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                name="job_item_template_title"
                required
              />
            </div>

            {/* ── Item Name ───────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="job_item_template_name" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME}
              </label>
              <textarea
                id="job_item_template_name"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                name="job_item_template_name"
                required
              />
            </div>

            {/* ── Upper Spec ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="upper_spec" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_UPPER_SPEC}
              </label>
              <textarea
                id="upper_spec"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                name="upper_spec"
                required
              />
            </div>

            {/* ── Lower Spec ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="lower_spec" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_LOWER_SPEC}
              </label>
              <textarea
                id="lower_spec"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                name="lower_spec"
                required
              />
            </div>

            {/* ── Test Method ─────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="test_method" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_TEST_METHODE}
              </label>
              <textarea
                id="test_method"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                name="test_method"
                required
              />
            </div>

            <div className="select-none">
              <label
                htmlFor="input-convert"
                className="flex items-center space-x-2 text-sm font-medium text-gray-900"
              >
                <input
                  type="checkbox"
                  id="input-convert"
                  name="input-convert"
                  className="w-5 h-5 bg-white border border-gray-300 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span>Input Converter( 1 to "Pass" , 0 to "Fail")</span>
              </label>
            </div>

            <div style={{ display: "none" }}>
              <label
                htmlFor="test_location"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Test Location
              </label>
            </div>
          </div>
          <div className="flex justify-around items-center p-6 ">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !user ||
                !user.actions ||
                !user.actions.some(
                  (action) =>
                    action._id === enabledFunction["add-job-item-template"]
                )
              }
              className={`text-white font-bold rounded-lg text-sm p-4 text-center hover:bg-blue-800 focus:ring-4 focus:outline-none
            ${
              isSubmitting ||
              !user ||
              !user.actions ||
              !user.actions.some(
                (action) =>
                  action._id === enabledFunction["add-job-item-template"]
              )
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            }`}
            >
              Add Checklist Item Template
            </button>

            <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center">
              <FaFileCsv />
              <span className="hidden md:inline">Upload Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDownloadExcel}
              className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <FaDownload />
              <span className="hidden md:inline">Download Excel format</span>
            </button>
          </div>
          {isSubmitting && (
            <p className="text-blue-600 font-medium text-center mt-2">
              กำลังอัปโหลดและส่งข้อมูล...
            </p>
          )}
        </form>
        <hr className="mt-2" />
        <TableComponent
          headers={jobItemTemplateHeader}
          datas={jobItemTemplateBody}
          TableName={"Checklist Item Templates"}
          filterColumn={"Title"}
          searchColumn={"Title"}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </Layout>
  );
};

export default Page;
