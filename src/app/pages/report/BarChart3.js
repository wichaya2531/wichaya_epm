"use client";
import React, { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
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
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  // สร้างข้อมูลสำหรับกราฟโดยนับจำนวนสมาชิกตามกลุ่มงานและบทบาท
  const roleCountsByWorkgroup = finalReport.reduce((acc, item) => {
    if (!acc[item.workgroupName]) acc[item.workgroupName] = {}; // ถ้าไม่มี group นี้ใน acc ให้สร้างใหม่
    acc[item.workgroupName][item.role] =
      (acc[item.workgroupName][item.role] || 0) + 1; // นับจำนวนสมาชิกในบทบาทนั้น ๆ
    return acc;
  }, {});
  // แปลงข้อมูลให้เป็น array ของกลุ่มงาน และรวมบทบาทในกลุ่มงาน
  const workgroupNames = Object.keys(roleCountsByWorkgroup);
  const roles = Array.from(new Set(finalReport.map((item) => item.role))); // สร้างรายการบทบาททั้งหมดโดยไม่ซ้ำกัน
  // สร้าง datasets สำหรับแต่ละบทบาท
  const datasets = roles.map((role) => {
    const roleName = role || "Other"; // เปลี่ยน undefined เป็น "Other"
    return {
      label: roleName,
      backgroundColor: getColorForRole(roleName), // ฟังก์ชัน getColorForRole ช่วยเลือกสีให้บทบาท
      data: workgroupNames.map(
        (workgroup) => roleCountsByWorkgroup[workgroup][role] || 0 // หากไม่มีสมาชิกในบทบาทนั้นให้ตั้งเป็น 0
      ),
    };
  });
  const data = {
    labels: workgroupNames,
    datasets: datasets,
  };
  function getColorForRole(role) {
    const colors = {
      SA: "#FFB3BA", // โทนพาสเทลสีชมพูอ่อน
      Owner: "#AEC6CF", // โทนพาสเทลสีฟ้าอ่อน
      Checker: "#FFDAC1", // โทนพาสเทลสีส้มอ่อน
      "Admin Group": "#B5EAD7", // โทนพาสเทลสีเขียวอ่อน
    };
    return colors[role] || "#F0F0F0"; // ค่าเริ่มต้นสีขาว
  }
  // ประกาศ roleCounts ก่อนหน้า
  const roleCounts = finalReport.reduce((acc, item) => {
    const workgroupName = item.workgroupName || "Other"; // ถ้า workgroupName เป็น undefined ให้ใช้ค่า "Other"
    const role = item.role || "Other"; // ถ้า role เป็น undefined ให้ใช้ค่า "Other"
    const roleKey = `${workgroupName} - ${role}`;
    acc[roleKey] = (acc[roleKey] || 0) + 1;
    return acc;
  }, {});
  const exportToPDF = async () => {
    const element = chartRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const memberName = "members";
    const fileName = `${memberName}_${
      selectedWorkgroups.join(", ") || "All_Workgroups"
    }.pdf`;

    // Generate roleCounts and sort them
    const roleCounts = finalReport.reduce((acc, item) => {
      const workgroup = item.workgroupName || "Other";
      const role = item.role || "Other";
      const key = `${workgroup} - ${role}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const sortedRoleCounts = Object.entries(roleCounts).sort(
      ([aKey, aVal], [bKey, bVal]) => {
        const [aGroup, aRole] = aKey.split(" - ");
        const [bGroup, bRole] = bKey.split(" - ");
        return aGroup.localeCompare(bGroup) || aVal - bVal;
      }
    );

    let yOffset = 20;
    sortedRoleCounts.forEach(([roleKey, count]) => {
      if (yOffset >= pageHeight - 20) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.text(`${roleKey}: ${count}`, 10, yOffset);
      yOffset += 10;
    });

    // Add chart image
    let remainingHeight = imgHeight;
    let position = yOffset + 10;

    while (remainingHeight > 0) {
      if (position + imgHeight > pageHeight) {
        pdf.addPage();
        position = 10;
      }
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      position += pageHeight;
      remainingHeight -= pageHeight;
    }

    pdf.save(fileName);
  };

  const exportToCSV = () => {
    const roleCounts = finalReport.reduce((acc, item) => {
      const workgroup = item.workgroupName || "Other";
      const role = item.role || "Other";
      const key = `${workgroup} - ${role}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const sortedRoleCounts = Object.entries(roleCounts)
      .sort(([aKey, aVal], [bKey, bVal]) => {
        const [aGroup] = aKey.split(" - ");
        const [bGroup] = bKey.split(" - ");
        return aGroup.localeCompare(bGroup) || aVal - bVal;
      })
      .map(([roleKey, count]) => {
        const [workgroupName, role] = roleKey.split(" - ");
        return { workgroupName, role, count };
      });

    const ws = XLSX.utils.json_to_sheet(sortedRoleCounts);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileName = `${memberName}_${
      selectedWorkgroups.join(", ") || "All_Workgroups"
    }.xlsx`;

    FileSaver.saveAs(data, fileName);
  };

  const saveAsPNG = async () => {
    const chart = chartRef.current;
    if (chart) {
      const canvas = await html2canvas(chart);
      const imgData = canvas.toDataURL("image/png");
      const fileName = `${memberName}_${
        selectedWorkgroups.join(", ") || "All_Workgroups"
      }.png`;
      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;
      link.click();
    }
  };

  // ปรับปรุงฟังก์ชัน handleExport เพื่อรองรับ PDF
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
      legend: { display: true }, // ซ่อน legend
      title: { display: false }, // ซ่อน title
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        font: { size: 12, weight: "bold" },
        formatter: (value) => value.toLocaleString(),
      },
    },
    layout: { padding: { top: 20 } }, // ลด padding ที่ไม่จำเป็น
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
      </div>
      <div style={{ height: "300px", width: "100%" }} ref={chartRef}>
        {chartType === "bar" && <Bar data={data} options={options} />}
      </div>
      <ExportButtons handleExport={handleExport} />
    </div>
  );
};

export default BarChart3;
