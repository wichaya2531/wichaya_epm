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
import { FaFileCsv, FaImage, FaFilePdf } from "react-icons/fa";
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
    const element = chartRef.current; // ดึงการอ้างอิงของ chart
    const canvas = await html2canvas(element); // แปลงเป็น canvas
    const imgData = canvas.toDataURL("image/png"); // แปลง canvas เป็น image
    const pdf = new jsPDF();
    const imgWidth = 190; // ความกว้างของภาพใน PDF
    const pageHeight = pdf.internal.pageSize.height; // ความสูงของหน้า PDF
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // คำนวณความสูงของภาพ
    let heightLeft = imgHeight;
    let position = 0;
    // สร้าง roleCounts จาก finalReport
    const roleCounts = finalReport.reduce((acc, item) => {
      const workgroupName = item.workgroupName || "Other"; // ถ้า workgroupName เป็น undefined ให้ใช้ค่า "Other"
      const role = item.role || "Other"; // ถ้า role เป็น undefined ให้ใช้ค่า "Other"
      const roleKey = `${workgroupName} - ${role}`;
      acc[roleKey] = (acc[roleKey] || 0) + 1; // นับจำนวนบทบาทในแต่ละกลุ่มงาน
      return acc;
    }, {});
    // จัดเรียงข้อมูลตามกลุ่มงานและบทบาท
    const sortedRoleCounts = Object.entries(roleCounts).sort((a, b) => {
      const [workgroupA, roleA] = a[0].split(" - ");
      const [workgroupB, roleB] = b[0].split(" - ");
      const roleComparison = a[1] - b[1]; // เปรียบเทียบจำนวน
      if (workgroupA === workgroupB) {
        return roleComparison; // ถ้าเป็นกลุ่มงานเดียวกัน ให้เปรียบเทียบจำนวน
      }
      return workgroupA.localeCompare(workgroupB); // ถ้าไม่ใช่กลุ่มงานเดียวกัน ให้เปรียบเทียบชื่อกลุ่มงาน
    });
    // แสดงข้อมูลกลุ่มงานและบทบาท
    let textYPosition = 20; // ตำแหน่ง Y สำหรับข้อความเริ่มต้น
    sortedRoleCounts.forEach(([roleKey, count]) => {
      const [workgroupName, role] = roleKey.split(" - ");
      pdf.text(`${workgroupName} - ${role}: ${count}`, 10, textYPosition); // แสดงข้อมูลกลุ่มงาน
      textYPosition += 10; // เพิ่มตำแหน่ง Y สำหรับข้อความถัดไป
    });
    // เลื่อนตำแหน่งภาพลงจากข้อความ
    const imageYPosition = textYPosition + 10; // เพิ่มพื้นที่ว่างระหว่างข้อความและรูปภาพ
    pdf.addImage(imgData, "PNG", 10, imageYPosition, imgWidth, imgHeight); // เพิ่มภาพใน PDF
    heightLeft -= pageHeight;
    // เพิ่มหน้าใหม่ถ้าภาพยาวเกินไป
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const memberName = "members"; // ชื่อที่ใช้ในไฟล์ PDF
    const fileName = `${memberName}_${
      selectedWorkgroups.join(", ") || "All_Workgroups"
    }.pdf`; // ตั้งชื่อไฟล์ PDF

    pdf.save(fileName); // บันทึกไฟล์ PDF
  };
  // ฟังก์ชันสำหรับส่งออกข้อมูลเป็น CSV
  const exportToCSV = () => {
    const sortedRoleCounts = Object.entries(roleCounts)
      .sort((a, b) => {
        const [workgroupA] = a[0].split(" - ");
        const [workgroupB] = b[0].split(" - ");
        const workgroupComparison = workgroupA.localeCompare(workgroupB);
        if (workgroupComparison !== 0) return workgroupComparison;
        return a[1] - b[1];
      })
      .map(([roleKey, count]) => {
        const [workgroupName, role] = roleKey.split(" - ");
        return { workgroupName, role, count };
      });
    const ws = XLSX.utils.json_to_sheet(sortedRoleCounts);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const memberName = "members";
    const fileName = `${memberName}_${
      selectedWorkgroups.join(", ") || "All_Workgroups"
    }.xlsx`;
    FileSaver.saveAs(data, fileName);
  };
  // ฟังก์ชันสำหรับบันทึกกราฟเป็น PNG
  const saveAsPNG = async () => {
    const chart = chartRef.current; // ดึงการอ้างอิงของ chart
    if (chart) {
      const canvas = await html2canvas(chart); // ใช้ html2canvas แทน
      const imgData = canvas.toDataURL("image/png"); // แปลง canvas เป็น image
      const memberName = "members";
      const fileName = `${memberName}_${
        selectedWorkgroups.join(", ") || "All_Workgroups"
      }.png`;
      const link = document.createElement("a");
      link.href = imgData; // ใช้ imgData ที่ได้จาก canvas
      link.download = fileName; // ตั้งชื่อไฟล์
      link.click(); // ดาวน์โหลดไฟล์
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
      </div>
      <div style={{ height: "300px", width: "100%" }} ref={chartRef}>
        {chartType === "bar" && <Bar data={data} options={options} />}
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

export default BarChart3;
