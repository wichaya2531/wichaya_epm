"use client";

import Layout from "@/components/Layout.js";
import TableComponent from "@/components/TableComponent.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "../../../config/config.js";
import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { FaPlus } from "react-icons/fa";
//import useFetchMachines from "@/lib/hooks/useFetchMachines.js";
import useFetchUser from "@/lib/hooks/useFetchUser.js";

const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useFetchUser();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setcurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wdTag, setWdTag] = useState("");
  const [machineName, setMachineName] = useState("");

  // ── Search + PageSize state ───────────────────────────────────────────────────
  const [searchWdTag, setSearchWdTag]             = useState("");
  const [searchMachineName, setSearchMachineName] = useState("");
  const [pageSize, setPageSize]                   = useState(10);
  const lineNameHeader = [
    "ID",
    "WD_TAG",
    "MACHINE NAME",
    "Created At",
    "Created by",
    "Action",
  ];


  useEffect(() => {
    if (!user) return;

    const fetchMachines = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/machine/get-machines?workgroup_id=${user.workgroup_id}`);
        const data = await res.json();
        setMachines(data.machines);
      } catch (err) {
                  console.log("Error Code : 127");

        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, [user]);


  
  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredMachines = machines?.filter((machine) => {
    const matchWd   = machine.wd_tag?.toLowerCase().includes(searchWdTag.toLowerCase());
    const matchName = machine.name?.toLowerCase().includes(searchMachineName.toLowerCase());
    return matchWd && matchName;
  }) ?? [];

  const machineTableBody = filteredMachines.map((machine, index) => ({
    ID: index + 1,
    WD_TAG: machine.wd_tag || "Unknown",
    "MACHINE NAME": machine.name || "Unknown",
    "Created At": machine.createdAt
      ? new Date(machine.createdAt).toLocaleString()
      : "Unknown",
    "Created by": machine.createdBy || "Unknown",
    // เพิ่มเงื่อนไขการแสดง Action ปุ่ม ถ้า workgroup ตรง
    Action:
      machine.workgroup === user.workgroup ? (
        <div className="flex gap-2 items-center justify-center">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded"
            onClick={() => handleUpdate(machine)}
          >
            update
          </button>
          <button
            className="bg-red-500 hover:bg-orange-700 text-white font-semibold py-1 px-2 rounded"
            onClick={() => handleRemove(machine._id)}
          >
            remove
          </button>
        </div>
      ) : null,
  }));

  // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
  const getCurrentUser = async () => {
    const session = await getSession();
    if (session) {
      setcurrentUser(session);
    } else {
      console.error("Failed to get session.");
    }
  };

  const handleCreate = async () => {
    if (!wdTag || !machineName) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter both WD TAG and MACHINE NAME",
      });
      return;
    }
    // // ตรวจสอบข้อมูลที่ส่งไปใน body
    // console.log("Data to be sent:", {
    //   wd_tag: wdTag,
    //   machine_name: machineName,
    //   created_by: user.name, // ตรวจสอบข้อมูล created_by
    //   workgroup: user.workgroup, // ตรวจสอบข้อมูล workgroup
    // });

      //console.log('user workgroup ',user);

    setIsLoading(true);

    //setIsLoading(false);
    //return;
    try {
      const response = await fetch(`/api/machine/create-machine-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wd_tag: wdTag,
          machine_name: machineName,
          created_by: user.name,
          workgroup: user.workgroup,
          workgroup_id:user.workgroup_id
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Machine created successfully",
        });
        setMachines((prevMachines) => [...prevMachines, data.machine]);
        setWdTag("");
        setMachineName("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Unable to create machine: ${data.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (machine) => {
    const { value: inputs } = await Swal.fire({
      title: "Update Machine",
      html: `<div style="display:flex; flex-direction:column; gap:16px;">

  <!-- WD TAG -->
  <div style="position:relative;">
    <label for="wdTag"
      class="pointer-events-none absolute left-3 top-1 bg-white px-1
             text-gray-500 text-sm transition-all z-10
             peer-focus:top-[-6px] peer-focus:text-xs peer-focus:text-blue-600
             peer-valid:top-[-6px] peer-valid:text-xs">
      WD TAG
    </label>

    <input id="wdTag"
      class="swal2-input peer w-[320px] border border-gray-300 rounded-md
             px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
      placeholder=" "
      value="${machine.wd_tag || ""}">
  </div>

  <!-- MACHINE NAME -->
  <div style="position:relative;">
    <label for="machineName"
      class="pointer-events-none absolute left-3 top-1 bg-white px-1
             text-gray-500 text-sm transition-all z-10
             peer-focus:top-[-6px] peer-focus:text-xs peer-focus:text-blue-600
             peer-valid:top-[-6px] peer-valid:text-xs">
      MACHINE NAME
    </label>

    <input id="machineName"
      class="swal2-input peer w-[320px] border border-gray-300 rounded-md
             px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
      placeholder=" "
      value="${machine.name || ""}">
  </div>

</div>`,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Update",
      preConfirm: () => {
        const newWdTag = Swal.getPopup().querySelector("#wdTag").value;
        const newName = Swal.getPopup().querySelector("#machineName").value;

        if (!newWdTag || !newName) {
          Swal.showValidationMessage("Please fill in both fields");
          return false; // ถ้าผู้ใช้ยังไม่ได้กรอกทั้งสองช่อง
        }

        return { wd_tag: newWdTag, machine_name: newName }; // ส่งค่าที่กรอกไป
      },
    });

    // เช็ค inputs ว่ามีค่าหรือไม่
    if (inputs) {
      try {
        const response = await fetch(
          `/api/machine/edit-machine/${machine._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wd_tag: inputs.wd_tag,
              machine_name: inputs.machine_name,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // ถ้าอัปเดตสำเร็จ, อัปเดต state (machines) ในทันที
          setMachines((prevMachines) =>
            prevMachines.map((item) =>
              item._id === machine._id
                ? {
                    ...item,
                    wd_tag: inputs.wd_tag, // เปลี่ยนจาก WD_TAG เป็น wd_tag
                    name: inputs.machine_name, // เปลี่ยนจาก MACHINE_NAME เป็น name
                  }
                : item
            )
          );
          Swal.fire("Updated!", "The machine has been updated.", "success");
        } else {
          Swal.fire(
            "Update Failed",
            "There was a problem updating the machine.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error updating machine:", error);
        Swal.fire("Error", "There was an error updating the machine.", "error");
      }
    }
  };

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
        const response = await fetch(`/api/machine/delete-machine/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // ถ้าลบสำเร็จ, อัปเดตข้อมูลใน state
          setMachines((prevMachines) =>
            prevMachines.filter((machine) => machine._id !== id)
          );
          Swal.fire("Deleted!", "The machine has been deleted.", "success");
        } else {
          Swal.fire(
            "Delete Failed",
            "There was a problem deleting the machine.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error removing machine:", error);
        Swal.fire("Error", "There was an error deleting the machine.", "error");
      }
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/manageLineName.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-primary">Manage Machine ID Tag</h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Manage Machine Id Tag
        </h1>
      </div>
      <div
        className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
        style={{ width: "100%" }}
      >
        <h2 className="text-primary text-xl font-bold mb-4">
          Manage Machine Id Tag{" "}  
        </h2>
        <div className="mb-6 max-w-lg space-y-4 flex flex-col h-full">
          <div className="flex flex-row gap-4">
            <div className="relative flex flex-col w-1/2">
              <label
                htmlFor="wdTag"
                className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
              >
                WD TAG
              </label>
              <input
                type="text"
                id="wdTag"
                
                    //className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
               className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
                value={wdTag}
                onChange={(e) => setWdTag(e.target.value)}
                placeholder="Enter WD_TAG"
              />
            </div>
            {/* MACHINE NAME */}
            <div className="relative flex flex-col w-1/2">
              <label
                htmlFor="machineName"
                className="pointer-events-none absolute left-3 top-0 bg-white px-1
                          text-gray-500 text-sm transition-all z-10
                          peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600
                          peer-valid:top-1 peer-valid:text-xs"
              >
                MACHINE NAME
              </label>
              <input
                type="text"
                id="machineName"
                //className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2
                       focus:outline-none focus:border-blue-500"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                placeholder="Enter MACHINE NAME"
              />
            </div>
            <div className="flex justify-start mt-auto">
              <button
                className="bg-blue-600 text-white rounded-lg px-6 py-3 disabled:opacity-50 flex items-center justify-center transition-all duration-300 hover:bg-blue-700"
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-3 animate-spin">
                      <FaPlus /> {/* ไอคอนโหลด */}
                    </div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-3" /> {/* ไอคอนบวก */}
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* ── Search + Rows Bar ──────────────────────────────────────────── */}
        <div className="flex items-end gap-3 mb-0">
          {/* Search WD_TAG */}
          <div className="relative w-[200px]">
            <label className="pointer-events-none absolute left-3 top-1 bg-white px-1 text-gray-500 text-xs z-10">
              Search WD TAG
            </label>
            <input
              type="text"
              value={searchWdTag}
              onChange={(e) => { setSearchWdTag(e.target.value); setCurrentPage(1); }}
              placeholder="e.g. WD-001"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm
                         focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Search MACHINE NAME */}
          <div className="relative w-[200px]">
            <label className="pointer-events-none absolute left-3 top-1 bg-white px-1 text-gray-500 text-xs z-10">
              Search Machine Name
            </label>
            <input
              type="text"
              value={searchMachineName}
              onChange={(e) => { setSearchMachineName(e.target.value); setCurrentPage(1); }}
              placeholder="e.g. CNC-01"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm
                         focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rows */}
          <div className="relative w-[100px]">
            <label className="pointer-events-none absolute left-3 top-1 bg-white px-1 text-gray-500 text-xs z-10">
              Rows
            </label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm
                         focus:outline-none focus:border-blue-500"
            >
              {[5, 10, 15, 20, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          {(searchWdTag || searchMachineName) && (
            <button
              type="button"
              onClick={() => { setSearchWdTag(""); setSearchMachineName(""); setCurrentPage(1); }}
              className="shrink-0 px-4 py-2 text-sm rounded-lg border border-red-400 text-red-500 hover:bg-red-50 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {(searchWdTag || searchMachineName) && (
          <p className="text-sm text-gray-500 mb-0">
            Found <span className="font-semibold text-gray-700">{filteredMachines.length}</span> result{filteredMachines.length !== 1 ? "s" : ""}
          </p>
        )}

        <TableComponent
          headers={lineNameHeader}
          datas={machineTableBody}
          TableName="Machine list"
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          controlledPageSize={pageSize}
          disablePageSize
          disableFilter
        />
      </div>
    </Layout>
  );
};

export default Page;
