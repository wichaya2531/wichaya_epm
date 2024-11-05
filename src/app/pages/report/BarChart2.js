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
import workgroupColors from "@/components/workgroupColors";
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
const BarChart2 = () => {
  const [refresh, setRefresh] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [topN, setTopN] = useState("all");
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
    if (topN === "top5") {
      mainData = sortedData.slice(0, 5);
    } else if (topN === "top10") {
      mainData = sortedData.slice(0, 10);
    } else {
      return sortedData;
    }
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
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        font: { size: 12, weight: "bold" },
        formatter: (value) => value.toLocaleString(),
      },
    },
    layout: { padding: { top: 20 } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { display: chartType === "bar" },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { display: chartType === "bar" },
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
        <div className="md:w-1/6">
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
      <div className="grid grid-cols-2 gap-4">
        {/* กราฟแยกตามกลุ่มงาน */}
        {workgroupOptions.map((group) => {
          // กรองข้อมูลเฉพาะของกลุ่มงานนั้นๆ
          const filteredGroupData = finalReport.filter(
            (item) => item.workgroupName === group
          );
          return (
            <div key={group} className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {group} {/* แสดงชื่อกลุ่มงาน */}
              </h3>
              {filteredGroupData.length > 0 ? ( // ตรวจสอบว่ามีข้อมูลหรือไม่
                <div style={{ height: "200px", width: "100%" }}>
                  {chartType === "bar" && (
                    <Bar
                      data={{
                        labels: filteredGroupData.map((item) => item.userName), // ชื่อผู้ใช้
                        datasets: [
                          {
                            label: `Number of Checklists for ${group}`, // ชื่อกลุ่มงาน
                            backgroundColor: workgroupColors[group], // สีพื้นหลังสำหรับกลุ่มงาน
                            data: filteredGroupData.map(
                              (item) => item.jobCount
                            ), // จำนวน Checklists
                          },
                        ],
                      }}
                      options={options}
                    />
                  )}
                  {chartType === "pie" && (
                    <Pie
                      data={{
                        labels: filteredGroupData.map((item) => item.userName), // ชื่อผู้ใช้
                        datasets: [
                          {
                            label: `Number of Checklists for ${group}`, // ชื่อกลุ่มงาน
                            backgroundColor: workgroupColors[group], // สีพื้นหลังสำหรับกลุ่มงาน
                            data: filteredGroupData.map(
                              (item) => item.jobCount
                            ), // จำนวน Checklists
                          },
                        ],
                      }}
                      options={options}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-4">
                  ไม่มีข้อมูลสำหรับกลุ่มงานนี้ {/* ข้อความเมื่อไม่มีข้อมูล */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart2;
