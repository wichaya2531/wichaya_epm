"use client";
import Layout from "@/components/Layout.js";
import useFetchJobValue from "@/lib/hooks/useFetchJobValue";
import React, { useEffect, useState } from "react";
import { config } from "@/config/config.js";
import Swal from "sweetalert2";
import TestMethodDescriptionModal from "@/components/TestMethodDescriptionModal";
import ItemInformationModal from "@/components/ItemInformationModal";
import JobReview from "./JobReview";
import useFetchUser from "@/lib/hooks/useFetchUser";
import { useRouter } from "next/navigation";
import CommentReview from "@/components/CommentReview";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";

const Page = ({ searchParams }) => {
  const router = useRouter();
  const job_id = searchParams.job_id;
  const [view, setView] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const { jobData, jobItems, isLoading, error } = useFetchJobValue(
    job_id,
    refresh
  );
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const [isShowJobInfo, setIsShowJobInfo] = useState(true);
  const [isShowJobItem, setIsShowJobItem] = useState(true);
  const [jobItemDetail, setJobItemDetail] = useState(null);
  const [testMethodDescription, setTestMethodDescription] = useState(null);
  const [AddCommentForm, setAddCommentForm] = useState(false);
  const [commentDetail, setCommentDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(null);


  const [wdtagImg_1, setWdtagImg_1] = useState(null);
  const [wdtagImg_2, setWdtagImg_2] = useState(null);
  const [preview_1, setPreview_1] = useState(null);
  const [preview_2, setPreview_2] = useState(null);  

  useEffect(() => {
    if (user._id && jobData.Approvers) {
      if (jobData.Approvers.includes(user._id)) {
        setView(false);
      } else {
        Swal.fire({
          title: "Error",
          text: "You are not authorized to view this page",
          icon: "error",
          confirmButtonText: "OK",
        }).then(() => {
          router.push("/pages/job-approve");
        });
      }
    }
  }, [user, jobData]);


  const handleUploadFileToJob = (files,event) => {
          const file =files ;//event.target.files[0];
          //setSelectedFile(file);
          if(event=="fileInput-1"){
            setPreview_1(URL.createObjectURL(file)); // แสดง preview ของไฟล์
          }else if(event=="fileInput-2"){
            setPreview_2(URL.createObjectURL(file)); // แสดง preview ของไฟล์
          }
          

          setTimeout(() => {
            uploadJobPictureToServer(file,event);
          }, 10);
  }

  const uploadJobPictureToServer = async (inputFile,selector) => {
    
    if (!inputFile) {
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

      const data = await res.json(); // อ่าน response จาก API

      if (data.result) {
        if(selector=="fileInput-1"){
          setWdtagImg_1(data.filePath);
        }else if(selector=="fileInput-2"){
          setWdtagImg_2(data.filePath);
        }

        
      } else {
        alert("Failed to upload file. Error " + data.error);
      }
    } catch (error) {
      //console.error(error);
      alert("An error occurred while uploading the file.");
    }
  };



  const toggleJobInfo = () => {
    setIsShowJobInfo(!isShowJobInfo);
  };

  const toggleJobItem = () => {
    setIsShowJobItem(!isShowJobItem);
  };

  const toggleAddComment = (item) => {
    setCommentDetail(item);
    setAddCommentForm(!AddCommentForm);
  };

  const handleApprove = async (isApproved, comment = null) => {
     // alert('Approved');
     // return;
    var disapprove_reason="";
    if(!isApproved){
       
        const { value: disapprove_reason_1,isDismissed } = await Swal.fire({
        title: "Please provide a reason",
        input: "textarea",
        inputPlaceholder: "Enter your reason here...",
        inputAttributes: {
          "aria-label": "Enter your reason here",
        },
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
      });
      if (isDismissed) {
        return;
      }
      disapprove_reason=disapprove_reason_1;
    }

    

    try {
      const response = await fetch(`/api/approval/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: job_id,
          user_id: user._id,
          isApproved,
          comment,
          disapprove_reason,
        }),
        next: { revalidate: 10 },
      });
      const data = await response.json();
      if (data.status === 200) {
        Swal.fire({
          title: "Success",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          setRefresh(!refresh);
          router.push("/pages/job-approve");
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleToShowOnClick = (item) => {
    Swal.fire({
      title: item.title,
      html: `<img src="${item}" alt="${item}" style="max-width: 100%; height: auto;" />`,
      confirmButtonText: "OK",
      width: "auto",
      height: "80%",
    });
  };

  const handleShowTestMethodDescription = (item) => {
    Swal.fire({
      title: item.JobItemName,
      html: `<div style="text-align:left;">
                <p><strong>Description&nbsp;:&nbsp;</strong> ${
                  item.description || ""
                }</p>
                <p><strong>Test Location&nbsp;:&nbsp;</strong> ${
                  item.TestLocationName
                }</p>
                <p><strong>Test Method&nbsp;:&nbsp;</strong> ${
                  item.TestMethod
                }</p>
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

  const handleReject = async (e) => {
    e.preventDefault();
    const comment = e.target.comment.value;
    try {
      const response = await fetch(`/api/approval/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: commentDetail.JobID,
          user_id: user._id,
          isApproved: false,
          comment: comment,
        }),
        next: { revalidate: 10 },
      });
      const data = await response.json();
      if (data.status === 200) {
        Swal.fire({
          title: "Success",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          setRefresh(!refresh);
          window.history.replaceState({}, "", "/pages/job-approve");
          if (router) {
            router.push("/pages/job-approve");
          }
        });
      } else {
        Swal.fire({
          title: "Server Error",
          text: data.error,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.log("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  //console.log("jobData", jobData);
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-8 p-4 bg-white rounded-xl">
      <JobReview
        jobData={jobData}
        jobItems={jobItems}
        handleApprove={handleApprove}
        handleShowJobItemDescription={handleShowJobItemDescription}
        handleShowTestMethodDescription={handleShowTestMethodDescription}
        toggleJobItem={toggleJobItem}
        isShowJobItem={isShowJobItem}
        toggleJobInfo={toggleJobInfo}
        isShowJobInfo={isShowJobInfo}
        toggleAddComment={toggleAddComment}
        view={view}
        preview_1={preview_1}
        preview_2={preview_2}        
        onclicktoShow={handleToShowOnClick}
        handleUploadFileToJob={handleUploadFileToJob}
        user={user}
      />
      {jobItemDetail && (
        <ItemInformationModal
          jobItemDetail={jobItemDetail}
          setJobItemDetail={setJobItemDetail}
        />
      )}
      {testMethodDescription && (
        <TestMethodDescriptionModal
          setTestMethodDescription={setTestMethodDescription}
          showDetail={showDetail}
        />
      )}
      {AddCommentForm && (
        <CommentReview
          toggleAddComment={toggleAddComment}
          handleReject={handleReject}
          commentDetail={commentDetail}
        />
      )}
    </Layout>
  );
};

export default Page;
