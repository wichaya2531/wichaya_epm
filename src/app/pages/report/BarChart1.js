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
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import workgroupColors from "@/components/workgroupColors";
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
  const [topN, setTopN] = useState("All");
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const { report } = useFetchReport2(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);
  const [workgroupDropdownOpen, setWorkgroupDropdownOpen] = useState(false);
  const toggleWorkgroupDropdown = () =>
    setWorkgroupDropdownOpen(!workgroupDropdownOpen);
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
        font: { size: 12, weight: "bold" },
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
        ticks: { display: chartType === "bar", beginAtZero: true },
      },
    },
  };
  // ฟังก์ชันการส่งออก PDF
  const exportToPDF = async () => {
    if (!chartRef.current) {
      console.error("Chart element is not ready yet");
      return;
    }
    const pdf = new jsPDF();
    const element = chartRef.current.canvas;

    requestAnimationFrame(async () => {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      let yPosition = imgHeight + 30;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      finalReport.forEach((item, index) => {
        const workgroupDisplayName = item.workgroupName || "ไม่มีกลุ่มงาน";
        pdf.text(
          `${workgroupDisplayName}: ${item.jobTemplateCount} job templates`,
          10,
          yPosition
        );
        yPosition += 10;
        // เพิ่มหน้าเมื่อข้อมูลเกินความสูงของ PDF
        if (yPosition > pdf.internal.pageSize.height - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      const workgroupName =
        selectedWorkgroups.length > 0
          ? selectedWorkgroups.map((name) => name || "ไม่มีกลุ่มงาน").join(", ")
          : "All_Workgroups";
      pdf.save(`${workgroupName}.pdf`);
    });
  };
  // ฟังก์ชันการส่งออก CSV
  const exportToCSV = () => {
    const formattedData = finalReport.map((item) => ({
      workgroupName: item.workgroupName || "ไม่มีกลุ่มงาน",
      jobTemplateCount: item.jobTemplateCount,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const excelBuffer = XLSX.write(
      { Sheets: { data: ws }, SheetNames: ["data"] },
      { bookType: "xlsx", type: "array" }
    );
    const fileName = `${
      selectedWorkgroups.length > 0
        ? selectedWorkgroups.join(", ")
        : "All_Workgroups"
    }_top_${topN}.xlsx`;
    FileSaver.saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      fileName
    );
  };
  // ฟังก์ชันการบันทึกภาพเป็น PNG
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
        const fileName = `${
          selectedWorkgroups.length > 0
            ? selectedWorkgroups.join(", ")
            : "All_Workgroups"
        }_top_${topN}.png`;
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
      <ExportButtons handleExport={handleExport} />
    </div>
  );
};
export default BarChart1;
