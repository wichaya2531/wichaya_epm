"use client";
import Layout from "@/components/Layout.js";
import TableComponent from "@/components/TableComponent.js";
import Swal from "sweetalert2";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/utils/utils.js";

const lineNameHeader = ["ID", "Line Name", "Created At", "Action"];

const Page = () => {
  const [selectLineNames, setSelectLineNames] = useState([]);
  const [selectLineName, setSelectLineName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setcurrentUser] = useState(false);

  // แปลงข้อมูล selectLineNames ให้เข้ากับโครงสร้างของตาราง
  const selectLineNameBody = selectLineNames.map((lineName, index) => ({
    ID: index + 1,
    "Line Name": lineName?.name || "Unknown",
    "Created At": lineName?.createdAt
      ? new Date(lineName.createdAt).toLocaleString()
      : "Unknown",
    Action: (
      <div className="flex gap-2 items-center justify-center">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded"
          onClick={() => handleUpdate(lineName)}
        >
          update
        </button>
        <button
          className="bg-red-500 hover:bg-orange-700 text-white font-semibold py-1 px-2 rounded"
          onClick={() => handleRemove(lineName._id)}
        >
          remove
        </button>
      </div>
    ),
  }));

  // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
  const getCurrentUser = async () => {
    const session = await getSession();
    if (session) {
      setcurrentUser(session);
      fetchLineNames(session);
    } else {
      console.error("Failed to get session");
    }

  };

  // ฟังก์ชันอัปเดต Line Name
  const handleUpdate = async (lineName) => {
    const { value: newName } = await Swal.fire({
      title: "Update Line Name",
      input: "text",
      inputLabel: "New Name",
      inputValue: lineName.name || "",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      preConfirm: (newName) => {
        if (!newName) Swal.showValidationMessage("Please enter a new name");
        return newName;
      },
    });

    if (newName) {
      try {
        const response = await fetch(
          `/api/select-line-name/edit-line-name/${lineName._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName }),
          }
        );

        if (response.ok) {
          setSelectLineNames((prevData) =>
            prevData.map((item) =>
              item._id === lineName._id ? { ...item, name: newName } : item
            )
          );
          Swal.fire("Updated!", "The line name has been updated.", "success");
        } else {
          Swal.fire("Update Failed", "There was a problem updating the name.", "error");
        }
      } catch (error) {
        console.error("Error updating line name:", error);
        Swal.fire("Error", "There was an error updating the name.", "error");
      }
    }
  };

  // ฟังก์ชันลบ Line Name
  const handleRemove = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes, delete it!",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/select-line-name/delete-line-name/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setSelectLineNames((prevData) => prevData.filter((lineName) => lineName._id !== id));
          Swal.fire("Deleted!", "The line name has been deleted.", "success");
        } else {
          Swal.fire("Delete Failed", "There was a problem deleting the name.", "error");
        }
      } catch (error) {
        console.error("Error removing line name:", error);
        Swal.fire("Error", "There was an error deleting the name.", "error");
      }
    }
  };

  // ฟังก์ชันสร้าง Line Name
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
      const formData = new FormData();
      formData.append('linename', selectLineName);  
      formData.append('user_id', currentUser.user_id);  

      const response = await fetch(`/api/select-line-name/create-line-name`, {
        method: "POST",
        body: formData,
        // headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ name: selectLineName,user_id: currentUser.user_id }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "สร้างข้อมูลสำเร็จ" });
        setSelectLineNames((prevData) => [...prevData, data.lineName]);
        setSelectLineName("");
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: `ไม่สามารถสร้างข้อมูลได้: ${data.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };


  const fetchLineNames = async (userSession) => {
    try {
        const formData = new FormData();
        formData.append('user_id', userSession.user_id);  
  
        const response = await fetch(`/api/select-line-name/get-line-name`, {
          method: "POST",
          body: formData
        });
  
        const data = await response.json();
      if (data.status === 200){
        setSelectLineNames(data.selectLineNames);
      } else{
          console.error("Failed to fetch data:", data.error);
      }
      
    } catch (error) {
      console.error("Error fetching line names:", error);
    }
  };
  // ดึงข้อมูล Select Line Names จาก API เมื่อ component mount
  useEffect(() => {
    getCurrentUser();
    //console.log("c =>", c);

  }, []);

  return (
    <Layout className="container mx-auto mt-4 px-8 gap-20">
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-4 p-4 bg-white">
          <Image src="/assets/card-logo/template.png" alt="logo" width={50} height={50} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Linename</h1>
            <p className="text-sm font-bold text-secondary">Manage Line names and their lists</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 border border-gray-300 rounded">
        <h2 className="text-xl font-bold mb-4">สร้าง Select Linename</h2>
        <div className="mb-4">
          <label htmlFor="lineName" className="block text-sm font-medium mb-1">Line name:</label>
          <input
            type="text"
            id="lineName"
            className="w-full border border-gray-300 rounded p-2"
            value={selectLineName}
            onChange={(e) => setSelectLineName(e.target.value)}
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
