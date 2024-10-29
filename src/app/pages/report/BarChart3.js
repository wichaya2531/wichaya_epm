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
import { FaFileCsv, FaImage } from "react-icons/fa";

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

const BarChart3 = () => {
  const [refresh, setRefresh] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [topN, setTopN] = useState("all");
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);

  const { report } = useFetchReport(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);

  // ฟิลเตอร์ข้อมูลตาม Workgroup
  const filterReportByWorkgroup = (data, selectedWorkgroups) => {
    if (!selectedWorkgroups || selectedWorkgroups.length === 0) return data; // ถ้าไม่เลือก Workgroup ให้คืนค่าข้อมูลทั้งหมด
    return data.filter((item) =>
      selectedWorkgroups.includes(item.workgroupName)
    ); // เปรียบเทียบ Workgroup
  };

  // ฟิลเตอร์ข้อมูลตาม Workgroup
  const filteredReport = filterReportByWorkgroup(report, selectedWorkgroups);

  // finalReport จะเป็นข้อมูลที่ฟิลเตอร์แล้ว
  const finalReport = filteredReport; // คืนค่าข้อมูลที่ฟิลเตอร์ตาม Workgroup

  const workgroupOptions = [
    ...new Set(report.map((item) => item.workgroupName)),
  ];

  // กำหนดสีมินิมอลแบบพาสเทลสำหรับแต่ละ Workgroup
  const workgroupColors = {
    "Tooling NEO": "#FFB3B3", // สีชมพูอ่อน
    "Tooling ESD Realtime": "#B3FFC9", // สีเขียวพาสเทล
    "HSA Tooling Solvent": "#B3D1FF", // สีน้ำเงินพาสเทล
    "HSA Tooling": "#FFB3E6", // สีชมพูพาสเทล
    "Tooling Cleaning": "#FFE0B3", // สีส้มพาสเทล
    "Tooling GTL": "#D1B3FF", // สีม่วงพาสเทล
    "HSA Tooling Automation": "#B3FFF0", // สีฟ้าอ่อนพาสเทล
    ไม่มีกลุ่มงาน: "#E0E0E0", // สีเทาอ่อน
    Others: "#F0F0F0", // สีเทาพาสเทลอ่อน
  };

  // สร้างข้อมูลสำหรับกราฟ
  const roleCounts = finalReport.reduce((acc, item) => {
    const roleKey = `${item.workgroupName} - ${item.role}`; // สร้างคีย์สำหรับกลุ่มงานและบทบาท
    acc[roleKey] = (acc[roleKey] || 0) + 1; // นับจำนวนสมาชิกในบทบาทนั้น ๆ
    return acc;
  }, {});

  // แปลงข้อมูลไปเป็น array และเรียงตามกลุ่มงาน
  const sortedRoleCounts = Object.entries(roleCounts).sort((a, b) => {
    const [workgroupA, roleA] = a[0].split(" - "); // ดึงชื่อกลุ่มงานและบทบาทจาก key
    const [workgroupB, roleB] = b[0].split(" - ");

    // เรียงตามชื่อกลุ่มงานก่อน
    const workgroupComparison = workgroupA.localeCompare(workgroupB);
    if (workgroupComparison !== 0) return workgroupComparison;

    // ถ้ากลุ่มงานเท่ากัน ให้เรียงตามจำนวนจากน้อยไปมาก
    return a[1] - b[1]; // a[1] คือจำนวนสมาชิก
  });

  // สร้าง labels และ dataValues จากข้อมูลที่เรียงแล้ว
  const labels = sortedRoleCounts.map(([key]) => key);
  const dataValues = sortedRoleCounts.map(([, count]) => count);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Number of Members by Role and Workgroup",
        backgroundColor: labels.map(
          (label) => workgroupColors[label.split(" - ")[0]] || "#F0F0F0" // ใช้สีตามกลุ่มงาน
        ),
        data: dataValues,
      },
    ],
  };

  const exportToCSV = () => {
    // สร้างข้อมูลสำหรับกราฟและเรียงตามกลุ่มงานและจำนวนจากน้อยไปมาก
    const sortedRoleCounts = Object.entries(roleCounts)
      .sort((a, b) => {
        const [workgroupA] = a[0].split(" - ");
        const [workgroupB] = b[0].split(" - ");
        // เรียงลำดับตามชื่อกลุ่มงาน
        const workgroupComparison = workgroupA.localeCompare(workgroupB);
        if (workgroupComparison !== 0) return workgroupComparison;

        // ถ้ากลุ่มงานเท่ากันให้เรียงตามจำนวนจากน้อยไปมาก
        return a[1] - b[1];
      })
      .map(([roleKey, count]) => {
        const [workgroupName, role] = roleKey.split(" - "); // แยกชื่อกลุ่มงานและบทบาท
        return {
          workgroupName: workgroupName,
          role: role,
          count: count,
        };
      });

    const ws = XLSX.utils.json_to_sheet(sortedRoleCounts);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    // ปรับชื่อไฟล์เพื่อแสดงชื่อสมาชิก
    const memberName = "members"; // เปลี่ยนเป็นชื่อสมาชิกที่ต้องการ
    const fileName = `${memberName}_${
      selectedWorkgroups.join(", ") || "All_Workgroups"
    }.xlsx`;

    FileSaver.saveAs(data, fileName);
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

        // สร้างลิงก์ดาวน์โหลด
        const memberName = "members"; // เปลี่ยนเป็นชื่อสมาชิกที่ต้องการ
        const fileName = `${memberName}_${
          selectedWorkgroups.join(", ") || "All_Workgroups"
        }.png`;

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = fileName;
        link.click();
      };
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
    layout: {
      padding: {
        top: 20,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // ซ่อนเส้นกริดแกน x
        },
        border: {
          display: false, // ซ่อนเส้นขอบแกน x
        },
        ticks: {
          display: chartType === "bar", // แสดง ticks เมื่อเป็น bar เท่านั้น
        },
      },
      y: {
        grid: {
          display: false, // ซ่อนเส้นกริดแกน y
        },
        border: {
          display: false, // ซ่อนเส้นขอบแกน y
        },
        ticks: {
          display: chartType === "bar", // แสดง ticks เมื่อเป็น bar เท่านั้น
        },
      },
    },
  };
  const [workgroupDropdownOpen, setWorkgroupDropdownOpen] = useState(false);

  const toggleWorkgroupDropdown = () =>
    setWorkgroupDropdownOpen(!workgroupDropdownOpen);

  const handleWorkgroupCheckboxChange = (workgroup) => {
    const newSelectedWorkgroups = selectedWorkgroups.includes(workgroup)
      ? selectedWorkgroups.filter((wg) => wg !== workgroup)
      : [...selectedWorkgroups, workgroup];

    setSelectedWorkgroups(newSelectedWorkgroups);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
        <div className="relative md:w-1/6">
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
        <div className="mt-6 space-x-3">
          <button
            onClick={() => handleExport("csv")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
          >
            <FaFileCsv />
            <span className="hidden md:inline">Export CSV</span>{" "}
            {/* ซ่อนข้อความเมื่อหน้าจอเล็กกว่า md */}
          </button>
        </div>
        <div className="mt-6 space-x-3">
          <button
            onClick={() => handleExport("png")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
          >
            <FaImage />
            <span className="hidden md:inline">Save as PNG</span>{" "}
            {/* ซ่อนข้อความเมื่อหน้าจอเล็กกว่า md */}
          </button>
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
    </div>
  );
};

export default BarChart3;
