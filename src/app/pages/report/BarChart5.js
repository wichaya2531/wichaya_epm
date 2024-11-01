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
    .filter((item) => {
      // กรองเฉพาะรายการที่มี LINE_NAME และ WORKGROUP_NAME ที่ไม่เป็นค่า unknown หรือว่าง
      return (
        item.LINE_NAME &&
        item.LINE_NAME !== "unknown" &&
        item.LINE_NAME.trim() !== "" &&
        item.WORKGROUP_NAME &&
        item.WORKGROUP_NAME !== "unknown" &&
        item.WORKGROUP_NAME.trim() !== "" &&
        item.jobItemsCreatedAt
      );
    })
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
        y: parseFloat(item.ACTUAL_VALUE) || 0, // หาก ACTUAL_VALUE เป็นตัวอักษรจะเก็บค่าเป็น 0
        actualValue: item.ACTUAL_VALUE, // เก็บค่า ACTUAL_VALUE ที่เป็นตัวอักษร
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
        existing.y += curr.y; // เพิ่มค่า y
      } else {
        lineGroup.push({ x: curr.x, y: curr.y, actualValue: curr.actualValue }); // เก็บ actualValue
      }
      acc[groupKey] = lineGroup;
      return acc;
    }, {});

  // แปลง ACTUAL_VALUE ที่เป็นตัวอักษรโดยอ้างอิงค่าก่อนหน้าหรือค่าถัดไป
  Object.entries(groupedDataByLineNameAndWorkgroup).forEach(
    ([groupKey, data]) => {
      data.forEach((item, index) => {
        // แปลงค่าจากตัวอักษรโดยใช้ค่าก่อนหน้าและค่าถัดไป
        if (isNaN(item.y) && item.actualValue) {
          const previousValue = index > 0 ? data[index - 1].y : null;
          const nextValue = index < data.length - 1 ? data[index + 1].y : null;
          if (previousValue !== null) {
            item.y = previousValue; // ใช้ค่าก่อนหน้าเป็นค่าปัจจุบัน
          } else if (nextValue !== null) {
            item.y = nextValue; // ใช้ค่าถัดไปเป็นค่าปัจจุบัน
          }
        }
      });
    }
  );

  // จัดเรียงข้อมูลที่ได้
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
        lineName !== "unknown" &&
        workgroupName !== "unknown" &&
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
          actualValue: item.actualValue, // เก็บ actualValue ที่เป็นตัวอักษร
        })),
        tension: 0.4,
        fill: true,
        datalabels: {
          display: true,
          color: "#000",
          anchor: "end",
          align: "top",
          font: {
            size: 12,
            weight: "bold",
          },
          formatter: (value) => {
            return value.actualValue; // แสดง actualValue ที่เป็นตัวอักษร
          },
        },
      };
    });
  const data = {
    labels: [],
    datasets: datasets,
  };
  // อัปเดต options เพื่อให้ใช้ datalabels
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
        formatter: (value) => value.actualValue, // แสดง actualValue ที่เป็นตัวอักษร
      },
    },
    layout: {
      padding: {
        top: 30,
        bottom: 0,
        left: 0,
        right: 20,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
          displayFormats: {
            month: "MMM yyyy",
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
        type: "logarithmic",
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
        <div className="relative">
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            className="bg-white border border-gray-300 rounded-md py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500"
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
        <div className="relative">
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <input
            className="bg-white border border-gray-300 rounded-md py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500"
            type="date"
            id="end-date"
            value={
              endDate && isValid(endDate) ? format(endDate, "yyyy-MM-dd") : ""
            }
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workgroups
          </label>
          <button
            onClick={() => setIsOpen((prevOpen) => !prevOpen)}
            className="  rouw-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none"
          >
            Select Workgroups
          </button>
          {isOpen && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={() => setSelectedWorkgroups([])}
                  checked={selectedWorkgroups.length === 0}
                />
                All Workgroups
              </label>
              {availableWorkgroups.map((workgroupName) => (
                <label key={workgroupName} className="block p-2 cursor-pointer">
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
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LineNames
          </label>
          <button
            onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none"
          >
            Select LineNames
          </button>
          {isOpen1 && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={() => setSelectedLineNames([])} // รีเซ็ตการเลือก
                  checked={selectedLineNames.length === 0}
                />
                All LineNames
              </label>
              {availableLineNames.map((lineName) => (
                <label key={lineName} className="block p-2 cursor-pointer">
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
