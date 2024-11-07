"use client";
import React, { useState, useRef } from "react";
import { Bar, Pie } from "react-chartjs-2";
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import useFetchReport from "@/lib/hooks/useFetchReport";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import workgroupColors from "@/components/workgroupColors";
import ExportButtons from "@/components/ExportButtons";
// Registering necessary components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);
const BarChart = () => {
  const [refresh, setRefresh] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [topN, setTopN] = useState("top10");
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const { report } = useFetchReport(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);
  const filterReportByWorkgroup = (data, selectedWorkgroups) => {
    if (selectedWorkgroups.length === 0) return data;
    return data.filter((item) =>
      selectedWorkgroups.includes(item.workgroupName)
    );
  };
  const filterReportByYear = (data, selectedYear) => {
    if (!selectedYear) return data; // ถ้ายังไม่เลือกปีให้คืนค่าข้อมูลทั้งหมด
    return data.filter((item) => {
      const itemYear = new Date(item.createdAt[0]).getFullYear(); // รับปีจาก createdAt
      return itemYear === parseInt(selectedYear); // เปรียบเทียบปี
    });
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
  // ฟิลเตอร์ข้อมูลตาม Workgroup, Date และ Year
  const filteredReport = filterReportByDateRange(
    filterReportByWorkgroup(report, selectedWorkgroups),
    startDate,
    endDate
  );
  const finalReport = getTopNReport(
    filterReportByYear(filteredReport, selectedYear),
    topN
  );
  const workgroupOptions = [
    ...new Set(report.map((item) => item.workgroupName)),
  ];
  // สร้างข้อมูลสำหรับกราฟ
  const data = {
    labels: finalReport.map((item) => item.userName),
    datasets: [
      {
        label: "Number of Checklists Activated",
        backgroundColor: finalReport.map(
          (item) => workgroupColors[item.workgroupName] || "#F0F0F0" // ใช้สีเทาพาสเทลถ้าไม่พบชื่อ
        ),
        data: finalReport.map((item) => item.jobCount),
      },
    ],
  };
  const exportToPDF = async () => {
    if (!chartRef.current) {
      console.error("Chart element is not ready yet");
      return;
    }
    const pdf = new jsPDF();
    const element = chartRef.current.canvas;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 10;

    pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
    y += imgHeight + 10;

    finalReport.forEach((item, index) => {
      if (y > 270) {
        pdf.addPage();
        y = 10;
      }
      pdf.text(
        `${item.userName}: ${item.jobCount} checklists activated`,
        10,
        y
      );
      y += 10;
    });

    const workgroupName = selectedWorkgroups.length
      ? selectedWorkgroups.join(", ")
      : "All_Workgroups";
    pdf.save(`${workgroupName}_top_${topN}.pdf`);
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
    const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const workgroupName = selectedWorkgroups.length
      ? selectedWorkgroups.join(", ")
      : "All_Workgroups";
    FileSaver.saveAs(new Blob([data]), `${workgroupName}_top_${topN}.xlsx`);
  };

  const saveAsPNG = () => {
    const chart = chartRef.current;
    if (chart) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = chart.width;
      canvas.height = chart.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.src = chart.toBase64Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const workgroupName = selectedWorkgroups.length
          ? selectedWorkgroups.join(", ")
          : "All_Workgroups";
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${workgroupName}_top_${topN}.png`;
        link.click();
      };
    }
  };

  const handleExport = (option) => {
    if (option === "csv") {
      exportToCSV();
    } else if (option === "png") {
      saveAsPNG();
    } else if (option === "pdf") {
      exportToPDF();
    }
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // ซ่อน legend
      title: { display: false }, // ซ่อน title
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        font: {
          size: 12,
          weight: "bold",
        },
        formatter: (value) => value.toLocaleString(),
      },
    },
    layout: { padding: { top: 20 } }, // กำหนด padding ด้านบน
    scales: {
      x: {
        grid: { display: false }, // ซ่อนเส้นกริดแกน x
        border: { display: false }, // ซ่อนเส้นขอบแกน x
        ticks: { display: chartType === "bar" }, // แสดง ticks เมื่อเป็น bar เท่านั้น
      },
      y: {
        grid: { display: false }, // ซ่อนเส้นกริดแกน y
        border: { display: false }, // ซ่อนเส้นขอบแกน y
        ticks: { display: chartType === "bar" }, // แสดง ticks เมื่อเป็น bar เท่านั้น
      },
    },
  };
  const today = new Date();
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [workgroupDropdownOpen, setWorkgroupDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleWorkgroupDropdown = () =>
    setWorkgroupDropdownOpen(!workgroupDropdownOpen);

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

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงการเลือก Workgroup
  const handleWorkgroupCheckboxChange = (workgroup) => {
    const newSelectedWorkgroups = selectedWorkgroups.includes(workgroup)
      ? selectedWorkgroups.filter((wg) => wg !== workgroup)
      : [...selectedWorkgroups, workgroup];

    setSelectedWorkgroups(newSelectedWorkgroups);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
        <div className="relative flex-grow md:flex-grow-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Years
          </label>
          <select
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400"
          >
            <option value="">Select Year</option>
            {Array.from({ length: 10 }, (_, index) => {
              const year = new Date().getFullYear() - index;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
        <div className="relative flex-grow md:flex-grow-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Months
          </label>
          <button
            onClick={toggleDropdown}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none"
          >
            {selectedMonths.length > 0
              ? `Selected ${selectedMonths.length} months`
              : "Select Months"}
          </button>
          {dropdownOpen && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              {Array.from({ length: 12 }, (_, index) => {
                const monthName = new Date(
                  today.getFullYear(),
                  index
                ).toLocaleString("default", {
                  month: "long",
                });
                return (
                  <div
                    key={index}
                    className="flex items-center p-2 hover:bg-gray-100"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workgroup
          </label>
          <button
            onClick={toggleWorkgroupDropdown}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none"
          >
            {selectedWorkgroups.length > 0
              ? `Selected ${selectedWorkgroups.length} workgroups`
              : "Select Workgroups"}
          </button>
          {workgroupDropdownOpen && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              {workgroupOptions.map((workgroup, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    id={`workgroup_${index}`}
                    value={workgroup}
                    checked={selectedWorkgroups.includes(workgroup)}
                    onChange={() => handleWorkgroupCheckboxChange(workgroup)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`workgroup_${index}`}
                    className="cursor-pointer"
                  >
                    {workgroup}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 bg-white focus:border-blue-400"
          >
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Top Checklists
          </label>
          <select
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 bg-white focus:border-blue-400"
          >
            <option value="all">All</option>
            <option value="top5">Top 5</option>
            <option value="top10">Top 10</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(workgroupColors).map(([workgroup, color]) => (
            <div key={workgroup} className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-sm text-gray-700">{workgroup}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: "300px", width: "100%" }}>
        {chartType === "bar" && (
          <Bar data={data} options={options} ref={chartRef} />
        )}
        {chartType === "pie" && (
          <Pie data={data} options={options} ref={chartRef} />
        )}
      </div>
      <ExportButtons handleExport={handleExport} />
    </div>
  );
};

export default BarChart;
