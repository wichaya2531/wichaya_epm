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

  const calculateDueDate = () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    setDueDate(formattedDate);
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-20">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white ">
          <div className="flex items-center ">
            <Image
              src="/assets/card-logo/template.png"
              alt="wd logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h1 className="text-3xl font-bold text-slate-900">
              Create Line Nane
            </h1>
          </div>
          <p className="text-sm font-bold text-secondary flex  items-center">
            Manage Line names and their lists
          </p>
        </div>
      </div>
      <div className="max-w-md mx-auto my-4 p-4 border border-gray-300 rounded">
        <h2 className="text-xl font-bold mb-4">สร้าง Select Line Name</h2>
        <div className="mb-4">
          <label htmlFor="lineName" className="block text-sm font-medium mb-1">
            Line Name:
          </label>
          <input
            type="text"
            id="lineName" // รักษาชื่อ id ไว้เหมือนเดิม
            className="w-full border border-gray-300 rounded p-2"
            value={selectLineName} // ใช้ selectLineName แทน lineName
            onChange={(e) => setSelectLineName(e.target.value)} // ใช้ setSelectLineName แทน setLineName
            placeholder="กรอกชื่อ Line Name"
          />
        </div>
        <button
          className="bg-blue-500 text-white rounded px-4 py-2 disabled:opacity-50"
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
    </Layout>
  );
};

export default Page;
