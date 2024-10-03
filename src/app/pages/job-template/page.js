"use client";

import Layout from "@/components/Layout.js";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import NextPlanIcon from "@mui/icons-material/NextPlan";
import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "../../../config/config.js";
import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";

const enabledFunction = {
  "create-job-template": "6632f9e4eccb576a719dfa7a",
  "view-all-job-templates": "663845e3d81a314967236de6",
  "manage-line-name": "66fb9799dc63c132e138e292",
};

const approverHeader = ["ID", "Name", "Action"];
const notifyHeader = ["ID", "Name", "Action"];
const lineNameHeader = ["ID", "Line Name", "Created At", "Action"];

const Page = () => {
  const [selectLineNames, setSelectLineNames] = useState([]);
  const [lineNames, setLineNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectLineName, setSelectLineName] = useState(""); // เก็บค่าที่ผู้ใช้กรอก
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [notifies, setNotifies] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [selectedNotify, setSelectedNotify] = useState(null);
  const [users, setUsers] = useState([]);
  const [options, setOptions] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [user, setUser] = useState({});
  const [machinesOptions, setMachinesOptions] = useState([]);
  const [userEnableFunctions, setUserEnableFunctions] = useState([]);
  const [refresh, setRefresh] = useState(false);

  // แปลงข้อมูล selectLineNames ให้เข้ากับโครงสร้างของตาราง
  const selectLineNameBody = selectLineNames.map((lineName, index) => {
    return {
      ID: index + 1, // ลำดับข้อมูล
      "Line Name": lineName?.name || "Unknown", // ตรวจสอบ lineName และกำหนดค่าเริ่มต้นเป็น "Unknown" ถ้าไม่มีค่า
      "Created At": lineName?.createdAt
        ? new Date(lineName.createdAt).toLocaleString()
        : "Unknown", // ตรวจสอบ lineName.createdAt และกำหนดค่าเริ่มต้นเป็น "Unknown" ถ้าไม่มีค่า
      Action: (
        <div className="flex gap-2 items-center justify-center">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded"
            onClick={() => handleUpdate(lineName)} // ส่ง lineName แทนที่จะเป็น ID
          >
            update
          </button>
          <button
            className="bg-red-500 hover:bg-orange-700 text-white font-semibold py-1 px-2 rounded"
            onClick={() => handleRemove(lineName._id)} // ใช้ lineName._id
          >
            remove
          </button>
        </div>
      ),
    };
  });

  console.log("handleUpdate");
  // ฟังก์ชันอัปเดต
  const handleUpdate = async (lineName) => {
    Swal.fire({
      title: "Update Line Name",
      input: "text",
      inputLabel: "New Name",
      inputPlaceholder: "Enter the new line name",
      inputValue: lineName.name || "",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      preConfirm: (newName) => {
        if (!newName) {
          Swal.showValidationMessage("Please enter a new name");
        }
        return newName;
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newName = result.value;

        console.log("Updating ID:", lineName._id);
        try {
          const response = await fetch(
            `/api/select-line-name/edit-line-name/${lineName._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ newName }),
            }
          );

          if (response.ok) {
            // อัปเดตข้อมูลในตารางโดยไม่ต้องรีเฟรชหน้า
            setSelectLineNames((prevData) =>
              prevData.map((item) =>
                item._id === lineName._id ? { ...item, name: newName } : item
              )
            );

            Swal.fire("Updated!", "The line name has been updated.", "success");
          } else {
            Swal.fire(
              "Update Failed",
              "There was a problem updating the name.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error updating line name:", error);
          Swal.fire("Error", "There was an error updating the name.", "error");
        }
      }
    });
  };

  // ฟังก์ชันลบ
  const handleRemove = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes, delete it!",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        console.log("Removing ID:", id);
        try {
          const response = await fetch(
            `/api/select-line-name/delete-line-name/${id}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            // ลบข้อมูลในตารางโดยไม่ต้องรีเฟรชหน้า
            setSelectLineNames((prevData) =>
              prevData.filter((lineName) => lineName._id !== id)
            );

            Swal.fire("Deleted!", "The line name has been deleted.", "success");
          } else {
            Swal.fire(
              "Delete Failed",
              "There was a problem deleting the name.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error removing line name:", error);
          Swal.fire("Error", "There was an error deleting the name.", "error");
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire("Cancelled", "The line name is safe :)", "error");
      }
    });
  };

  const handleCreate = async () => {
    if (!selectLineName) {
      Swal.fire({
        icon: "warning",
        title: "คำเตือน",
        text: "กรุณากรอกชื่อ Select Line Name",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/select-line-name/create-line-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: selectLineName }), // ส่งข้อมูล selectLineName ไปยัง API
      });

      const data = await response.json(); // อ่าน response เป็น JSON โดยตรง
      console.log("Response data:", data); // ตรวจสอบข้อมูลที่ได้จาก API

      if (response.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "สร้างข้อมูลสำเร็จ",
        });

        // ตรวจสอบว่า data.lineName มีฟิลด์ name หรือไม่
        const newLineName = data.lineName; // แก้เป็น lineName

        if (newLineName && newLineName.name) {
          // เพิ่มข้อมูลใหม่ลงในตารางโดยไม่ต้องรีเฟรชหน้า
          setSelectLineNames((prevData) => [...prevData, newLineName]);
        } else {
          console.warn("newLineName ไม่สมบูรณ์:", newLineName);
        }

        setSelectLineName(""); // ล้างข้อมูลในช่องกรอก
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: `ไม่สามารถสร้างข้อมูลได้: ${data.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: `ไม่สามารถสร้างข้อมูลได้: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลจาก API
  useEffect(() => {
    const fetchLineNames = async () => {
      try {
        const response = await fetch("/api/select-line-name/get-line-name");
        const data = await response.json();
        if (data.status === 200) {
          setSelectLineNames(data.selectLineNames); // บันทึกข้อมูลลงใน state
        } else {
          console.error("Failed to fetch data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching line names:", error);
      }
    };

    fetchLineNames();
  }, []);

  useEffect(() => {
    retreiveSession();
    calculateDueDate();
    fetchUsers();
    fetchMachines();
  }, [refresh]);

  useEffect(() => {
    // Filter options to exclude approvers and notifies
    const updatedOptions = users
      .filter(
        (user) =>
          !approvers.some((approver) => approver.user_id === user._id) &&
          !notifies.some((notify) => notify.user_id === user._id)
      )
      .map((user) => ({
        value: user._id,
        label: user.name,
      }));
    setOptions(updatedOptions);
  }, [approvers, notifies, users]);

  const retreiveSession = async () => {
    try {
      const session = await getSession();
      await fetchUser(session.user_id);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await fetch(`/api/machine/get-machines`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const machineOptions = data.machines.map((machine) => ({
        value: machine._id,
        label: machine.name,
      }));
      setMachinesOptions(machineOptions);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUser = async (userId) => {
    try {
      const response = await fetch(`/api/user/get-user/${userId}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setUser(() => data.user);
      setUserEnableFunctions(() => data.user.actions);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/user/get-users`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setUsers(data.users);
      const userOptions = data.users.map((user) => ({
        value: user._id,
        label: user.name,
      }));
      setOptions(userOptions);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddApprover = () => {
    if (!selectedApprover) {
      Swal.fire("Oops...", "Please select a Approver!", "error");
      return;
    }
    const newApprover = {
      user_id: selectedApprover.value,
      name: selectedApprover.label,
    };
    setApprovers((prevApprovers) => [...prevApprovers, newApprover]);
    setSelectedApprover(null);

    // Update options after adding approver
    const newOptions = options.filter(
      (option) => option.value !== selectedApprover.value
    );
    setOptions(newOptions);
  };

  const handleAddNotify = () => {
    if (!selectedNotify) {
      Swal.fire("Oops...", "Please select a Notify!", "error");
      return;
    }
    const newNotify = {
      user_id: selectedNotify.value,
      name: selectedNotify.label,
    };
    setNotifies((prevNotifies) => [...prevNotifies, newNotify]);
    setSelectedNotify(null);

    // Update options after adding notify
    const newOptions = options.filter(
      (option) => option.value !== selectedNotify.value
    );
    setOptions(newOptions);
  };

  const handleRemoveApprover = (userId) => {
    const removedApprover = users.find((user) => user._id === userId);
    setApprovers(approvers.filter((approver) => approver.user_id !== userId));

    // Add removed approver back to options
    const newOptions = [
      ...options,
      { value: removedApprover._id, label: removedApprover.name },
    ];
    setOptions(newOptions);
  };

  const handleRemoveNotify = (userId) => {
    const removedNotify = users.find((user) => user._id === userId);
    setNotifies(notifies.filter((Notify) => Notify.user_id !== userId));

    // Add removed notify back to options
    const newOptions = [
      ...options,
      { value: removedNotify._id, label: removedNotify.name },
    ];
    setOptions(newOptions);
  };

  const dataApprover = approvers.map((approver, index) => {
    return {
      ID: index + 1,
      Name: approver.name,
      Action: (
        <button
          onClick={() => handleRemoveApprover(approver.user_id)}
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const dataNotify = notifies.map((notify, index) => {
    return {
      ID: index + 1,
      Name: notify.name,
      Action: (
        <button
          onClick={() => handleRemoveNotify(notify.user_id)}
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
    const AUTHOR_ID = user._id;
    const JOB_TEMPLATE_NAME = formData.get("job_template_name");
    const DOC_NUMBER = formData.get("doc_num");
    const LINE_NAME = formData.get("line_name");
    const DUE_DATE = formData.get("due_date");
    const CHECKLIST_VERSION = formData.get("checklist_ver");
    const TIMEOUT = formData.get("timeout");
    const WORKGROUP_ID = user.workgroup_id;
    const APPROVERS_ID = approvers.map((approver) => approver.user_id);
    const NOTIFIES_ID = notifies.map((notify) => notify.user_id);

    const data = {
      AUTHOR_ID,
      JOB_TEMPLATE_NAME,
      DOC_NUMBER,
      LINE_NAME,
      DUE_DATE,
      CHECKLIST_VERSION,
      TIMEOUT,
      WORKGROUP_ID,
      APPROVERS_ID,
      NOTIFIES_ID,
    };

    try {
      const res = await fetch(`/api/job-template/create-job-template`, {
        method: "POST",
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
          text: "You have successfully created a Checklist template!",
          icon: "success",
        });
        e.target.reset();
        setApprovers([]);
        setNotifies([]);
        setDueDate("");
        setSelectedMachine(null);
        setSelectedApprover(null);
        setOptions([]);
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      console.error("Error creating Checklist template:", error);
    }
  };

  const calculateDueDate = () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    setDueDate(formattedDate);
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        {/* Checklist Template Section */}
        <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl flex-grow">
          <div className="flex items-center">
            <Image
              src="/assets/card-logo/template.png"
              alt="wd logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h1 className="text-3xl font-bold text-slate-900">
              Create Checklist Template
            </h1>
          </div>
          <p className="text-sm font-bold text-secondary flex items-center">
            Manage Checklist Template and its items
          </p>
        </div>

        {/* Manage Line Name Button */}
        <Link
          href="/pages/manage-line-name"
          className={`align-left text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center mb-4 lg:mb-0 lg:ml-4
      ${
        !userEnableFunctions.some(
          (action) => action._id === enabledFunction["manage-line-name"]
        ) && "opacity-50 cursor-not-allowed"
      }`}
        >
          <div className="flex gap-3 items-center">
            <p>Manage Line Name..</p>
            <NextPlanIcon />
          </div>
        </Link>

        {/* View All Checklist Templates Button */}
        <Link
          href="/pages/job-item-template"
          className={`align-left text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center
      ${
        !userEnableFunctions.some(
          (action) => action._id === enabledFunction["view-all-job-templates"]
        ) && "opacity-50 cursor-not-allowed"
      }`}
        >
          <div className="flex gap-3 items-center">
            <p>View all Checklist Templates</p>
            <NextPlanIcon />
          </div>
        </Link>
      </div>

      <div className="max-w-md mx-auto my-4 p-4 border border-gray-300 rounded bg-white shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">
          สร้าง Select Line Name
        </h2>
        <div className="mb-4">
          <label htmlFor="lineName" className="block text-sm font-medium mb-1">
            Line Name:
          </label>
          <input
            type="text"
            id="lineName" // รักษาชื่อ id ไว้เหมือนเดิม
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
            value={selectLineName} // ใช้ selectLineName แทน lineName
            onChange={(e) => setSelectLineName(e.target.value)} // ใช้ setSelectLineName แทน setLineName
            placeholder="กรอกชื่อ Line Name"
          />
        </div>
        <button
          className="w-full bg-blue-500 text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? "กำลังสร้าง..." : "สร้าง"}
        </button>
        <TableComponent
          headers={lineNameHeader}
          datas={selectLineNameBody}
          TableName="Line name list"
          searchColumn="Line Name"
          filterColumn="Line Name"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <div>
            <label
              for="author"
              className="block mb-2 text-sm font-medium text-black "
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
              className="block mb-2 text-sm font-medium text-black "
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
              className="block mb-2 text-sm font-medium text-black "
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="due_date"
              required
            />
          </div>
          <div>
            <label
              for="job_template_name"
              className="block mb-2 text-sm font-medium text-black "
            >
              Checklist Template Name
            </label>
            <input
              type="text"
              id="job_template_name"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Template Name"
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
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="2092-810000-000"
              name="doc_num"
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
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="AE,AF,07,08"
              name="checklist_ver"
              required
            />
          </div>

          <div className="z-50">
            <label
              for="timeout"
              className="block mb-2 text-sm font-medium text-black"
            >
              Line Name
            </label>
            <input
              type="text"
              id="line_name"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="@line_name"
              name="line_name"
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
              options={[
                { value: "12 hrs", label: "12 hrs" },
                { value: "1 days", label: "1 days" },
                { value: "7 days", label: "7 days" },
                { value: "15 days", label: "15 days" },
                { value: "30 days", label: "30 days" },
                { value: "3 mounths", label: "3 months" },
                { value: "6 months", label: "6 months" },
                { value: "12 months", label: "12 months" },
              ]}
              isSearchable={true}
              name="timeout"
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
                className="z-50"
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
        {
          // check if user has permission to create Checklist template
          userEnableFunctions.some(
            (action) => action._id === enabledFunction["create-job-template"]
          ) ? (
            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Create Checklist Template
            </button>
          ) : (
            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-not-allowed"
              disabled
            >
              Create Checklist Template
            </button>
          )
        }
      </form>
      <TableComponent
        headers={approverHeader}
        datas={dataApprover}
        TableName="Approver List"
        searchColumn="Name"
      />
      <TableComponent
        headers={notifyHeader}
        datas={dataNotify}
        TableName="Notify List"
        searchColumn="Name"
      />
    </Layout>
  );
};

export default Page;
