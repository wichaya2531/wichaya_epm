"use client";
import React, { useState, useEffect } from "react";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO, isValid, startOfToday } from "date-fns";
import "chartjs-adapter-date-fns";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TableReportDoc from "@/components/TableReportDoc";

const ReportDoc = ({ report, isLoading }) => {
  const [refresh, setRefresh] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  // const { lineNames, workgroupNames } =
  //   useFetchReportWorkgroupLinename(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const [selectedLineNames, setSelectedLineNames] = useState([]);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const [selectedDocNumbers, setSelectedDocNumbers] = useState("");
  const [selectedJobItemNames, setSelectedJobItemNames] = useState([]);
  const [docNumbers, setDocNumbers] = useState([]);
  const [jobItemNames, setJobItemNames] = useState([]);
  const [workgroupNames, setWorkgroupNames] = useState([]);
  const [lineNames, setLineNames] = useState([]);
  const [reportType, setReportType] = useState("month");
  const [currentPage, setCurrentPage] = useState(1);
  const getLastDayOfMonth = (date) => {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay;
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
    "Pass",
    "OK",
    "Good",
    "Not Change",
    "Fail",
    "Change",
    "Not Change",
    "Done",
    "Check",
    "Unknown",
  ];
  const getPastelColorForValue = (value) => {
    const colors = new Map([
      ["pass", "rgba(198, 255, 198, 0.6)"],
      ["ok", "rgba(198, 255, 198, 0.6)"],
      ["good", "rgba(204, 229, 255, 0.6)"],
      ["change", "rgba(255, 227, 153, 0.6)"],
      ["not change", "rgba(255, 239, 204, 0.6)"],
      ["fail", "rgba(255, 182, 193, 0.6)"],
      ["done", "rgba(221, 160, 221, 0.6)"],
      ["check", "rgba(255, 255, 204, 0.6)"],
    ]);
    return colors.get(value.toLowerCase()) || "rgba(0, 0, 0, 0)";
  };
  const groupedDataByLineNameAndWorkgroupAndJobItem = report
    .map((item) => {
      const updatedAt = new Date(item.jobItemsUpdatedAt);
      if (isNaN(updatedAt.getTime())) {
        console.warn(
          `Invalid date for jobItemsUpdatedAt: ${item.jobItemsUpdatedAt}`
        );
        return null;
      }
      return {
        lineName: item.LINE_NAME || "Unknown",
        workgroupName: item.WORKGROUP_NAME || "Unknown",
        jobItemName: item.JOB_ITEM_NAME || "Unknown",
        jobItemTitle: item.JOB_ITEM_TITLE || "Unknown",
        x: updatedAt.toISOString(),
        actualValue: item.ACTUAL_VALUE || "Unknown",
        docNumber: item.DOC_NUMBER || "Unknown",
      };
    })
    .filter(Boolean)
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
          jobItemName: curr.jobItemName,
          jobItemTitle: curr.jobItemTitle,
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

  // ในการกรองข้อมูลใน groupedDataByLineNameAndWorkgroupAndJobItem
  const filteredData = Object.keys(sortedDataByLineNameAndWorkgroupAndJobItem)
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
      return {
        label: `${lineName} - ${workgroupName} - ${jobItemName}`,
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
            jobItemTitle: item.jobItemTitle,
          })),
      };
    });

  // เปลี่ยนชื่อ filteredData ให้เป็นชื่ออื่น เช่น filteredReportData
  const filteredReportData = report.filter((item) => {
    const updatedAt = new Date(item.jobItemsUpdatedAt);
    return updatedAt >= startDate && updatedAt <= endDate;
  });

  useEffect(() => {
    const uniqueValues = (key) => [
      ...new Set(report.map((item) => item[key]).filter(Boolean)),
    ];
    setDocNumbers(uniqueValues("DOC_NUMBER"));
    setJobItemNames(uniqueValues("JOB_ITEM_NAME"));
    setWorkgroupNames(uniqueValues("WORKGROUP_NAME"));
    setLineNames(uniqueValues("LINE_NAME"));
  }, [report]);
  const handleWorkgroupChange = (workgroupName) => {
    // อัปเดต selectedWorkgroups
    setSelectedWorkgroups((prev) => {
      const updatedWorkgroups = prev.includes(workgroupName)
        ? prev.filter((item) => item !== workgroupName)
        : [...prev, workgroupName];
      setSelectedLineNames([]);
      setSelectedDocNumbers([]);
      setSelectedJobItemNames([]);

      return updatedWorkgroups;
    });
  };
  const handleLineNameChange = (lineName) => {
    setSelectedLineNames((prev) =>
      prev.includes(lineName)
        ? prev.filter((item) => item !== lineName)
        : [...prev, lineName]
    );
    setSelectedDocNumbers([]);
    setSelectedJobItemNames([]);
  };
  const handleDocNumberChange = (docNumber) => {
    setSelectedDocNumbers(docNumber);
    setSelectedJobItemNames([]);
  };
  const filteredValues = (items) =>
    items
      .filter((item) => item && item.trim() !== "" && item !== "Unknown") // กรองค่า
      .sort((a, b) => a.localeCompare(b));
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
  const availableWorkgroups = filteredValues(workgroupNames);
  const exportToPDF = async () => {
    try {
      const table = document.querySelector(".min-w-full"); // เลือกตารางจาก class ที่ใช้
      if (!table) throw new Error("Table not found");

      const canvas = await html2canvas(table); // ใช้ html2canvas กับตารางแทน chart
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // ใช้วันที่ที่เลือกจากฟอร์ม
      const formattedStartDate = startDate
        ? format(startDate, "dd-MM-yyyy")
        : "";
      const formattedEndDate = endDate ? format(endDate, "dd-MM-yyyy") : "";

      // ถ้าไม่มีวันที่เริ่มต้นหรือสิ้นสุดจากฟอร์ม ใช้วันที่จากข้อมูลในตาราง
      let startDateFormatted = formattedStartDate;
      let endDateFormatted = formattedEndDate;

      if (!startDateFormatted || !endDateFormatted) {
        const tableData = Object.values(datasets).flatMap((dataset) =>
          dataset.data.map((item) => ({
            date: new Date(item.x),
          }))
        );

        const sortedDates = tableData
          .map((item) => item.date)
          .sort((a, b) => a - b);
        startDateFormatted = sortedDates[0]?.toISOString().split("T")[0];
        endDateFormatted = sortedDates[sortedDates.length - 1]
          ?.toISOString()
          .split("T")[0];
      }

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
      const lineHeight = 5; // ระยะห่างระหว่างบรรทัด
      const columnSpacing = 10; // ระยะห่างระหว่างคอลัมน์
      const fontSize = 10; // ขนาดฟอนต์

      // วาดข้อมูลใน PDF
      exportedData.forEach((data) => {
        if (yPosition + lineHeight > pageHeight) {
          pdf.addPage();
          yPosition = 20;
        }

        // สร้างข้อความในรูปแบบที่จัดระเบียบ
        const dataText = `
          LINE_NAME: ${data.LINE_NAME}
          WORKGROUP_NAME: ${data.WORKGROUP_NAME}
          Date: ${data.Date}
          ACTUAL_VALUE: ${data.ACTUAL_VALUE}
          DOC_NUMBER: ${data.DOC_NUMBER}
          JOB_ITEM_NAME: ${data.JOB_ITEM_NAME}
        `.trim();

        // ใช้ splitTextToSize เพื่อแบ่งข้อความให้พอดีกับความกว้าง
        const dataLines = pdf.splitTextToSize(dataText, 180);

        // วาดข้อความใน PDF
        pdf.setFontSize(fontSize);
        pdf.text(dataLines, 10, yPosition);

        // เพิ่มระยะห่างระหว่างบรรทัด
        yPosition += dataLines.length * lineHeight;
      });

      if (yPosition + imgHeight + 10 > pageHeight)
        pdf.addPage(), (yPosition = 20);
      pdf.addImage(imgData, "PNG", 10, yPosition + 10, imgWidth, imgHeight);

      // สร้างชื่อไฟล์ที่มีวันที่เริ่มต้นถึงวันที่สิ้นสุด
      const fileName = `TableReportDoc_${startDateFormatted}_to_${endDateFormatted}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Unable to export PDF file: " + error.message);
    }
  };
  const exportToCSV = () => {
    // สร้างชื่อเดือนที่ใช้ในการ export
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // ใช้วันที่ที่เลือกจากฟอร์ม
    const formattedStartDate = startDate ? format(startDate, "dd-MM-yyyy") : "";
    const formattedEndDate = endDate ? format(endDate, "dd-MM-yyyy") : "";

    // ถ้าไม่มีวันที่เริ่มต้นหรือสิ้นสุดจากฟอร์ม ใช้วันที่จากข้อมูลในตาราง
    let startDateFormatted = formattedStartDate;
    let endDateFormatted = formattedEndDate;

    if (!startDateFormatted || !endDateFormatted) {
      const tableData = Object.values(datasets).flatMap((dataset) =>
        dataset.data.map((item) => ({
          docNumber: item.docNumber,
          jobItemName: item.jobItemName,
          month: new Date(item.x).getMonth(),
          actualValue: item.actualValue,
        }))
      );

      const sortedDates = tableData
        .map((item) => new Date(item.x))
        .sort((a, b) => a - b);
      startDateFormatted = sortedDates[0]?.toISOString().split("T")[0];
      endDateFormatted = sortedDates[sortedDates.length - 1]
        ?.toISOString()
        .split("T")[0];
    }

    // แปลงข้อมูล datasets ให้เป็นรูปแบบตามที่ต้องการ
    const formattedData = Object.values(datasets)
      .flatMap((dataset) =>
        dataset.data.map((item) => ({
          docNumber: item.docNumber,
          jobItemName: item.jobItemName,
          month: new Date(item.x).getMonth(),
          actualValue: item.actualValue,
        }))
      )
      .reduce((acc, item) => {
        const key = `${item.docNumber}-${item.jobItemName}`;
        if (!acc[key]) {
          acc[key] = {
            docNumber: item.docNumber,
            jobItemName: item.jobItemName,
            months: Array(12).fill("-"),
          };
        }
        acc[key].months[item.month] = item.actualValue || "-";
        return acc;
      }, {});

    // แปลงข้อมูลที่จัดกลุ่มแล้วให้เป็น array พร้อมคอลัมน์เดือน
    const exportData = Object.values(formattedData).map((item) => ({
      DOC_NUMBER: item.docNumber,
      JOB_ITEM_NAME: item.jobItemName,
      ...months.reduce((acc, month, index) => {
        acc[month] = item.months[index];
        return acc;
      }, {}),
    }));

    // สร้างแผ่นงาน Excel จากข้อมูลที่ดึงมา
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };

    // แปลงข้อมูลเป็นไฟล์ Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    // สร้างชื่อไฟล์ที่มีวันที่เริ่มต้นถึงวันที่สิ้นสุด
    const fileName = `TableReportDoc_${startDateFormatted}_to_${endDateFormatted}.xlsx`;

    // ดาวน์โหลดไฟล์
    FileSaver.saveAs(data, fileName);
  };
  const saveAsPNG = async () => {
    try {
      const table = document.querySelector(".min-w-full");
      if (!table) throw new Error("Table not found");

      // ใช้วันที่ที่เลือกจากฟอร์ม
      const startDateFormatted = startDate
        ? format(startDate, "dd-MM-yyyy")
        : "";
      const endDateFormatted = endDate ? format(endDate, "dd-MM-yyyy") : "";

      // ถ้าไม่มีวันที่จากฟอร์ม ใช้วันที่จากข้อมูลในตาราง
      const tableData = Object.values(datasets).flatMap((dataset) =>
        dataset.data.map((item) => new Date(item.x))
      );
      const sortedDates = tableData.sort((a, b) => a - b);
      const startDateFinal =
        startDateFormatted || format(sortedDates[0], "dd-MM-yyyy");
      const endDateFinal =
        endDateFormatted ||
        format(sortedDates[sortedDates.length - 1], "dd-MM-yyyy");

      // สร้างชื่อไฟล์ที่มีวันที่เริ่มต้นถึงวันที่สิ้นสุด
      const fileName = `TableReportDoc_${startDateFinal}_to_${endDateFinal}.png`;

      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error saving table as PNG:", error);
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
                  onChange={() => {
                    setSelectedWorkgroups([]);
                    setSelectedLineNames([]); // รีเซ็ต LineNames เมื่อเลือก "All Workgroups"
                  }}
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
        {/* LineNames UI */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LineNames
          </label>
          <button
            onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
            className={`w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading || selectedWorkgroups.length === 0} // ปิดการใช้งานถ้าไม่มี Workgroups ถูกเลือก
          >
            {selectedLineNames.length > 0
              ? `Selected ${selectedLineNames.length} LineNames`
              : selectedWorkgroups.length > 0
              ? "Select LineNames"
              : "Please select Workgroups first"}
          </button>
          {isOpen1 && selectedWorkgroups.length > 0 && (
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
        <div className="relative mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            className="border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400"
            value={reportType}
            onChange={(e) => {
              const selectedReportType = e.target.value;
              setReportType(selectedReportType);

              // เปลี่ยนรูปแบบ startDate และ endDate ตามประเภทที่เลือก
              if (
                selectedReportType === "month" ||
                selectedReportType === "week"
              ) {
                const currentMonthStart = new Date();
                setStartDate(
                  new Date(
                    currentMonthStart.getFullYear(),
                    currentMonthStart.getMonth(),
                    1
                  )
                );
                setEndDate(getLastDayOfMonth(currentMonthStart)); // สิ้นสุดที่วันสุดท้ายของเดือน
              } else if (
                selectedReportType === "date" ||
                selectedReportType === "shift"
              ) {
                const currentDate = new Date();
                setStartDate(currentDate);
                setEndDate(currentDate); // ใช้วันที่เดียวกัน
              }
            }}
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="date">Date</option>
            <option value="shift">Shift</option>
          </select>
        </div>

        <div className="relative">
          <label
            htmlFor="start-month"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            type={
              reportType === "date" || reportType === "shift" ? "date" : "month"
            }
            id="start-month"
            value={
              startDate && !isNaN(startDate.getTime())
                ? format(
                    startDate,
                    reportType === "month" || reportType === "week"
                      ? "yyyy-MM"
                      : "yyyy-MM-dd"
                  )
                : ""
            }
            onChange={(e) => {
              const selectedStartDate = new Date(e.target.value);
              setStartDate(selectedStartDate);

              if (reportType === "date" || reportType === "shift") {
                setEndDate(selectedStartDate);
              } else {
                setEndDate(getLastDayOfMonth(selectedStartDate));
              }
            }}
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <label
            htmlFor="end-month"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <input
            className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            type={
              reportType === "date" || reportType === "shift" ? "date" : "month"
            }
            id="end-month"
            value={
              endDate && !isNaN(endDate.getTime())
                ? format(
                    endDate,
                    reportType === "month" || reportType === "week"
                      ? "yyyy-MM"
                      : "yyyy-MM-dd"
                  )
                : ""
            }
            onChange={(e) => {
              const selectedEndDate = new Date(e.target.value);
              setEndDate(selectedEndDate);

              if (reportType === "date" || reportType === "shift") {
                setEndDate(selectedEndDate);
              } else {
                setEndDate(getLastDayOfMonth(selectedEndDate));
              }
            }}
            disabled={isLoading}
          />
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
      {/* DOC Numbers */}
      <div className="flex flex-col md:flex-row gap-5 mt-5">
        {/* Section ตัวเลือก DOC Numbers */}
        <div className="relative w-full md:w-1/4 lg:w-1/6">
          <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
            <label className="block p-2 cursor-pointer">DOC Numbers</label>
            {availableDocNumbers.map((docNumber) => (
              <label key={docNumber} className="block p-2 cursor-pointer">
                <input
                  type="radio"
                  name="docNumber"
                  value={docNumber}
                  checked={selectedDocNumbers === docNumber}
                  onChange={() => handleDocNumberChange(docNumber)}
                />
                {docNumber}
              </label>
            ))}
          </div>
        </div>
        {/* Section ตาราง */}
        <div className="overflow-x-auto w-full md:w-3/4 lg:w-full">
          <TableReportDoc
            filteredData={filteredData}
            startDate={startDate}
            endDate={endDate}
            reportType={reportType}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <ExportButtons handleExport={handleExport} />
    </div>
  );
};
export default ReportDoc;
