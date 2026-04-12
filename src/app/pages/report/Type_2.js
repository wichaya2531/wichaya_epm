"use client";
import React, { useState, useEffect } from "react";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO, isValid, startOfToday } from "date-fns";
import "chartjs-adapter-date-fns";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import TableReportDoc from "@/components/TableReportDoc";
import { set } from "react-hook-form";

const Type_2 = ({
  report,
  isLoading,
  //onDateStartFilterChange,
  //onDateEndFilterChange,
  //onPullData,
  onWorkgroupSelect,
  workgroupOfUser,
  dateTimeStart,
  dateTimeEnd,
}) => {

   //console.log('report Data',report);
    

  console.log('workgroupOfUser',workgroupOfUser);



 // console.log('report in reportDoc',report);
  const [workgroups, setWorkgroups] = useState([]);
 // const [refresh, setRefresh] = useState(false);

    const onStart = new Date();
    onStart.setDate(onStart.getDate() - 1); // ย้อน 1 วัน
    onStart.setHours(0, 0, 0, 0); // ตั้งเวลาเป็น 00:00:00.000

    const onEnd = new Date();
    onEnd.setHours(23, 59, 59, 999); // ตั้งเวลาเป็น 23:59:59.999

  const [startDate, setStartDate] = useState(new Date(dateTimeStart));
  const [endDate, setEndDate] = useState(new Date(dateTimeEnd));
  // const { lineNames, workgroupNames } =
  //   useFetchReportWorkgroupLinename(refresh);
  //const { user, isLoading: usersloading } = useFetchUsers(refresh);
  //const [selectedLineNames, setSelectedLineNames] = useState([]);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  //const [selectedWDTag, setSelectedWDTag] = useState("");
  //const [selectedDocNumbers, setSelectedDocNumbers] = useState("");
  //const [selectedJobItemNames, setSelectedJobItemNames] = useState([]);
  const [docNumbers, setDocNumbers] = useState([]);
  const [jobItemNames, setJobItemNames] = useState([]);
  const [workgroupNames, setWorkgroupNames] = useState([]);
  const [lineNames, setLineNames] = useState([]);

  //setSelectedWorkgroups([workgroupOfUser]);


  //const [isOpen, setIsOpen] = useState(false);
  //const [isOpen1, setIsOpen1] = useState(false);
  //const [reportType, setReportType] = useState("month");
  //const [currentPage, setCurrentPage] = useState(1);
  // const getLastDayOfMonth = (date) => {
  //   const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  //   return lastDay;
  // };
  // const pastelColors = {
  //   "9309A": "#FFB6C1",
  //   "9303A": "#ADD8E6",
  //   "9311A": "#FF7F50",
  //   M4421: "#FFB3A0",
  //   "9303V": "#FF69B4",
  //   "23U05B": "#FF1493",
  //   "9303ZD": "#FFD700",
  //   "9303ZZZ": "#FF4500",
  //   "9919B": "#FFDEAD",
  //   "9303C": "#E6E9A2",
  //   "9920A": "#87CEEB",
  //   "9919A": "#FFA07A",
  // };
  // const colorValues = [
  //   "Pass",
  //   "OK",
  //   "Good",
  //   "Not Change",
  //   "Fail",
  //   "Change",
  //   "Not Change",
  //   "Done",
  //   "Check",
  //   "Unknown",
  // ];
  // const getPastelColorForValue = (value) => {
  //   const colors = new Map([
  //     ["pass", "rgba(198, 255, 198, 0.6)"],
  //     ["ok", "rgba(198, 255, 198, 0.6)"],
  //     ["good", "rgba(204, 229, 255, 0.6)"],
  //     ["change", "rgba(255, 227, 153, 0.6)"],
  //     ["not change", "rgba(255, 239, 204, 0.6)"],
  //     ["fail", "rgba(255, 182, 193, 0.6)"],
  //     ["done", "rgba(221, 160, 221, 0.6)"],
  //     ["check", "rgba(255, 255, 204, 0.6)"],
  //   ]);
  //   return colors.get(value.toLowerCase()) || "rgba(0, 0, 0, 0)";
  // };

  const handlePullData = async () => {
     try {
      const response = await fetch(`/api/report/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({key:'name'}), // ✅ ต้อง stringify
      });
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();
      console.log('data from report',data);
    } catch (error) {
      console.error(error);
    } 
  }


  const fetchWorkgroups = async () => {
    try {
      const response = await fetch(`/api/workgroup/get-workgroups`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();

      //console.log('data workgroup',data);

      setWorkgroups(data.workgroups);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkgroups();
  }, "");

  // useEffect(() => {
  //   const uniqueValues = (key) => [
  //     ...new Set(report.map((item) => item[key]).filter(Boolean)),
  //   ];
  //   setDocNumbers(uniqueValues("DOC_NUMBER"));
  //   setJobItemNames(uniqueValues("JOB_ITEM_NAME"));
  //   setWorkgroupNames(uniqueValues("WORKGROUP_NAME"));
  //   setLineNames(uniqueValues("LINE_NAME"));
  // }, [report]);

  const handleWorkgroupChange = (workgroupName) => {
    // อัปเดต selectedWorkgroups


        // setSelectedWorkgroups((prev) => {
        //   const updatedWorkgroups = prev.includes(workgroupName)
        //     ? prev.filter((item) => item !== workgroupName)
        //     : [...prev, workgroupName];
        //   setSelectedLineNames([]);
        //   setSelectedDocNumbers([]);
        //   setSelectedJobItemNames([]);
        //   return updatedWorkgroups;
        // });
  };


const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const maxDateStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg p-3">
  {/* Layout 2 columns: left = filters, right = sticky button */}
  <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
    
    {/* FILTERS */}
    <fieldset
      style={{
        width: "90%",
        border: "1px solid #f9fafb",
        padding: "5px",
        borderRadius: "5px",
      }}
      className="grid grid-cols-5 gap-4"
    >
      {/* Start Date */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          className={`border border-gray-300 rounded-md py-2 px-3 w-full ${
            isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
          }`}
          value={format(startDate, "yyyy-MM-dd")}
          max={format(maxDateStr, "yyyy-MM-dd")}
          onChange={(e) => {
            onDateStartFilterChange(e.target.value);
            setStartDate(new Date(e.target.value));
          }}
          disabled={isLoading}
        />
      </div>

      {/* End Date */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          className={`border border-gray-300 rounded-md py-2 px-3 w-full ${
            isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
          }`}
          value={format(endDate, "yyyy-MM-dd")}
          max={format(maxDateStr, "yyyy-MM-dd")}
          onChange={(e) => {
            onDateEndFilterChange(e.target.value);
            setEndDate(new Date(e.target.value));
          }}
          disabled={isLoading}
        />
      </div>

      {/* Workgroup */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Workgroup
        </label>
        <select
          className={`w-full border border-gray-300 rounded-md py-2 px-3 bg-white ${
            isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
          }`}
          onChange={(e) => {
            handleWorkgroupChange(e.target.value);
            onWorkgroupSelect(e.target.value);
          }}
          disabled={isLoading}
        >
          <option value={workgroupOfUser.workgroup}>
            {workgroupOfUser.workgroup}
          </option>
          {workgroups
            .filter((w) => w.WORKGROUP_NAME !== workgroupOfUser.workgroup)
            .map((w) => (
              <option key={w.WORKGROUP_NAME} value={w.WORKGROUP_NAME}>
                {w.WORKGROUP_NAME}
              </option>
            ))}
        </select>
      </div>
      {/* Checklist Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Checklist Name
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded-md py-2 px-3 w-full"
          disabled={isLoading}
        />
      </div>
      {/* Line Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Line Name
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded-md py-2 px-3 w-full"
          disabled={isLoading}
        />
      </div>

      {/* DOC No */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          DOC No.
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded-md py-2 px-3 w-full"
          disabled={isLoading}
        />
      </div>

      {/* WD_TAG */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WD_TAG
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded-md py-2 px-3 w-full"
          disabled={isLoading}
        />
      </div>
    </fieldset>

    {/* STICKY BUTTON (right side) */}
    <div className="sticky top-6 self-start">
      <button
        className={`bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-md shadow ${
          isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
        }`}
        onClick={handlePullData}
        disabled={isLoading}
      >
        Search Data
      </button>
    </div>

  </div>

  {/* Below content */}
  <div className="flex flex-col mt-4">
    {/* ...DOC Numbers / table / report... */}

         


  </div>
</div>

  );
};
export default Type_2;
