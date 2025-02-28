"use client";
import Layout from "@/components/Layout.js";
import TableComponent from "@/components/TableComponent.js";
import { config } from "@/config/config.js";
import useFetchJobItemTemplates from "@/lib/hooks/useFetchJobItemTemplates";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchJobTemplate from "@/lib/hooks/useFetchJobTemplate";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
import Select from "react-select";
import { useState } from "react";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FaFileCsv, FaDownload } from "react-icons/fa";


const jobItemTemplateHeader = [
  "Pos.",
  "Job Title",
  "Job Name",
  "Upper/Lower ",
  "Test Method",
  "input type",
  "Create At",
  "Action",
];
const enabledFunction = {
  "add-job-item-template": "6638600dd81a314967236df5",
  "remove-job-item-template": "66386025d81a314967236df7",
};

const Page = ({ searchParams }) => {
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewPictureItem, setPreviewPictureItem] = useState(
    "/assets/images/image.png"
  );

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      //console.log("file seledcted by drop ",file);
      const filePath = await uploadJobPictureToServer(file);
      //console.log("filePath",filePath);
      setPreviewPictureItem("/api/viewItem-template?imgName=" + filePath);
      setSelectedFile(true);
      setItemPicture(filePath);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleUploadFileToJob = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // อัปโหลดไฟล์และรอผลลัพธ์
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
      return null; // คืนค่า null หากไม่มีไฟล์
    }
    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("JOB_Template_ID", jobTemplate_id);

    // เลือก URL ตามโหมดการอัปโหลด
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
        return data.filePath; // คืนค่าพาธไฟล์เมื่ออัปโหลดสำเร็จ
      } else {
        alert("An error occurred while uploading the file.");
        return null; // คืนค่า null หากเกิดข้อผิดพลาด
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the file.");
      return null; // คืนค่า null หากเกิดข้อผิดพลาด
    }
  };

  const HandleSubmit = async (e) => {
    e.preventDefault();
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
      TEST_LOCATION_ID: "667b915a596b4d721ec60c40", //form.get("test_location"),
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

    // ใช้พาธไฟล์ที่ได้จากการอัปโหลด
    formData.append("FILE", itemPicture);

    try {
      const response = await fetch(
        `/api/job-item-template/create-job-item-template`,
        {
          method: "POST",
          body: formData,
          next: { revalidate: 10 },
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
        Swal.fire("Error", "ไฟล์ไม่มีข้อมูล", "error");
        return;
      }

      // สร้าง FormData สำหรับข้อมูลหลายแถว
      const formData = new FormData();

      // เพิ่มข้อมูลจาก jsonData ทีละแถว
      jsonData.forEach((row, index) => {
        // เพิ่มข้อมูลจากไฟล์ Excel
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

        // ข้อมูลเพิ่มเติมจากฟอร์มที่กรอก
        formData.append("AUTHOR_ID", user._id);
        formData.append("JOB_TEMPLATE_ID", jobTemplate_id);
        formData.append("JobTemplateCreateID", jobTemplate.JobTemplateCreateID);
        formData.append("TEST_LOCATION_ID", "667b915a596b4d721ec60c40");
      });

      // ถ้ามีการเลือกไฟล์เพื่ออัปโหลด
      if (selectedFile) {
        console.log("upload file from input");
        formData.append("FILE", selectedFile);
      }

      try {
        const response = await fetch(
          "/api/job-item-template/create-job-item-templates",
          {
            method: "POST",
            body: formData, // ส่ง FormData
          }
        );

        const result = await response.json();
        if (response.ok) {
          Swal.fire("Success", "ข้อมูลถูกอัปโหลดสำเร็จ", "success");
        } else {
          Swal.fire("Error", result.message || "เกิดข้อผิดพลาด", "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการส่งข้อมูล", "error");
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

    // บันทึกเป็นไฟล์ Excel
    XLSX.writeFile(wb, "Job_Item_Template.xlsx");
  };

  const handleMqtt = async (jobItemTemplate) => {
    const idToCopy = jobItemTemplate._id;

    // ใช้ SweetAlert2 (swal)
    Swal.fire({
      title: "Mqtt Topic ID",
      html: `<p>ID: <strong>${idToCopy}</strong></p>
               <button id="copy-btn" class="swal2-confirm swal2-styled" style="background-color: #3085d6; color: white;">
                   Copy to Clipboard
               </button>
              
              <div style="border:1px solid none;width:450px;text-align:left;padding:15px;">
                <p style="padding-left:45px;"><strong>[--------Setting Info-------]</strong></p>
                
                <p style="padding-left:50px;">Broker IP&nbsp;&nbsp;: &nbsp;&nbsp;<strong>${process.env.NEXT_PUBLIC_MQTT_BROKER_IP}</strong></p>
                <p style="padding-left:50px;">Broker Port&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${process.env.NEXT_PUBLIC_MQTT_BROKER_PORT}</strong></p>
                <p style="padding-left:50px;">User&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${process.env.NEXT_PUBLIC_MQT_USERNAME}</strong></p>
                <p style="padding-left:50px;">Pass&nbsp;&nbsp;:&nbsp;&nbsp;<strong>${process.env.NEXT_PUBLIC_MQT_PASSWORD}</strong></p>
              </div>  
               `,
      showConfirmButton: false, // ซ่อนปุ่ม "OK" เริ่มต้น
    });

    // เพิ่ม Event Listener ให้กับปุ่ม Copy

    document.addEventListener("click", (event) => {
      if (event.target.id === "copy-btn") {
        const textArea = document.createElement("textarea");
        textArea.value = idToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          Swal.fire("Copied!", "ID has been copied to clipboard.", "success");
        } catch (err) {
          Swal.fire("Oops!", "Failed to copy ID.", "error");
        }
        document.body.removeChild(textArea);
      }
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

        Swal.fire("Deleted!", "The item has been deleted.", "success");

        setRefresh((prev) => !prev);
      } catch (err) {
        console.log(err);
        Swal.fire("Error!", "Failed to delete the item.", "error");
      }
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
  };

  const handleTypeInputSelect = async (b, valueSelected) => {
          //alert('****handleTypeInputSelect****',b);
         // alert(valueSelected);
         // return;
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
      
            //if (data.result) {
            //  return data.filePath; // คืนค่าพาธไฟล์เมื่ออัปโหลดสำเร็จ
            //} else {
            //alert("An error occurred while uploading the file.");
            //  return null; // คืนค่า null หากเกิดข้อผิดพลาด
            //}
          } catch (error) {
            //console.error(error);
            //alert("An error occurred while uploading the file.");
            //return null; // คืนค่า null หากเกิดข้อผิดพลาด
          }
  }

  const handlePosSelect = async (b, valueSelected) => {
    //console.log("valueSelected=>"+valueSelected+" => "+b._id);
    //alert('use handlePosSelect ');
    //return;
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
      console.log("data=>", data);

      //if (data.result) {
      //  return data.filePath; // คืนค่าพาธไฟล์เมื่ออัปโหลดสำเร็จ
      //} else {
      //alert("An error occurred while uploading the file.");
      //  return null; // คืนค่า null หากเกิดข้อผิดพลาด
      //}
    } catch (error) {
      //console.error(error);
      //alert("An error occurred while uploading the file.");
      //return null; // คืนค่า null หากเกิดข้อผิดพลาด
    }
  };

  const jobItemTemplateBody = jobItemTemplates.map((jobItemTemplate, index) => {
    //console.log("jobItemTemplates.length=>",jobItemTemplates.length);
    var buffer_position_list = [];
    var counter = 1;
    jobItemTemplates.map((jobItemTemplate, index) => {
      buffer_position_list.push({
        id: counter,
        name: counter,
      });
      counter++;
    });
    return {
      ID: (
        /* index + 1 */ /*jobItemTemplate.pos+ */ <div className="flex items-center justify-center gap-2">
          <select
            className="p-2"
            onChange={(e) => handlePosSelect(jobItemTemplate, e.target.value)}
          >
            <option value={jobItemTemplate.pos}>{jobItemTemplate.pos}</option>
            {buffer_position_list.map((point, index) => (
              <option key={point.id || index} value={point.name}>
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
      Test_Method: jobItemTemplate.TEST_METHOD,
      input_type : 
      (<div className="flex items-center justify-center gap-2">
          <select
            className="p-2"
           // onChange={(e) => handlePosSelect(jobItemTemplate, e.target.value)}
           onChange={(e) => handleTypeInputSelect(jobItemTemplate, e.target.value)}
          >
            <option value={jobItemTemplate.INPUT_TYPE||""}>{jobItemTemplate.INPUT_TYPE}</option>
            <option value="Numeric">Numeric</option>
            <option value="String">String</option>
            {/* <option value={jobItemTemplate.pos}>{jobItemTemplate.pos}</option>
            {buffer_position_list.map((point, index) => (
              <option key={point.id || index} value={point.name}>
                {point.name}
              </option>
            ))} */}
          </select>
        </div>
      )
      ,
      "Create At": jobItemTemplate.createdAt,
      Action: (
        <div className="flex items-center justify-center gap-2">
          <Link
            className="text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center
                    bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            href={{
              pathname: "/pages/edit-job-item-template",
              query: {
                jobItemTemplate_id: jobItemTemplate._id,
                jobTemplate_id: jobTemplate_id,
              },
            }}
          >
            Edit
          </Link>

          <button
            className={`text-white font-bold rounded-lg text-sm px-2 py-2.5 text-center 
                            ${
                              user &&
                              user.actions &&
                              !user.actions.some(
                                (action) =>
                                  action._id ===
                                  enabledFunction["remove-job-item-template"]
                              )
                                ? "bg-red-500 cursor-not-allowed"
                                : "bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                            }`}
            onClick={() => handleRemove(jobItemTemplate._id)}
            disabled={
              !user ||
              !user.actions ||
              !user.actions.some(
                (action) =>
                  action._id === enabledFunction["remove-job-item-template"]
              )
            }
          >
            Remove
          </button>

          <button
            className={`text-white font-bold rounded-lg text-sm px-2 py-2.5 text-center 
                            ${
                              user &&
                              user.actions &&
                              !user.actions.some(
                                (action) =>
                                  action._id ===
                                  enabledFunction["remove-job-item-template"]
                              )
                                ? "bg-lime-500 cursor-not-allowed"
                                : "bg-lime-700 hover:bg-green-800 focus:ring-4 focus:outline-none dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                            }`}
            onClick={() => handleMqtt(jobItemTemplate)}
            disabled={
              !user ||
              !user.actions ||
              !user.actions.some(
                (action) =>
                  action._id === enabledFunction["remove-job-item-template"]
              )
            }
          >
            Mqtt
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
                               src="/assets/card-logo/management.png"
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
        <form onSubmit={HandleSubmit} className="flex flex-col justify-center ">
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
                  style={{ display: "none" }} // ซ่อน input file
                  onChange={handleUploadFileToJob} // ลบ onChange นี้
                  accept="image/*" // กำหนดประเภทไฟล์
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
                {/* <label
                  htmlFor="fileInput"
                  className="cursor-pointer bg-[#347EC2] text-white text-sm px-4 py-2 rounded-lg drop-shadow-lg hover:bg-[#4398E7] hover:text-white flex justify-center items-center gap-2 font-bold"
                >
                  Add the image
                </label> */}
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

            <div>
              <label
                htmlFor="author"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Author
              </label>
              <input
                type="text"
                id="author"
                className="bg-gray-200 border cursor-not-allowed border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50"
                value={user?.name || ""}
                disabled
                name="author"
                required
              />
            </div>
            <div>
              <label
                htmlFor="job_item_template_title"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Checklist Item Template Title
              </label>
              <input
                type="text"
                id="job_item_template_title"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Item Title"
                name="job_item_template_title"
                required
              />
            </div>
            <div>
              <label
                htmlFor="job_item_template_name"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Checklist Item Template Name
              </label>
              <input
                type="text"
                id="job_item_template_name"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Item Name"
                name="job_item_template_name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="upper_spec"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Upper Spec
              </label>
              <input
                type="text"
                id="upper_spec"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Upper Spec"
                name="upper_spec"
                required
              />
            </div>
            <div>
              <label
                htmlFor="lower_spec"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Lower Spec
              </label>
              <input
                type="text"
                id="lower_spec"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Lower Spec"
                name="lower_spec"
                required
              />
            </div>
            <div>
              <label
                htmlFor="test_method"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Test Method
              </label>
              <input
                type="text"
                id="test_method"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="test method"
                name="test_method"
                required
              />
            </div>
            <div style={{ display: "none" }}>
              <label
                htmlFor="test_location"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Test Location
              </label>
              {/* <Select
                name="test_location"
                id="test_location"
                
                className="display-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                
                options={locations.map((location) => {
                  return {
                    value: location._id,
                    label: location.LocationName,
                  };
                })
              }
                isSearchable={true}
              /> */}
            </div>
          </div>
          <div className="flex justify-around items-center p-6 ">
            <button
              type="submit"
              className={`text-white font-bold rounded-lg text-sm p-4 text-center hover:bg-blue-800 focus:ring-4 focus:outline-none
            ${
              user &&
              user.actions &&
              !user.actions.some(
                (action) =>
                  action._id === enabledFunction["add-job-item-template"]
              )
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            }`}
              disabled={
                !user ||
                !user.actions ||
                !user.actions.some(
                  (action) =>
                    action._id === enabledFunction["add-job-item-template"]
                )
              }
            >
              Add Checklist Item Template
            </button>

            <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center">
              <FaFileCsv />
              <span className="hidden md:inline">Upload Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload} // เมื่อเลือกไฟล์ให้เรียก handleFileUpload
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
        />
      </div>
    </Layout>
  );
};

export default Page;
