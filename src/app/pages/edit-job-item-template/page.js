"use client";
import Layout from "@/components/Layout.js";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
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

  const handleToShowOnClick = (src) => {
    Swal.fire({
      html: `
        <div style="display: flex; justify-content: center; align-items: center;">
          <img src="${src}" alt="preview" style="max-width: 70%; max-height: 70%; object-fit: contain;" />
        </div>`,
      confirmButtonText: "OK",
      width: "auto",
    });
  };

  const handleClearImage = () => {
    setSelectedFile(null);
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
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      if (data.result) return data.filePath;
      alert("An error occurred while uploading the file.");
      return null;
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the file.");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      test_location: "667b915a596b4d721ec60c40",
      input_convert: form.get("input-convert") === "on" ? true : false,
    };

    if (selectedFile) {
      const filePath = await uploadJobPictureToServer(selectedFile);
      if (filePath) data.filePath = filePath;
    }

    try {
      const res = await fetch(`/api/job-item-template/edit-job-item-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Success", text: "Checklist Item Template Updated Successfully!" });
        setRefresh(!refresh);
      } else {
        Swal.fire({ icon: "error", title: "Oops...", text: "Something went wrong!" });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Something went wrong!" });
    }
  };

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
            {jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE}
          </h1>
          <h1 className="text-1xl font-semibold">Edit Item to Checklist Template</h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4 p-4 bg-white rounded-xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-3">

            {/* ── Author ─────────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="author" className="block text-sm font-medium text-gray-600 mb-1">
                Author
              </label>
              <textarea
                id="author"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none resize-none"
                value={user.name || ""}
                disabled
                name="author"
                readOnly
              />
            </div>

            {/* ── Item Title ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="job_item_template_title" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_TITLE || "Checklist Item Template Title"}
              </label>
              <textarea
                id="job_item_template_title"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE || ""}
                name="job_item_template_title"
                required
              />
            </div>

            {/* ── Item Name ───────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="job_item_template_name" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_ITEM_TEMPLATE_NAME || "Checklist Item Template Name"}
              </label>
              <textarea
                id="job_item_template_name"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_NAME || ""}
                name="job_item_template_name"
                required
              />
            </div>

            {/* ── Upper Spec ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="upper_spec" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_UPPER_SPEC || "Upper Spec"}
              </label>
              <textarea
                id="upper_spec"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                defaultValue={jobItemTemplate.UPPER_SPEC || ""}
                name="upper_spec"
                required
              />
            </div>

            {/* ── Lower Spec ──────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="lower_spec" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_LOWER_SPEC || "Lower Spec"}
              </label>
              <textarea
                id="lower_spec"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                defaultValue={jobItemTemplate.LOWER_SPEC || ""}
                name="lower_spec"
                required
              />
            </div>

            {/* ── Test Method ─────────────────────────────────── */}
            <div className="flex flex-col">
              <label htmlFor="test_method" className="block text-sm font-medium text-gray-600 mb-1">
                {process.env.NEXT_PUBLIC_TEST_METHODE || "Test Method"}
              </label>
              <textarea
                id="test_method"
                rows="2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                defaultValue={jobItemTemplate.TEST_METHOD || ""}
                name="test_method"
                required
              />
            </div>

            {/* ── Input Converter ─────────────────────────────── */}
            <div className="select-none flex items-center">
              <label
                htmlFor="input-convert"
                className="flex items-center space-x-2 text-sm font-medium text-gray-900"
              >
                <input
                  type="checkbox"
                  id="input-convert"
                  name="input-convert"
                  className="w-5 h-5 bg-white border border-gray-300 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                  defaultChecked={jobItemTemplate.INPUT_CONVERT || false}
                />
                <span>Input Converter( 1 to "Pass" , 0 to "Fail")</span>
              </label>
            </div>

            {/* ── Image ───────────────────────────────────────── */}
            <div>
              <label htmlFor="Image" className="block text-sm font-medium text-gray-600 mb-1">
                Image
              </label>
              <div className="flex justify-evenly space-x-4 mb-2">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg ${uploadMode === "resize" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                  onClick={() => setUploadMode("resize")}
                >
                  Resize
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg ${uploadMode === "default" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                  onClick={() => setUploadMode("default")}
                >
                  Default
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <img
                  src={
                    selectedFile && selectedFile instanceof File
                      ? URL.createObjectURL(selectedFile)
                      : `/api/viewItem-template?imgName=` + jobItemTemplate.FILE
                  }
                  alt="Item-template"
                  width={200}
                  className="rounded-md cursor-pointer"
                  onClick={() =>
                    handleToShowOnClick(
                      selectedFile && selectedFile instanceof File
                        ? URL.createObjectURL(selectedFile)
                        : `/api/viewItem-template?imgName=` + jobItemTemplate.FILE
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
                    if (file) setSelectedFile(file);
                  }}
                />
                <button
                  className="bg-red-500 text-sm font-bold text-white px-4 py-2 rounded-lg drop-shadow-lg hover:bg-red-700"
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
            className="text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center bg-blue-500 hover:bg-blue-700"
          >
            Save Checklist Item Template
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Page;
