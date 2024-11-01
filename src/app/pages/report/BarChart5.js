"use client";
import React, { useState, useRef } from "react";
import { Line } from "react-chartjs-2";
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
  PointElement,
  LineElement,
  TimeScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import useFetchReport1 from "@/lib/hooks/useFetchReport1";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO, isValid, startOfToday } from "date-fns";
import "chartjs-adapter-date-fns";
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
  ChartDataLabels,
  PointElement,
  LineElement,
  TimeScale
);

const BarChart5 = () => {
  const [refresh, setRefresh] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const { report } = useFetchReport1(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);
  const [selectedLineNames, setSelectedLineNames] = useState([]);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const pastelColors = {
    "9309A": "#FFB6C1",
    "9303A": "#ADD8E6",
    "9311A": "#FF7F50",
    M4421: "#FFB3A0",
    "9303V": "#FF69B4",
    "23U05B": "#FF1493",
    "9303ZD": "#FFD700",
    "9303ZZZ": "#FF4500",
    "9919B": "#FFDEAD",
    "9303C": "#E6E9A2",
    "9920A": "#87CEEB",
    "9919A": "#FFA07A",
  };
  const groupedDataByLineNameAndWorkgroup = report
    .filter(
      (item) =>
        item.LINE_NAME &&
        item.LINE_NAME !== "unknown" &&
        item.LINE_NAME.trim() !== "" &&
        item.WORKGROUP_NAME &&
        item.WORKGROUP_NAME !== "unknown" &&
        item.jobItemsCreatedAt &&
        item.ACTUAL_VALUE
    )
    .map((item) => {
      const createdAt = parseISO(item.jobItemsCreatedAt);
      if (isNaN(createdAt.getTime())) {
        console.warn(
          `Invalid date for jobItemsCreatedAt: ${item.jobItemsCreatedAt}`
        );
        return null;
      }
      return {
        lineName: item.LINE_NAME,
        workgroupName: item.WORKGROUP_NAME,
        x: createdAt.toISOString(),
        y: parseFloat(item.ACTUAL_VALUE),
      };
    })
    .filter((item) => item !== null)
    .filter((item) => {
      const date = new Date(item.x);
      return date >= startDate && date <= endDate; // ฟิลเตอร์วันที่
    })
    .reduce((acc, curr) => {
      const groupKey = `${curr.lineName}-${curr.workgroupName}`;
      const lineGroup = acc[groupKey] || [];
      const existing = lineGroup.find((item) => item.x === curr.x);
      if (existing) {
        existing.y += curr.y;
      } else {
        lineGroup.push({ x: curr.x, y: curr.y });
      }
      acc[groupKey] = lineGroup;
      return acc;
    }, {});

  const sortedDataByLineNameAndWorkgroup = Object.entries(
    groupedDataByLineNameAndWorkgroup
  ).reduce((acc, [groupKey, data]) => {
    acc[groupKey] = data.sort((a, b) => new Date(a.x) - new Date(b.x));
    return acc;
  }, {});
  const datasets = Object.keys(sortedDataByLineNameAndWorkgroup)
    .filter((groupKey) => {
      const [lineName, workgroupName] = groupKey.split("-");
      return (
        lineName !== "Unknown" && // ไม่แสดง LINE_NAME เป็น "Unknown"
        workgroupName !== "Unknown" && // ไม่แสดง WORKGROUP_NAME เป็น "Unknown"
        (selectedLineNames.length === 0 ||
          selectedLineNames.includes(lineName)) &&
        (selectedWorkgroups.length === 0 ||
          selectedWorkgroups.includes(workgroupName))
      );
    })
    .map((groupKey) => {
      const [lineName, workgroupName] = groupKey.split("-");
      const color = pastelColors[lineName] || getRandomPastelColor();
      return {
        label: `${lineName} - ${workgroupName}`,
        type: "line",
        borderColor: color,
        backgroundColor: color.replace(", 1)", ", 0.1)"),
        data: sortedDataByLineNameAndWorkgroup[groupKey].map((item) => ({
          x: item.x,
          y: item.y,
        })),
        tension: 0.4,
        fill: true,
      };
    });

  const data = {
    labels: [], // ใช้แกน x ใน dataset โดยตรงแทน labels นี้
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        font: {
          size: 12,
          weight: "bold",
        },
        formatter: (value) => value.y.toLocaleString(),
      },
    },
    layout: {
      padding: {
        top: 30,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    scales: {
      x: {
        type: "time", // กำหนดให้แกน x เป็นประเภท time
        time: {
          unit: "month", // แสดงหน่วยเป็นเดือน
          displayFormats: {
            month: "MMM yyyy", // เปลี่ยนเป็น 'MMM yyyy'
          },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        type: "logarithmic", // เปลี่ยนแกน Y เป็นลอการิธึม
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: (value) => value.toLocaleString(),
        },
      },
    },
  };
  const handleWorkgroupChange = (workgroupName) => {
    setSelectedWorkgroups((prevSelected) =>
      prevSelected.includes(workgroupName)
        ? prevSelected.filter((name) => name !== workgroupName)
        : [...prevSelected, workgroupName]
    );
  };
  // สร้างตัวเลือกกลุ่มงานทั้งหมด
  const availableWorkgroups = [
    ...new Set(
      report
        .map((item) => item.WORKGROUP_NAME)
        .filter((name) => name && name.trim() !== "" && name !== "Unknown") // กรองค่าว่างและ "unknown"
    ),
  ];
  const handleLineNameChange = (lineName) => {
    setSelectedLineNames((prevSelected) =>
      prevSelected.includes(lineName)
        ? prevSelected.filter((name) => name !== lineName)
        : [...prevSelected, lineName]
    );
  };
  // สร้างตัวเลือกสายงานทั้งหมด
  const availableLineNames = [
    ...new Set(
      report
        .map((item) => item.LINE_NAME)
        .filter((name) => name && name.trim() !== "" && name !== "Unknown") // กรองค่าว่างและ "unknown"
    ),
  ];
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", options).replace(",", ""); // ใช้ locale เป็นไทย
  };
  const exportToPDF = async () => {
    const element = chartRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    const exportedData = datasets.map((dataset) => ({
      lineName: dataset.label,
      dataPoints: dataset.data
        .filter((point) => point.y !== "" && !isNaN(point.y)) // กรองข้อมูลที่ ACTUAL_VALUE ไม่มีค่า
        .map((point) => ({
          x: formatDate(point.x), // แปลงวันที่ที่นี่
          y: point.y,
        })),
    }));
    let textYPosition = 20;
    exportedData.forEach(({ lineName, dataPoints }) => {
      pdf.text(`Line Name: ${lineName}`, 10, textYPosition);
      dataPoints.forEach((point) => {
        pdf.text(
          `วันที่: ${point.x}, ACTUAL VALUE: ${point.y}`,
          10,
          (textYPosition += 10)
        );
      });
      textYPosition += 10;
    });
    const imageYPosition = textYPosition + 10;
    pdf.addImage(imgData, "PNG", 10, imageYPosition, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const fileName = `LineNames_${
      selectedLineNames.join(",") || "All_Line_Names"
    }.pdf`;
    pdf.save(fileName);
  };
  const exportToCSV = () => {
    const exportedData = datasets
      .flatMap((dataset) =>
        dataset.data
          .filter((point) => point.y !== "" && !isNaN(point.y)) // กรองข้อมูลที่ ACTUAL_VALUE ไม่มีค่า
          .map((point) => ({
            lineName: dataset.label,
            CreatedAt: formatDate(point.x), // แปลงวันที่ที่นี่
            "ACTUAL VALUE": point.y,
          }))
      )
      .filter(
        (data) => data["ACTUAL VALUE"] !== "" && !isNaN(data["ACTUAL VALUE"])
      );
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileName = `LineNames_${
      selectedLineNames.join(",") || "All_Line_Names"
    }.xlsx`;
    FileSaver.saveAs(data, fileName);
  };
  const saveAsPNG = async () => {
    const chart = chartRef.current;
    if (chart) {
      const canvas = await html2canvas(chart);
      const imgData = canvas.toDataURL("image/png");
      const fileName = `LineNames_${
        selectedLineNames.join(",") || "All_Line_Names"
      }.png`;
      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
        <div>
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={
              startDate && isValid(startDate)
                ? format(startDate, "yyyy-MM-dd")
                : ""
            }
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={
              endDate && isValid(endDate) ? format(endDate, "yyyy-MM-dd") : ""
            }
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <div style={{ position: "relative", width: "200px" }}>
          <button
            onClick={() => setIsOpen((prevOpen) => !prevOpen)}
            style={{ width: "100%", padding: "8px", textAlign: "left" }}
          >
            Workgroups
          </button>
          {isOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ccc",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              <label style={{ display: "block", padding: "5px" }}>
                <input
                  type="checkbox"
                  onChange={() => {
                    setSelectedWorkgroups([]);
                  }}
                  checked={selectedWorkgroups.length === 0}
                />
                All Workgroups
              </label>
              {availableWorkgroups.map((workgroupName) => (
                <label
                  key={workgroupName}
                  style={{ display: "block", padding: "5px" }}
                >
                  <input
                    type="checkbox"
                    value={workgroupName}
                    checked={selectedWorkgroups.includes(workgroupName)}
                    onChange={() => handleWorkgroupChange(workgroupName)}
                  />
                  {workgroupName}
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative", width: "200px" }}>
          <button
            onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
            style={{ width: "100%", padding: "8px", textAlign: "left" }}
          >
            LineNames
          </button>
          {isOpen1 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ccc",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              <label style={{ display: "block", padding: "5px" }}>
                <input
                  type="checkbox"
                  onChange={() => {
                    setSelectedLineNames([]); // รีเซ็ตการเลือก
                  }}
                  checked={selectedLineNames.length === 0}
                />
                All LineNames
              </label>
              {availableLineNames.map((lineName) => (
                <label
                  key={lineName}
                  style={{ display: "block", padding: "5px" }}
                >
                  <input
                    type="checkbox"
                    value={lineName}
                    checked={selectedLineNames.includes(lineName)}
                    onChange={() => handleLineNameChange(lineName)}
                  />
                  {lineName}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(pastelColors).map(([lineName, color]) => (
            <div key={lineName} className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-sm text-gray-700">{lineName}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: "450px", width: "100%" }}>
        <Line data={data} options={options} />
      </div>
      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={() => handleExport("csv")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
        >
          <FaFileCsv />
          <span className="hidden md:inline">Export CSV</span>{" "}
        </button>
        <button
          onClick={() => handleExport("png")}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center space-x-2"
        >
          <FaImage />
          <span className="hidden md:inline">Save as PNG</span>{" "}
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
export default BarChart5;
