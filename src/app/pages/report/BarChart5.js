"use client";
import React, { useState, useRef, useEffect } from "react";
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
// import useFetchReportWorkgroupLinename from "@/lib/hooks/useFetchReportWorkgroupLinename";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO, isValid, startOfToday } from "date-fns";
import "chartjs-adapter-date-fns";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ShowChart,
  VisibilityOff,
  CalendarViewMonth,
} from "@mui/icons-material";
import TableReport from "@/components/TableReport";
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
  const { report, isLoading } = useFetchReport1(refresh);
  // const { lineNames, workgroupNames } =
  //   useFetchReportWorkgroupLinename(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);
  const [selectedLineNames, setSelectedLineNames] = useState([]);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const [selectedDocNumbers, setSelectedDocNumbers] = useState([]);
  const [selectedJobItemNames, setSelectedJobItemNames] = useState([]);
  const [isOpenDocNumber, setIsOpenDocNumber] = useState(false);
  const [isOpenJobItemName, setIsOpenJobItemName] = useState(false);
  const [docNumbers, setDocNumbers] = useState([]);
  const [jobItemNames, setJobItemNames] = useState([]);
  const [workgroupNames, setWorkgroupNames] = useState([]);
  const [lineNames, setLineNames] = useState([]);
  const [activeButton, setActiveButton] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const handleToggleGraph = () => {
    // เมื่อกดปุ่มจะทำการสลับสถานะการแสดงกราฟ
    setShowGraph(!showGraph);
  };
  const [showTable, setShowTable] = useState(false);
  const handleToggleTable = () => {
    // เมื่อกดปุ่มจะทำการสลับสถานะการแสดงกราฟ
    setShowTable(!showTable);
  };
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
  const colorValues = [
    "pass",
    "good",
    "Not Change",
    "Fail",
    "change",
    "not change",
    "done",
    "check",
    "Unknown",
  ];
  const getPastelColorForValue = (value) => {
    const colors = new Map([
      ["pass", "rgba(198, 255, 198, 0.6)"],
      ["good", "rgba(204, 229, 255, 0.6)"],
      ["change", "rgba(255, 227, 153, 0.6)"],
      ["not change", "rgba(255, 239, 204, 0.6)"],
      ["fail", "rgba(255, 182, 193, 0.6)"],
      ["done", "rgba(221, 160, 221, 0.6)"],
      ["check", "rgba(255, 255, 204, 0.6)"],
    ]);
    return colors.get(value.toLowerCase()) || "rgba(0, 0, 0, 0)"; // ค่าโปร่งใสสำหรับกรณีอื่น ๆ
  };
  const groupedDataByLineNameAndWorkgroupAndJobItem = report
    .map((item) => {
      const updatedAt = new Date(item.jobItemsUpdatedAt); // เปลี่ยนจาก jobItemsCreatedAt เป็น jobItemsUpdatedAt
      if (isNaN(updatedAt.getTime())) {
        console.warn(
          `Invalid date for jobItemsUpdatedAt: ${item.jobItemsUpdatedAt}` // เปลี่ยนจาก jobItemsCreatedAt เป็น jobItemsUpdatedAt
        );
        return null;
      }
      const yValue = isNaN(parseFloat(item.ACTUAL_VALUE))
        ? 1
        : parseFloat(item.ACTUAL_VALUE);
      return {
        lineName: item.LINE_NAME || "Unknown", // กำหนดค่าเริ่มต้น "Unknown" หากเป็นค่าว่าง
        workgroupName: item.WORKGROUP_NAME || "Unknown", // กำหนดค่าเริ่มต้น "Unknown" หากเป็นค่าว่าง
        jobItemName: item.JOB_ITEM_NAME || "Unknown", // กำหนดค่าเริ่มต้น "Unknown" หากเป็นค่าว่าง
        x: updatedAt.toISOString(), // ใช้ updatedAt แทน createdAt
        y: yValue,
        actualValue: item.ACTUAL_VALUE || "Unknown", // กำหนดค่าเริ่มต้น "Unknown" หากเป็นค่าว่าง
        docNumber: item.DOC_NUMBER || "Unknown", // กำหนดค่าเริ่มต้น "Unknown" หากเป็นค่าว่าง
      };
    })
    .filter(Boolean) // ลบ null หรือ undefined ออก
    .filter((item) => {
      const date = new Date(item.x);
      return date >= startDate && date <= endDate;
    })
    .reduce((acc, curr) => {
      const groupKey = `${curr.lineName}-${curr.workgroupName}-${curr.jobItemName}`;
      const lineGroup = acc[groupKey] || [];
      const existing = lineGroup.find((item) => item.x === curr.x);
      if (existing) {
        existing.y += curr.y;
      } else {
        lineGroup.push({
          x: curr.x,
          y: curr.y,
          actualValue: curr.actualValue,
          docNumber: curr.docNumber,
          jobItemName: curr.jobItemName, // เก็บ jobItemName ในแต่ละรายการ
        });
      }
      acc[groupKey] = lineGroup;
      return acc;
    }, {});
  Object.entries(groupedDataByLineNameAndWorkgroupAndJobItem).forEach(
    ([_, data]) => {
      data.forEach((item, index) => {
        if (item.y === 0 && isNaN(parseFloat(item.actualValue))) {
          const previousValue = index > 0 ? data[index - 1].y : null;
          const nextValue = index < data.length - 1 ? data[index + 1].y : null;
          item.y = previousValue ?? nextValue ?? 0;
        }
      });
    }
  );
  const sortedDataByLineNameAndWorkgroupAndJobItem = Object.entries(
    groupedDataByLineNameAndWorkgroupAndJobItem
  ).reduce((acc, [groupKey, data]) => {
    acc[groupKey] = data.sort((a, b) => new Date(a.x) - new Date(b.x));
    return acc;
  }, {});
  const datasets = Object.keys(sortedDataByLineNameAndWorkgroupAndJobItem)
    .filter((groupKey) => {
      const [lineName, workgroupName, jobItemName] = groupKey.split("-");
      return (
        lineName !== "unknown" &&
        workgroupName !== "unknown" &&
        jobItemName !== "unknown" &&
        (selectedLineNames.length === 0 ||
          selectedLineNames.includes(lineName)) &&
        (selectedWorkgroups.length === 0 ||
          selectedWorkgroups.includes(workgroupName)) &&
        (selectedJobItemNames.length === 0 ||
          selectedJobItemNames.includes(jobItemName))
      );
    })
    .map((groupKey) => {
      const [lineName, workgroupName, jobItemName] = groupKey.split("-");
      const color = pastelColors[lineName];
      return {
        label: `${lineName} - ${workgroupName} - ${jobItemName}`,
        type: "line",
        borderColor: color,
        backgroundColor: color,
        data: sortedDataByLineNameAndWorkgroupAndJobItem[groupKey]
          .filter(
            (item) =>
              selectedDocNumbers.length === 0 ||
              selectedDocNumbers.includes(item.docNumber)
          )
          .map((item) => ({
            x: item.x,
            y: item.y,
            actualValue: item.actualValue,
            docNumber: item.docNumber,
            jobItemName: item.jobItemName,
          })),
        tension: 0.4,
        fill: true,
        datalabels: {
          display: true,
          anchor: "end",
          align: "top",
          font: { size: 12, weight: "bold" },
          color: "#000",
          backgroundColor: (context) => {
            const actualValue =
              context.dataset.data[context.dataIndex].actualValue;
            return getPastelColorForValue(actualValue);
          },
          formatter: (value) => value.actualValue || "N/A",
        },
      };
    });
  const data = { labels: [], datasets };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: false },
      datalabels: {
        display: true,
        color: (context) =>
          context.raw && context.raw.actualValue
            ? getPastelColorForValue(context.raw.actualValue)
            : "#000",
        anchor: "end",
        align: "top",
        font: { size: 12, weight: "normal" },
        formatter: (value) =>
          isNaN(value.y) ? value.actualValue : value.y.toLocaleString(),
      },
    },
    layout: { padding: { top: 30, right: 20 } },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
          displayFormats: { month: "MMM yyyy" },
        },
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { size: 12 },
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        type: "linear",
        grid: { display: true, color: "rgba(0, 0, 0, 0.1)" },
        border: { display: false },
        ticks: {
          font: { size: 12 },
          callback: (value) => value.toLocaleString(),
          beginAtZero: true,
          suggestedMin: 0,
        },
      },
    },
  };
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", options); // แสดงในรูปแบบ "DD/MM/YYYY HH:mm:ss"
  };
  useEffect(() => {
    const uniqueValues = (key) => [
      ...new Set(report.map((item) => item[key]).filter(Boolean)),
    ];
    setDocNumbers(uniqueValues("DOC_NUMBER"));
    setJobItemNames(uniqueValues("JOB_ITEM_NAME"));
    setWorkgroupNames(uniqueValues("WORKGROUP_NAME"));
    setLineNames(uniqueValues("LINE_NAME"));
  }, [report]);
  const handleSelectionChange = (name, selectedItems, setSelectedItems) => {
    setSelectedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };
  const handleWorkgroupChange = (workgroupName) => {
    handleSelectionChange(
      workgroupName,
      selectedWorkgroups,
      setSelectedWorkgroups
    );
    const filteredLineNames = report
      .filter((item) => selectedWorkgroups.includes(item.WORKGROUP_NAME))
      .map((item) => item.LINE_NAME);
    setSelectedLineNames(filteredLineNames);
    setSelectedDocNumbers([]);
    setSelectedJobItemNames([]);
  };
  const handleLineNameChange = (lineName) => {
    handleSelectionChange(lineName, selectedLineNames, setSelectedLineNames);
    setSelectedDocNumbers([]);
    setSelectedJobItemNames([]);
  };
  const handleDocNumberChange = (docNumber) => {
    handleSelectionChange(docNumber, selectedDocNumbers, setSelectedDocNumbers);
    setSelectedJobItemNames([]);
  };
  const handleJobItemNameChange = (jobItemName) => {
    handleSelectionChange(
      jobItemName,
      selectedJobItemNames,
      setSelectedJobItemNames
    );
  };
  // ฟิลเตอร์เฉพาะรายการที่ไม่เป็น 'Unknown' หรือค่าว่าง
  const filteredValues = (items) =>
    items.filter((item) => item && item.trim() !== "" && item !== "Unknown");
  const availableLineNames = filteredValues(
    lineNames.filter((lineName) =>
      selectedWorkgroups.some((workgroup) =>
        report.some(
          (item) =>
            item.LINE_NAME === lineName && item.WORKGROUP_NAME === workgroup
        )
      )
    )
  );
  const availableDocNumbers = filteredValues(
    docNumbers.filter((docNumber) =>
      report.some(
        (item) =>
          item.DOC_NUMBER === docNumber &&
          selectedLineNames.includes(item.LINE_NAME)
      )
    )
  );
  const availableJobItemNames = filteredValues(
    jobItemNames.filter((jobItemName) =>
      report.some(
        (item) =>
          item.JOB_ITEM_NAME === jobItemName &&
          selectedDocNumbers.includes(item.DOC_NUMBER)
      )
    )
  );
  const availableWorkgroups = filteredValues(workgroupNames);
  const exportToPDF = async () => {
    try {
      const element = chartRef.current;
      if (!element) throw new Error("Chart reference is null");
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // ดึงข้อมูลในรูปแบบเดียวกับ CSV
      const exportedData = datasets.flatMap((dataset) => {
        const [lineName, workgroupName] = dataset.label.split(" - ");
        return dataset.data.map((item) => ({
          LINE_NAME: lineName,
          WORKGROUP_NAME: workgroupName,
          Date: new Date(item.x).toISOString().split("T")[0], // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD
          ACTUAL_VALUE: item.actualValue,
          DOC_NUMBER: item.docNumber,
          JOB_ITEM_NAME: item.jobItemName,
        }));
      });
      let yPosition = 20;
      // วาดข้อมูลใน PDF
      exportedData.forEach((data) => {
        if (yPosition + 10 > pageHeight) pdf.addPage(), (yPosition = 20);
        const dataText = `
          LINE_NAME: ${data.LINE_NAME}, WORKGROUP_NAME: ${data.WORKGROUP_NAME},
          Date: ${data.Date}, ACTUAL_VALUE: ${data.ACTUAL_VALUE},
          DOC_NUMBER: ${data.DOC_NUMBER}, JOB_ITEM_NAME: ${data.JOB_ITEM_NAME}
        `.trim();
        const dataLines = pdf.splitTextToSize(dataText, 180);
        pdf.text(dataLines, 10, yPosition);
        yPosition += dataLines.length * 10;
      });
      if (yPosition + imgHeight + 10 > pageHeight)
        pdf.addPage(), (yPosition = 20);
      pdf.addImage(imgData, "PNG", 10, yPosition + 10, imgWidth, imgHeight);
      // กำหนดชื่อไฟล์
      const fileName =
        selectedLineNames.length === 0 && selectedWorkgroups.length === 0
          ? "All_LineNames_All_Workgroups.pdf"
          : `LineNames_${
              selectedLineNames.length > 0 ? selectedLineNames.join("_") : "All"
            }_Workgroups_${
              selectedWorkgroups.length > 0
                ? selectedWorkgroups.join("_")
                : "All"
            }.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Unable to export PDF file: " + error.message);
    }
  };
  const exportToCSV = () => {
    const exportedData = datasets.flatMap((dataset) => {
      // แยก LINE_NAME และ WORKGROUP_NAME ออกจาก label
      const [lineName, workgroupName] = dataset.label.split(" - ");
      return dataset.data.map((item) => ({
        LINE_NAME: lineName, // LINE_NAME
        WORKGROUP_NAME: workgroupName, // WORKGROUP_NAME
        Date: new Date(item.x), // แปลงเป็น Date object โดยตรง
        ACTUAL_VALUE: item.actualValue, // ใช้ค่า actualValue จาก item
        DOC_NUMBER: item.docNumber, // DOC_NUMBER
        JOB_ITEM_NAME: item.jobItemName, // JOB_ITEM_NAME
      }));
    });
    // สร้างแผ่นงาน Excel จากข้อมูลที่ดึงมา
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    // แปลงข้อมูลเป็นไฟล์ Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    // กำหนดชื่อไฟล์
    const fileName =
      selectedLineNames.length === 0 && selectedWorkgroups.length === 0
        ? "All_LineNames_All_Workgroups.xlsx"
        : `LineNames_${
            selectedLineNames.length > 0 ? selectedLineNames.join("_") : "All"
          }_Workgroups_${
            selectedWorkgroups.length > 0 ? selectedWorkgroups.join("_") : "All"
          }.xlsx`;
    // ดาวน์โหลดไฟล์
    FileSaver.saveAs(data, fileName);
  };
  const saveAsPNG = async () => {
    try {
      const chart = chartRef.current;
      if (!chart) throw new Error("Chart reference is null");
      const canvas = await html2canvas(chart);
      const imgData = canvas.toDataURL("image/png");
      const fileName = `LineNames:${
        selectedLineNames.join(",") || "All_Line_Names"
      }_Workgroups:${selectedWorkgroups.join(",") || "All_Workgroups"}.png`;
      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error saving as PNG:", error);
      alert("ไม่สามารถบันทึกไฟล์ PNG ได้: " + error.message);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workgroups
          </label>
          <button
            onClick={() => !isLoading && setIsOpen((prevOpen) => !prevOpen)}
            className={`w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Loading...
              </div>
            ) : selectedWorkgroups.length > 0 ? (
              `Selected ${selectedWorkgroups.length} Workgroups`
            ) : (
              "Select Workgroups"
            )}
          </button>
          {isOpen && !isLoading && (
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
        {/* // UI ของ LineNames */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LineNames
          </label>
          <button
            onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
            className={`w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading}
          >
            {selectedLineNames.length > 0
              ? `Selected ${selectedLineNames.length} LineNames`
              : "Select LineNames"}
          </button>
          {isOpen1 && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={() => setSelectedLineNames([])}
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
        {/* DOC Numbers Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DOC Numbers
          </label>
          <button
            onClick={() => setIsOpenDocNumber((prevOpen) => !prevOpen)}
            className={`w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading}
          >
            {selectedDocNumbers.length > 0
              ? `Selected ${selectedDocNumbers.length} DOC Numbers`
              : "Select DOC Numbers"}
          </button>
          {isOpenDocNumber && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={() => setSelectedDocNumbers([])}
                  checked={selectedDocNumbers.length === 0}
                />
                All DOC Numbers
              </label>
              {availableDocNumbers.map((docNumber) => (
                <label key={docNumber} className="block p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={docNumber}
                    checked={selectedDocNumbers.includes(docNumber)}
                    onChange={() => handleDocNumberChange(docNumber)}
                  />
                  {docNumber}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            JOB Item Names
          </label>
          <button
            onClick={() => setIsOpenJobItemName((prevOpen) => !prevOpen)}
            className={`w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading}
          >
            {selectedJobItemNames.length > 0
              ? `${selectedJobItemNames[0]}`
              : "Select Job Item Name"}
          </button>
          {isOpenJobItemName && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer">
                <input
                  type="radio"
                  name="jobItemName"
                  value=""
                  checked={selectedJobItemNames.length === 0}
                  onChange={() => setSelectedJobItemNames([])}
                />
                All Job Item Names
              </label>
              {availableJobItemNames.map((jobItemName) => (
                <label key={jobItemName} className="block p-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jobItemName"
                    value={jobItemName}
                    checked={selectedJobItemNames[0] === jobItemName}
                    onChange={() => setSelectedJobItemNames([jobItemName])}
                  />
                  {jobItemName}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            type="date"
            id="start-date"
            value={
              startDate && isValid(startDate)
                ? format(startDate, "yyyy-MM-dd")
                : ""
            }
            onChange={(e) => setStartDate(new Date(e.target.value))}
            disabled={isLoading}
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
            className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            type="date"
            id="end-date"
            value={
              endDate && isValid(endDate) ? format(endDate, "yyyy-MM-dd") : ""
            }
            onChange={(e) => setEndDate(new Date(e.target.value))}
            disabled={isLoading}
          />
        </div>
        <div className="relative ">
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Chart
          </label>
          <button
            onClick={handleToggleGraph}
            className="border border-gray-300 rounded-md py-2 px-4 w-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            <span className="mr-2">
              {showGraph ? <VisibilityOff /> : <ShowChart />}
            </span>
            {showGraph ? "Hide Chart" : "Show Chart"}
          </button>
        </div>
        <div className="relative ">
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Table
          </label>
          <button
            onClick={handleToggleTable}
            className="border border-gray-300 rounded-md py-2 px-4 w-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            <span className="mr-2">
              {showTable ? <VisibilityOff /> : <CalendarViewMonth />}
            </span>
            {showTable ? "Hide Table" : "Show Table"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {colorValues.map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getPastelColorForValue(value) }}
              ></span>
              <span className="text-sm text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      </div>
      {showGraph && (
        <div style={{ height: "450px", width: "100%" }} ref={chartRef}>
          <Line data={data} options={options} />
        </div>
      )}
      {showTable && (
        <div className="overflow-x-auto w-full mt-5">
          <TableReport datasets={datasets} />
        </div>
      )}
      <ExportButtons handleExport={handleExport} />
    </div>
  );
};
export default BarChart5;
