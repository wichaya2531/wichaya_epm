"use client";

import Layout from "@/components/Layout.js";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import NextPlanIcon from "@mui/icons-material/NextPlan";
import Link from "next/link";
import { useEffect, useState } from "react";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import useFetchJobTemplate from "@/lib/hooks/useFetchJobTemplate.js";
import useFetchUsers from "@/lib/hooks/useFetchUsers.js";
import Swal from "sweetalert2";
import { config } from "@/config/config.js";

const approverHeader = ["ID", "Name", "Action"];
const notifyHeader = ["ID", "Name", "Action"];

const Page = ({ searchParams }) => {
  const jobTemplate_id = searchParams.jobTemplate_id;
  //const [timeout, setTimeout] = useState("");

  const [approvers, setApprovers] = useState([]);
  const [notifies, setNotifies] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [selectedNotify, setSelectedNotify] = useState(null);
  const [options, setOptions] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [refresh, setRefresh] = useState(false);
  const {
    user,
    isLoading: isUserLoading,
    error: userError,
  } = useFetchUser(refresh);
  const {
    jobTemplate,
    isLoading: isJobTemplateLoading,
    error: jobTemplateError,
  } = useFetchJobTemplate(jobTemplate_id, refresh);
  const {
    users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useFetchUsers(refresh);

  const [timeout, setTimeout] = useState({
    value: jobTemplate.TIMEOUT, // เริ่มต้นค่าจาก jobTemplate
    label: jobTemplate.TIMEOUT, // เริ่มต้นค่าจาก jobTemplate
  });

  useEffect(() => {
    calculateDueDate();
    // user must not be SuperAdmin
    setOptions(
      users
        .filter((user) => user.name !== "SuperAdmin")
        .filter(
          (user) =>
            Array.isArray(approvers) &&
            !approvers.some((approver) => approver._id === user._id)
        )
        .filter(
          (user) =>
            Array.isArray(notifies) &&
            !notifies.some((notify) => notify._id === user._id)
        )
        .map((user) => ({ value: user._id, label: user.name }))
    );
  }, [refresh, users, approvers, notifies]);

  useEffect(() => {
    setApprovers(jobTemplate.ApproverList);
  }, [jobTemplate.ApproverList]);

  useEffect(() => {
    setNotifies(jobTemplate.NotifyList);
  }, [jobTemplate.NotifyList]);

  useEffect(() => {
    if (jobTemplate) {
      setTimeout({
        value: jobTemplate.TIMEOUT,
        label: jobTemplate.TIMEOUT,
      });
    }
  }, [jobTemplate]);

  const handleAddApprover = () => {
    if (!selectedApprover) {
      Swal.fire("Oops.....", "Please select an Approver!", "error");
      return;
    }

    const newApprover = {
      _id: selectedApprover.value,
      EMP_NAME: selectedApprover.label,
    };

    setApprovers((prevApprovers) => [...prevApprovers, newApprover]);
    setSelectedApprover(null);

    const newOptions = options.filter(
      (option) => option.value !== selectedApprover.value
    );
    setOptions(newOptions);
  };

  const handleAddNotify = () => {
    if (!selectedNotify) {
      Swal.fire("Oops..", "Please select a Notify!", "error");
      return;
    }

    const newNotify = {
      _id: selectedNotify.value,
      EMP_NAME: selectedNotify.label,
    };

    setNotifies((prevNotifies) => [...prevNotifies, newNotify]);
    setSelectedNotify(null);

    const newOptions = options.filter(
      (option) => option.value !== selectedNotify.value
    );
    setOptions(newOptions);
  };

  // const handleRemoveApprover = (userId) => {
  //   setApprovers(approvers.filter((approver) => approver._id !== userId));
  //   const removedApprover = users.find((user) => user._id === userId);
  //   const newOptions = [
  //     ...options,
  //     { value: removedApprover._id, label: removedApprover.name },
  //   ];
  //   setOptions(newOptions);
  // };
  const handleRemoveApprover = async (userId) => {
    try {
      const response = await fetch(`/api/job-template/remove-approver`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTemplateId: jobTemplate_id, // ระบุ ID ของ job template ที่ต้องการลบ approver
          userId: userId, // ID ของ approver ที่ต้องการลบ
        }),
      });

      if (response.ok) {
        // ถ้าการลบสำเร็จ อัปเดตสถานะ approvers
        setApprovers(approvers.filter((approver) => approver._id !== userId));

        // เพิ่ม approver กลับไปยัง options สำหรับ dropdown
        const removedApprover = users.find((user) => user._id === userId);
        if (removedApprover) {
          const newOptions = [
            ...options,
            { value: removedApprover._id, label: removedApprover.name },
          ];
          setOptions(newOptions);
        }
      } else {
        console.error("Failed to remove approver");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // const handleRemoveNotify = (userId) => {
  //   setNotifies(notifies.filter((notify) => notify._id !== userId));
  //   const removedNotify = users.find((user) => user._id === userId);
  //   if (removedNotify) {
  //     const newOptions = [
  //       ...options,
  //       { value: removedNotify._id, label: removedNotify.name },
  //     ];
  //     setOptions(newOptions);
  //   }
  // };
  const handleRemoveNotify = async (userId) => {
    try {
      const response = await fetch(`/api/job-template/remove-notify`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTemplateId: jobTemplate_id, // ระบุ ID ของ job template ที่ต้องการลบ notify
          userId: userId, // ID ของ notify ที่ต้องการลบ
        }),
      });

      if (response.ok) {
        // ถ้าการลบสำเร็จ อัปเดตสถานะ notifies
        setNotifies(notifies.filter((notify) => notify._id !== userId));

        // เพิ่ม notify กลับไปยัง options สำหรับ dropdown
        const removedNotify = users.find((user) => user._id === userId);
        if (removedNotify) {
          const newOptions = [
            ...options,
            { value: removedNotify._id, label: removedNotify.name },
          ];
          setOptions(newOptions);
        }
      } else {
        console.error("Failed to remove notify");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const dataApprover = approvers?.map((approver, index) => {
    return {
      ID: index + 1,
      Name: approver.EMP_NAME,
      Action: (
        <button
          onClick={() => handleRemoveApprover(approver._id)}
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const dataNotify = notifies?.map((notify, index) => {
    return {
      ID: index + 1,
      Name: notify.EMP_NAME,
      Action: (
        <button
          onClick={() => handleRemoveNotify(notify._id)} // ตรวจสอบให้แน่ใจว่าใช้ notify._id
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const jobTemplateID = jobTemplate_id;
    const author = user._id;
    const workgroup = user.workgroup_id;
    const due_date = formData.get("due_date");
    const line_name = formData.get("line_name");

    const job_template_name = formData.get("job_template_name");
    const doc_num = formData.get("doc_num");
    const checklist_ver = formData.get("checklist_ver");
    const timeout = formData.get("timeout");
    const approvers_id = approvers.map((approver) => approver._id);
    const notifies_id = notifies.map((notify) => notify._id);

    // รับ ID ที่ต้องการลบ
    const removedApprovers = jobTemplate.ApproverList.filter(
      (approver) => !approvers_id.includes(approver._id)
    ).map((approver) => approver._id);

    const removedNotifies = jobTemplate.NotifyList.filter(
      (notify) => !notifies_id.includes(notify._id)
    ).map((notify) => notify._id);

    const data = {
      jobTemplateID,
      author,
      workgroup,
      due_date,
      line_name,
      job_template_name,
      doc_num,
      checklist_ver,
      timeout,
      approvers_id,
      notifies_id,
      removedApprovers,
      removedNotifies,
    };

    try {
      const res = await fetch(`/api/job-template/edit-job-template`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        next: { revalidate: 10 },
      });
      const response = await res.json();
      if (response.status === 500) {
        console.error(response.error);
      } else {
        Swal.fire({
          title: "Done!",
          text: "You have successfully edited a Checklist template!",
          icon: "success",
        });
        e.target.reset();
        setNotifies([]);
        setApprovers([]);
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      Swal.fire({
        title: "Oops...",
        text: error.message,
        icon: "error",
      });
    }
  };

  var timeoutvalue = {
    value: jobTemplate.TIMEOUT,
    label: jobTemplate.TIMEOUT,
  };

  const calculateDueDate = () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    setDueDate(formattedDate);
  };
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-5">
      <h1 className="text-2xl font-bold">Edit Checklist Template</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <div>
            <label
              for="author"
              className="block mb-2 text-sm font-medium text-black"
            >
              Author
            </label>
            <input
              type="text"
              id="author"
              className="bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={user.name}
              name="author"
              required
              disabled
            />
          </div>
          <div>
            <label
              for="workgroup"
              className="block mb-2 text-sm font-medium text-black"
            >
              Workgroup
            </label>
            <input
              type="text"
              id="workgroup"
              className="bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={user.workgroup}
              name="workgroup"
              required
              disabled
            />
          </div>

          <div>
            <label
              for="due_date"
              className="block mb-2 text-sm font-medium text-black"
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="due_date"
              required
            />
          </div>
          <div>
            <label
              for="job_template_name"
              className="block mb-2 text-sm font-medium text-black"
            >
              Checklist Template Name
            </label>
            <input
              type="text"
              id="job_template_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              defaultValue={jobTemplate.JOB_TEMPLATE_NAME}
              name="job_template_name"
              required
            />
          </div>
          <div>
            <label
              for="doc_num"
              className="block mb-2 text-sm font-medium text-black"
            >
              Document no.
            </label>
            <input
              type="text"
              id="doc_num"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="doc_num"
              defaultValue={jobTemplate.DOC_NUMBER}
              required
            />
          </div>
          <div>
            <label
              for="checklist_ver"
              className="block mb-2 text-sm font-medium text-black"
            >
              Checklist Version
            </label>
            <input
              type="text"
              id="checklist_ver"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="checklist_ver"
              defaultValue={jobTemplate.CHECKLIST_VERSION}
              required
            />
          </div>
          <div>
            <label
              for="line_name"
              className="block mb-2 text-sm font-medium text-black"
            >
              Line Name
            </label>
            <input
              type="text"
              id="line_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="line_name"
              defaultValue={jobTemplate.LINE_NAME}
              required
            />
          </div>
          <div className="z-50">
            <label
              for="timeout"
              className="block mb-2 text-sm font-medium text-black"
            >
              Timeout
            </label>
            <Select
              id="timeout-select"
              options={[
                { value: "12 hrs", label: "12 hrs" },
                { value: "1 days", label: "1 days" },
                { value: "7 days", label: "7 days" },
                { value: "15 days", label: "15 days" },
                { value: "30 days", label: "30 days" },
                { value: "3 months", label: "3 months" },
                { value: "6 months", label: "6 months" },
                { value: "12 months", label: "12 months" },
              ]}
              isSearchable={true}
              name="timeout"
              value={timeout}
              onChange={setTimeout}
            />
          </div>
          <div className="flex gap-5 ">
            <div className="flex flex-col w-full">
              <label
                htmlFor="visitors"
                className="block mb-2 text-sm font-medium text-black"
              >
                Add Approver
              </label>
              <Select
                options={options}
                value={selectedApprover}
                onChange={setSelectedApprover}
                isSearchable={true}
              />
            </div>
            <button
              type="button"
              onClick={handleAddApprover}
              className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Add
            </button>
          </div>
          <div className="flex gap-5 ">
            <div className="flex flex-col w-full">
              <label
                htmlFor="visitors"
                className="block mb-2 text-sm font-medium text-black"
              >
                Add Notify
              </label>
              <Select
                options={options}
                value={selectedNotify}
                onChange={setSelectedNotify}
                isSearchable={true}
                className="z-50"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNotify}
              className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 "
        >
          Save
        </button>
      </form>
      <TableComponent
        headers={approverHeader}
        datas={dataApprover}
        TableName="Approver List"
      />
      <TableComponent
        headers={notifyHeader}
        datas={dataNotify}
        TableName="Notify List"
      />
    </Layout>
  );
};

export default Page;
