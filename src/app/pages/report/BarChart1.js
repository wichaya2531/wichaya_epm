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
import useFetchReport2 from "@/lib/hooks/useFetchReport2";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import { FaFileCsv, FaImage, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
const BarChart1 = () => {
  const [refresh, setRefresh] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [topN, setTopN] = useState("top10");
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const { report } = useFetchReport2(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);
  const [workgroupDropdownOpen, setWorkgroupDropdownOpen] = useState(false);
  const toggleWorkgroupDropdown = () =>
    setWorkgroupDropdownOpen(!workgroupDropdownOpen);
  // กำหนดสีมินิมอลแบบพาสเทลสำหรับแต่ละ Workgroup
  const workgroupColors = {
    "Tooling NEO": "#FFB3B3", // สีชมพูอ่อน
    "Tooling ESD Realtime": "#B3FFC9", // สีเขียวพาสเทล
    "HSA Tooling Solvent": "#B3D1FF", // สีน้ำเงินพาสเทล
    "HSA Tooling": "#FFB3E6", // สีชมพูพาสเทล
    "Tooling Cleaning": "#FFE0B3", // สีส้มพาสเทล
    "Tooling GTL": "#D1B3FF", // สีม่วงพาสเทล
    "HSA Tooling Automation": "#B3FFF0", // สีฟ้าอ่อนพาสเทล
    "No Workgroup": "#E0E0E0", // สีเทาอ่อน
    Others: "#F0F0F0", // สีเทาพาสเทลอ่อน
  };
  const filterReportByWorkgroup = (data, selectedWorkgroups) => {
    if (selectedWorkgroups.length === 0) return data;
    return data.filter((item) =>
      selectedWorkgroups.includes(item.workgroupName)
    );
  };
  const getTopNReport = (data, topN) => {
    const sortedData = data.sort(
      (a, b) => b.jobTemplateCount - a.jobTemplateCount
    ); // ใช้ jobTemplateCount
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
        workgroupName: "Others",
        jobTemplateCount: otherData.reduce(
          (acc, cur) => acc + cur.jobTemplateCount,
          0
        ),
      },
    ];
  };
  // กรองรายงานตามกลุ่มงาน
  const filteredReport = filterReportByWorkgroup(report, selectedWorkgroups);
  // สร้างรายงานสุดท้ายโดยกรองตามจำนวนที่ต้องการ
  const finalReport = getTopNReport(filteredReport, topN);
  // สร้างข้อมูลสำหรับกราฟ
  const data = {
    labels: finalReport.map(
      (item) => item.workgroupName // ถ้า workgroupName ว่างให้แสดงเป็น "ไม่มีกลุ่มงาน"
    ),
    datasets: [
      {
        label: "Number of Job Templates",
        backgroundColor: finalReport.map(
          (item) => workgroupColors[item.workgroupName] || "#F0F0F0"
        ),
        data: finalReport.map((item) => item.jobTemplateCount), // แกน Y เป็น jobTemplateCount
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
        font: {
          size: 12,
          weight: "bold",
        },
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
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          display: chartType === "bar",
        },
      },
      y: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          display: chartType === "bar",
          beginAtZero: true,
        },
      },
    },
  };
  // ฟังก์ชันการส่งออก PDF
  const exportToPDF = async () => {
    if (!chartRef.current) {
      console.error("Chart element is not ready yet");
      return;
    }
    const element = chartRef.current.canvas; // เข้าถึง canvas ของกราฟ
    const pdf = new jsPDF();

    requestAnimationFrame(async () => {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190; // กำหนดความกว้างของภาพใน PDF
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // เพิ่มภาพใน PDF
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      // เพิ่มหัวข้อ
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("รายงานจำนวน Job Templates", 10, imgHeight + 10);

      // เพิ่มข้อมูลจาก finalReport
      const textYPosition = imgHeight + 20 + 10; // เพิ่มระยะห่างจากหัวข้อ
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      if (finalReport.length === 0) {
        pdf.text("ไม่มีข้อมูลรายงาน", 10, textYPosition);
      } else {
        finalReport.forEach((item, index) => {
          const workgroupDisplayName = item.workgroupName || "ไม่มีกลุ่มงาน";
          pdf.text(
            `${workgroupDisplayName}: ${item.jobTemplateCount} job templates`,
            10,
            textYPosition + index * 10
          );
        });
      }

      // ตั้งชื่อไฟล์ให้สอดคล้องกับกลุ่มงานที่เลือก หรือแสดงเป็น "ไม่มีกลุ่มงาน"
      const workgroupName =
        selectedWorkgroups.length > 0
          ? selectedWorkgroups.map((name) => name || "ไม่มีกลุ่มงาน").join(", ")
          : "All_Workgroups"; // ใช้ชื่อ All_Workgroups ถ้าไม่มีการเลือก

      const fileName = `${workgroupName}_top_${topN}.pdf`; // สร้างชื่อไฟล์

      pdf.save(fileName); // บันทึกไฟล์ PDF
    });
  };

  // ฟังก์ชันการส่งออก CSV
  const exportToCSV = () => {
    const formattedData = finalReport.map((item) => ({
      workgroupName: item.workgroupName || "ไม่มีกลุ่มงาน",
      jobTemplateCount: item.jobTemplateCount,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    // สร้างชื่อไฟล์ตามกลุ่มงานและ topN ที่เลือก
    const workgroupName =
      selectedWorkgroups.length > 0
        ? selectedWorkgroups.join(", ")
        : "All_Workgroups"; // ใช้ชื่อ All_Workgroups ถ้าไม่มีการเลือก
    const fileName = `${workgroupName}_top_${topN}.xlsx`; // สร้างชื่อไฟล์
    FileSaver.saveAs(data, fileName); // บันทึกไฟล์ CSV
  };
  // ฟังก์ชันการบันทึกภาพเป็น PNG
  const saveAsPNG = () => {
    const chart = chartRef.current;
    if (chart) {
      // สร้าง canvas ใหม่
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      // กำหนดขนาด canvas ให้เท่ากับขนาดกราฟ
      canvas.width = chart.width;
      canvas.height = chart.height;
      // ตั้งสีพื้นหลังเป็นสีขาว
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // คัดลอกกราฟไปยัง canvas
      const img = new Image();
      img.src = chart.toBase64Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        // สร้างลิงก์ดาวน์โหลด
        const workgroupName =
          selectedWorkgroups.length > 0
            ? selectedWorkgroups.join(", ")
            : "All_Workgroups"; // ใช้ชื่อ All_Workgroups ถ้าไม่มีการเลือก
        const fileName = `${workgroupName}_top_${topN}.png`; // สร้างชื่อไฟล์
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = fileName; // บันทึกไฟล์ PNG
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
  // ฟังก์ชันสำหรับการเปลี่ยนแปลงการเลือก Workgroup
  const handleWorkgroupCheckboxChange = (workgroup) => {
    const newSelectedWorkgroups = selectedWorkgroups.includes(workgroup)
      ? selectedWorkgroups.filter((wg) => wg !== workgroup)
      : [...selectedWorkgroups, workgroup];
    setSelectedWorkgroups(newSelectedWorkgroups);
  };
  const workgroupOptions = [
    ...new Set(
      report.map(
        (item) => (item.workgroupName ? item.workgroupName : "ไม่มีกลุ่มงาน") // แทนที่ค่าว่างด้วย "ไม่มีกลุ่มงาน"
      )
    ),
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
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
            Top Number
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
      <div style={{ height: "500px", width: "100%" }}>
        {chartType === "bar" && (
          <Bar data={data} options={options} ref={chartRef} />
        )}
        {chartType === "pie" && (
          <Pie data={data} options={options} ref={chartRef} />
        )}
      </div>
      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={() => handleExport("csv")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
        >
          <FaFileCsv />
          <span className="hidden md:inline">Export CSV</span>{" "}
          {/* ซ่อนข้อความเมื่อหน้าจอเล็กกว่า md */}
        </button>

        <button
          onClick={() => handleExport("png")}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
        >
          <FaImage />
          <span className="hidden md:inline">Save as PNG</span>{" "}
          {/* ซ่อนข้อความเมื่อหน้าจอเล็กกว่า md */}
        </button>

        <button
          onClick={() => handleExport("pdf")}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
        >
          <FaFilePdf />
          <span className="hidden md:inline">Export PDF</span>
        </button>
      </div>
    </div>
  );
};

export default BarChart1;
