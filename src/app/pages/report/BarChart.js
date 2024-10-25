"use client";
import React, { useState, useRef } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import useFetchReport from "@/lib/hooks/useFetchReport";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import { FaFileCsv, FaImage } from "react-icons/fa";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BarChart = () => {
  const [refresh, setRefresh] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [topN, setTopN] = useState("all");
  const [selectedWorkgroup, setSelectedWorkgroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { report } = useFetchReport(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);

  const filterReportByWorkgroup = (data, workgroup) => {
    if (workgroup === "") return data;
    return data.filter((item) => item.workgroupName === workgroup);
  };

  const filterReportByDateRange = (data, startDate, endDate) => {
    if (!startDate && !endDate) return data;
    return data.filter((item) => {
      const itemDate = new Date(item.createdAt[0]);
      const isAfterStartDate = startDate
        ? itemDate >= new Date(startDate)
        : true;
      const isBeforeEndDate = endDate ? itemDate <= new Date(endDate) : true;
      return isAfterStartDate && isBeforeEndDate;
    });
  };

  const getTopNReport = (data, topN) => {
    const sortedData = data.sort((a, b) => b.jobCount - a.jobCount);
    let mainData = [];
    let otherData = [];

    if (topN === "top5") {
      mainData = sortedData.slice(0, 5);
    } else if (topN === "top10") {
      mainData = sortedData.slice(0, 10);
    } else {
      return sortedData;
    }

    otherData = sortedData.slice(mainData.length);
    return [
      ...mainData,
      {
        userName: "Others",
        jobCount: otherData.reduce((acc, cur) => acc + cur.jobCount, 0),
      },
    ];
  };

  // ฟิลเตอร์ข้อมูลตาม Workgroup และ Date
  const filteredReport = filterReportByDateRange(
    filterReportByWorkgroup(report, selectedWorkgroup),
    startDate,
    endDate
  );

  const finalReport = getTopNReport(filteredReport, topN);

  const workgroupOptions = [
    ...new Set(report.map((item) => item.workgroupName)),
  ];

  const data = {
    labels: finalReport.map((item) => item.userName),
    datasets: [
      {
        label: "Number of Checklists Activated",
        backgroundColor: finalReport.map(
          () => "#" + Math.floor(Math.random() * 16777215).toString(16)
        ),
        data: finalReport.map((item) => item.jobCount),
      },
    ],
  };

  const exportToCSV = () => {
    const formattedData = finalReport.map((item) => ({
      userName: item.userName,
      jobCount: item.jobCount,
      JOB_NAME: Array.isArray(item.JOB_NAME) ? item.JOB_NAME.join(", ") : "",
      LINE_NAME: Array.isArray(item.LINE_NAME) ? item.LINE_NAME.join(", ") : "",
      createdAt: Array.isArray(item.createdAt)
        ? item.createdAt
            .map((date) => new Date(date).toLocaleDateString())
            .join(", ")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    // สร้างชื่อไฟล์ตามกลุ่มงานและ topN ที่เลือก
    const workgroupName = selectedWorkgroup || "All_Workgroups"; // หากไม่เลือกให้ใช้ชื่อ All_Workgroups
    const fileName = `${workgroupName}_top_${topN}.xlsx`; // สร้างชื่อไฟล์

    FileSaver.saveAs(data, fileName); // ใช้ชื่อไฟล์ที่สร้างขึ้น
  };

  const saveAsPNG = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const workgroupName = selectedWorkgroup || "All_Workgroups"; // หากไม่เลือกให้ใช้ชื่อ All_Workgroups
      const fileName = `${workgroupName}_top_${topN}.png`; // สร้างชื่อไฟล์

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName; // ใช้ชื่อไฟล์ที่สร้างขึ้น
      link.click();
    }
  };

  const handleExport = (option) => {
    if (option === "csv") {
      exportToCSV();
    } else if (option === "png") {
      saveAsPNG();
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Top of Checklists Activated by Each Employee Name",
      },
    },
    scales: {
      x: { title: { display: true, text: "Employee Name" } },
      y: {
        type: "logarithmic",
        title: { display: true, text: "Number of Checklists" },
      },
    },
  };

  const today = new Date();
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleCheckboxChange = (monthIndex) => {
    const newSelectedMonths = selectedMonths.includes(monthIndex)
      ? selectedMonths.filter((month) => month !== monthIndex)
      : [...selectedMonths, monthIndex];

    setSelectedMonths(newSelectedMonths);

    if (newSelectedMonths.length > 0) {
      const startMonth = Math.min(...newSelectedMonths);
      const endMonth = Math.max(...newSelectedMonths);
      // ตั้งค่า start date และ end date ตามเดือนที่เลือก
      setStartDate(
        new Date(today.getFullYear(), startMonth, 1).toISOString().slice(0, 10)
      );
      setEndDate(
        new Date(today.getFullYear(), endMonth + 1, 0)
          .toISOString()
          .slice(0, 10)
      );
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between mb-4">
        <div className="mb-4 md:w-1/4">
          <p className="mb-2 font-semibold text-lg">Select Months:</p>
          <button
            onClick={toggleDropdown}
            className="border border-gray-300 rounded-md p-2 w-full text-left"
          >
            {selectedMonths.length > 0
              ? `Selected ${selectedMonths.length} months`
              : "Select Months"}
          </button>
          {dropdownOpen && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto z-10">
              {Array.from({ length: 12 }, (_, index) => {
                const monthName = new Date(
                  today.getFullYear(),
                  index
                ).toLocaleString("default", { month: "long" });
                return (
                  <div
                    key={index}
                    className="flex items-center mb-1 p-2 hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      id={`month_${index}`}
                      value={index}
                      checked={selectedMonths.includes(index)}
                      onChange={() => handleCheckboxChange(index)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`month_${index}`}
                      className="cursor-pointer"
                    >
                      {monthName}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mb-4 w-full md:w-1/4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 mr-2 w-full"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div className="mb-4 w-full md:w-1/4">
          <select
            value={selectedWorkgroup}
            onChange={(e) => setSelectedWorkgroup(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          >
            <option value="">All Workgroups</option>
            {workgroupOptions.map((workgroup) => (
              <option key={workgroup} value={workgroup}>
                {workgroup}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 w-full md:w-1/4">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div className="mb-4 w-full md:w-1/4">
          <select
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          >
            <option value="all">All</option>
            <option value="top5">Top 5</option>
            <option value="top10">Top 10</option>
          </select>
        </div>
        <div className="flex w-full md:w-1/4 mb-4">
          <button
            onClick={() => handleExport("csv")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md mr-2 transition duration-300"
          >
            Export CSV <FaFileCsv />
          </button>
          <button
            onClick={() => handleExport("png")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Save as PNG <FaImage />
          </button>
        </div>
      </div>

      <div style={{ height: "400px", width: "100%" }}>
        {chartType === "bar" && (
          <Bar data={data} options={options} ref={chartRef} />
        )}
        {chartType === "line" && (
          <Line data={data} options={options} ref={chartRef} />
        )}
        {chartType === "pie" && (
          <Pie data={data} options={options} ref={chartRef} />
        )}
      </div>
    </div>
  );
};

export default BarChart;
