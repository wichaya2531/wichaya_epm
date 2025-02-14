"use client";
import Layout from "@/components/Layout.js";
//import { config } from "@/config/config.js";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
import Select from "react-select";
import { useState } from "react";
import Link from "next/link";
import useFetchJobItemTemplate from "@/lib/hooks/useFetchJobItemTemplate";
import Swal from "sweetalert2";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";

const Page = ({ searchParams }) => {
  const [uploadMode, setUploadMode] = useState("resize");
  const jobTemplate_id = searchParams.jobTemplate_id;
  const jobItemTemplate_id = searchParams.jobItemTemplate_id;
  const [refresh, setRefresh] = useState(false);
  const { jobItemTemplate, isLoading: jobItemTemplateLoading } =
    useFetchJobItemTemplate(jobItemTemplate_id, refresh);
  const { user, isLoading: userLoading } = useFetchUser(refresh);
  const { locations, isLoading: locationsLoading } =
    useFetchTestLocations(refresh);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleToShowOnClick = (item) => {
    Swal.fire({
      title: item.title,
      html: `
          <div style="display: flex; justify-content: center; align-items: center;">
            <img src="${item}" alt="${item}" style="max-width: 70%; max-height: 70%; object-fit: contain;" />
          </div>`,
      confirmButtonText: "OK",
      width: "auto",
      height: "auto",
    });
  };

  const handleClearImage = () => {
    setSelectedFile(null);
  };

  // const handleUploadFileToJob = async (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const filePath = await uploadJobPictureToServer(file);
  //     if (filePath) {
  //       setSelectedFile(filePath); // เก็บพาธไฟล์ที่อัปโหลดสำเร็จ
  //       setPreview(URL.createObjectURL(file));
  //     }
  //   }
  // };

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
    // if (!e.target.test_location.value) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "Please select a test location!",
    //   });
    //   return;
    // }

    const form = new FormData(e.target);
    const data = {
      jobTemplate_id,
      jobItemTemplate_id,
      author: user._id,
      job_item_template_title: form.get("job_item_template_title"),
      job_item_template_name: form.get("job_item_template_name"),
      upper_spec: form.get("upper_spec"),
      lower_spec: form.get("lower_spec"),
      test_method: form.get("test_method"),

      test_location: "667b915a596b4d721ec60c40", //TEST_LOCATION_ID: '667b915a596b4d721ec60c40'
    };
    // เพิ่มการจัดเก็บ filePath ที่ได้จากการอัปโหลด
    if (selectedFile) {
      const filePath = await uploadJobPictureToServer(selectedFile);
      if (filePath) {
        data.filePath = filePath; // เก็บค่าพาธไฟล์ที่อัปโหลดสำเร็จ
      }
    }

    try {
      const res = await fetch(`/api/job-item-template/edit-job-item-template`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        next: { revalidate: 10 },
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Checklist Item Template Updated Successfully!",
        });
        setRefresh(!refresh);
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  // console.log("jobItemTemplate: ", jobItemTemplate);

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-7">
      <div className="flex flex-row justify-between items-center gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <span className="text-black">
              <Link
                href={{
                  pathname: "/pages/job-item-template/add-job-item-template/",
                  query: { jobTemplate_id: jobTemplate_id },
                }}
              >
                <ArrowBackIosNewIcon />
              </Link>
            </span>
            {jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE}{" "}
          </h1>
          <h1 className="text-1xl font-semibold">
            Edit Item to Checklist Template
          </h1>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-4 p-4 bg-white rounded-xl">
        <form onSubmit={HandleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-3">
            <div>
              <label
                for="author"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Author
              </label>
              <input
                type="text"
                id="author"
                className="bg-gray-200 border cursor-not-allowed border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50  "
                value={user.name || ""}
                disabled
                name="author"
                required
              />
            </div>
            <div>
              <label
                for="job_item_template_title"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Checklist Item Template Title
              </label>
              <input
                type="text"
                id="job_item_template_title"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="title"
                defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE || ""}
                name="job_item_template_title"
                required
              />
            </div>
            <div>
              <label
                for="job_item_template_name"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Checklist Item Template Name
              </label>
              <input
                type="text"
                id="job_item_template_name"
                placeholder="name"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_NAME || ""}
                name="job_item_template_name"
                required
              />
            </div>
            <div>
              <label
                for="Upper_Spec"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Upper Spec
              </label>
              <input
                type="text"
                id="upper_spec"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                defaultValue={jobItemTemplate.UPPER_SPEC || ""}
                name="upper_spec"
                required
              />
            </div>
            <div>
              <label
                for="lower_spec"
                class="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Lower Spec
              </label>
              <input
                type="text"
                id="lower_spec"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                defaultValue={jobItemTemplate.LOWER_SPEC || ""}
                name="lower_spec"
                required
              />
            </div>
            <div>
              <label
                for="test_method"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Test Method
              </label>
              <input
                type="text"
                id="test_method"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                defaultValue={jobItemTemplate.TEST_METHOD || "-"}
                name="test_method"
                required
              />
            </div>
            <div>
              {/* <label
                for="test_method"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Test location
              </label>
              <Select
                name="test_location"
                id="test_location"
                className=" text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full "
                options={locations.map((location) => {
                  return {
                    value: location._id,
                    label: location.LocationName,
                  };
                })}
                isSearchable={true}
              /> */}
            </div>
            <div>
              <label
                htmlFor="Image"
                className="block mb-2 text-sm font-medium text-gray-900 text-black"
              >
                Image
              </label>
              <div className="flex justify-evenly space-x-4 mb-2">
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
              <div className="flex justify-center mb-4">
                <img
                  src={
                    selectedFile && selectedFile instanceof File
                      ? URL.createObjectURL(selectedFile) // ใช้ไฟล์ที่เลือก
                      : `/api/viewItem-template?imgName=` + jobItemTemplate.FILE // ใช้ไฟล์เก่า
                  }
                  alt="Item-template"
                  width={200}
                  className="rounded-md cursor-pointer"
                  onClick={() =>
                    handleToShowOnClick(
                      selectedFile && selectedFile instanceof File
                        ? URL.createObjectURL(selectedFile)
                        : `/api/viewItem-template?imgName=` +
                            jobItemTemplate.FILE
                    )
                  }
                />
              </div>
              <div className="flex justify-between">
                <label htmlFor="file" className="cursor-pointer">
                  <span className="text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center bg-blue-500 hover:bg-blue-700 flex justify-center items-center gap-2">
                    Upload
                    <UploadFileIcon />
                  </span>
                </label>

                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
                <button
                  className="bg-red-500 text-sm font-bold text-white px-4 py-2 rounded-lg drop-shadow-lg hover:bg-red-700 hover:text-white"
                  type="button"
                  onClick={handleClearImage}
                >
                  <span className="flex justify-center items-center gap-2">
                    Clear
                    <ClearIcon />
                  </span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className={`text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center bg-blue-500 hover:bg-blue-700`}
          >
            Save Checklist Item Template
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Page;
