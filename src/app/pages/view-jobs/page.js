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
import JobForm from "./JobForm.js";
import { useRouter } from "next/navigation";
import mqtt from "mqtt";
import useFetchUser from "@/lib/hooks/useFetchUser.js";

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
  const { jobData, jobItems, isLoading, error } = useFetchJobValue(job_id, refresh);
  const { machines, isLoading: machinesLoading, error: machinesError } = useFetchMachines();
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

      mqttClient.on("connect", () => {
      });

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
      const existingIndex = prev.findIndex((entry) => entry.jobItemID === item.JobItemID);
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
      const existingIndex = prev.findIndex((entry) => entry.jobItemID === item.JobItemID);
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

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const comment = e.target.comment.value;
    setInputValues((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.jobItemID === commentDetail.JobItemID);
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

  const handleSubmit = async (e) => {
    //alert('Submit jobs !!');
    //return;
    e.preventDefault();
    const wdTag = e.target.wd_tag.value;

    const body = {
      jobData: {
        JobID: jobData.JobID,
        wd_tag: wdTag,
        submittedBy: user._id,
      },
      jobItemsData: [...inputValues],
    };
    if (
      inputValues.length === 0 ||
      inputValues.length < jobItems.length ||
      !wdTag ||
      inputValues.some((item) => !item.value)
    ) {
      Swal.fire({
        title: "Error!",
        text: "Please fill all the fields!",
        icon: "error",
      });
      return;
    }
    try {
      const response = await fetch(`/api/job/update-job`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 10 },
      });

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
      }
      e.target.reset();
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error("Error:", err);
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
      <JobForm
        jobData={jobData}
        jobItems={jobItems}
        machines={machines}
        machineName={machineName}
        handleInputChange={handleInputChange}
        handleBeforeValue={handleBeforeValue}
        handleWdChange={handleWdChange}
        handleSubmit={handleSubmit}
        handleShowJobItemDescription={handleShowJobItemDescription}
        handleShowTestMethodDescription={handleShowTestMethodDescription}
        toggleJobItem={toggleJobItem}
        isShowJobItem={isShowJobItem}
        toggleJobInfo={toggleJobInfo}
        isShowJobInfo={isShowJobInfo}
        view={view}
        toggleAddComment={toggleAddComment}
      />
      {testMethodDescription && (
        <TestMethodDescriptionModal
          showDetail={showDetail}
          setTestMethodDescription={setTestMethodDescription}
        />
      )}
      {jobItemDetail && (
        <ItemInformationModal setJobItemDetail={setJobItemDetail} jobItemDetail={jobItemDetail} />
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
