"use client";
import React, { useState, useEffect } from "react";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO, isValid, startOfToday } from "date-fns";
import "chartjs-adapter-date-fns";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import TableReportDoc from "@/components/TableReportDoc";
import { set } from "react-hook-form";

const ReportDoc = ({  
  report,
  isLoading,
  onDateStartFilterChange,
  onDateEndFilterChange,
  onPullData,
  onWorkgroupSelect,
  workgroupOfUser,
  dateTimeStart,
  dateTimeEnd,
}) => {
    
  // console.log('report Data',report);

  
  //console.log('workgroupOfUser',workgroupOfUser);
 
  // setSelectedWorkgroups([workgroupOfUser]);

 // console.log('report in reportDoc',report); 
  const [workgroups, setWorkgroups] = useState([]);
  const [refresh, setRefresh] = useState(false);

    const onStart = new Date();
    onStart.setDate(onStart.getDate() - 1); // ย้อน 1 วัน
    onStart.setHours(0, 0, 0, 0); // ตั้งเวลาเป็น 00:00:00.000

    const onEnd = new Date();
   // onEnd.setDate(onEnd.getDate() + 1); // ล่วงหน้า 1 วัน
    onEnd.setHours(23, 59, 59, 999); // ตั้งเวลาเป็น 23:59:59.999

  const [startDate, setStartDate] = useState(new Date(dateTimeStart));
  const [endDate, setEndDate] = useState(new Date(dateTimeEnd));
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

  //function checkStartAndEnd() {
     //     console.log('startDate',startDate);
     //     console.log('endDate',endDate);
  //}

 //setSelectedWorkgroups([workgroupOfUser]);
 // console.log('report',report);

 //console.log('startDate',startDate);
 //console.log('endDate',endDate);
 // console.log('report',report); 


  let debug=false;
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
        upper_lower:item.UPPER+" / "+item.LOWER || "Unknown",
        x: updatedAt.toISOString(),
        actualValue: item.ACTUAL_VALUE || "Unknown",
        docNumber: item.DOC_NUMBER || "Unknown",
        Job_status:item.JOB_STATUS || "Unknown",
        Img_file:item.FILE||"Unknown",
      };
    })
    .filter(Boolean)
    .filter((item) => {
      const date = new Date(item.x);
      return date >= startDate && date <= endDate;
    })
    .reduce((acc, curr) => {
      //console.log('curr',curr);
      const groupKey = `${curr.lineName}|${curr.workgroupName}|${curr.jobItemName}`;
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
          upper_lower:curr.upper_lower,
          lineName: curr.lineName,
          Job_status:curr.Job_status,
          Img_file:curr.Img_file,
        });
      }
      acc[groupKey] = lineGroup;
      return acc;
    }, {});


  //console.log('groupedDataByLineNameAndWorkgroupAndJobItem',groupedDataByLineNameAndWorkgroupAndJobItem);

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
  //console.log('sortedDataByLineNameAndWorkgroupAndJobItem',sortedDataByLineNameAndWorkgroupAndJobItem);
  const filteredData = Object.keys(sortedDataByLineNameAndWorkgroupAndJobItem)
    .filter((groupKey) => {
      //console.log('groupKey1',groupKey);
      const [lineName, workgroupName, jobItemName] = groupKey.split("|");
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
    }).map((groupKey) => {
      //console.log('sortedDataByLineNameAndWorkgroupAndJobItem[groupKey]',sortedDataByLineNameAndWorkgroupAndJobItem[groupKey]);
      const [lineName, workgroupName, jobItemName] = groupKey.split("-");
      //console.log('groupKey2',groupKey);
    //  console.log('item',item);
     // console.log('sortedDataByLineNameAndWorkgroupAndJobItem[groupKey]',sortedDataByLineNameAndWorkgroupAndJobItem[groupKey]);
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
            upper_lower:item.upper_lower,
            lineName: item.lineName,
            Job_status:item.Job_status,
            Img_file:item.Img_file,
          })),
      };
    });
  
  
   // console.log('after filteredData ',filteredData);
  //  เปลี่ยนชื่อ filteredData ให้เป็นชื่ออื่น เช่น filteredReportData
  const filteredReportData = report.filter((item) => {
    const updatedAt = new Date(item.jobItemsUpdatedAt);
    return updatedAt >= startDate && updatedAt <= endDate;
  });

  const fetchWorkgroups = async () => {
    try {
      const response = await fetch(`/api/workgroup/get-workgroups`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();

      //console.log('data workgroup',data);

      setWorkgroups(data.workgroups);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkgroups();
  }, "");

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
    //console.log('lineName',lineName);  
    setSelectedLineNames([lineName]);
    // setSelectedLineNames((prev) =>
    //   prev.includes(lineName)
    //     ? prev.filter((item) => item !== lineName)
    //     : [...prev, lineName]
    // );
    //console.log('selectedLineNames',selectedLineNames);
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

  
  // console.log('report',report);
  // var LineNamess=new Array();
  // report.forEach(element => {
  //       element.LINE_NAME;
  // });

    const availableLineNames = [...new Set(report.map(element => element.LINE_NAME))];

   


  //const availableLineNames =['A','B','C'];
  //  = filteredValues(
  //   lineNames.filter((lineName) =>
  //     selectedWorkgroups.some((workgroup) =>
  //       report.some(
  //         (item) =>
  //           item.LINE_NAME === lineName && item.WORKGROUP_NAME === workgroup
  //       )
  //     )
  //   )
  // );

  
  
  
  //console.log('availableLineNames',availableLineNames);
  


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

    // ฟังก์ชันในการแบ่งข้อความเป็นหลายบรรทัด
    const splitTextToLines = (text, maxWidth, pdf, fontSize) => {
      const words = text.split(" ");
      let lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? currentLine + " " + word : word;
        const width = pdf.getTextWidth(testLine);

        if (width < maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      const tableHeaders = [
        "DocNumber",
        "JobItemTitle",
        "JobItemName",
        "Upper/Lower",
        "Month",
        "Date",
        "Time",
        "Shift",
        "ActualValue",
      ];

      const tableRows = filteredData.flatMap((dataset) =>
        dataset.data.map((item) => {
          const dateObj = new Date(item.x);
          const date = dateObj.toLocaleDateString("en-GB").replace(/\//g, "-"); // dd-MM-yyyy
          const time = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }); // HH:mm
          const shift = dateObj.getHours() < 12 ? "AM" : "PM";
          const month = months[dateObj.getMonth()]; // ใช้ months array เพื่อแปลงหมายเลขเดือนเป็นชื่อเดือน

          return [
            item.docNumber || "Unknown",
            item.jobItemTitle || "Unknown",
            item.jobItemName || "Unknown",
            item.UPPER+"/"+item.LOWER || "xxxxxx",
            month, // ชื่อเดือนที่ถูกต้อง
            date,
            time,
            shift,
            item.actualValue ?? "-",
          ];
        })
      );

      //console.log('tableRows',tableRows);  


      if (tableRows.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก");
        return;
      }

      // กำหนดค่าพื้นฐาน
      const startX = 10;
      let startY = 20;
      const lineHeight = 10;
      const fontSize = 10;
      const maxWidth = pageWidth - 20; // ความกว้างสูงสุดของข้อความ

      // วาดข้อมูลทีละบรรทัด
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");

      // แสดงหัวตาราง
      tableHeaders.forEach((header, index) => {
        const lineText = `${header}: ${tableRows[index]?.[index] || "N/A"}`;
        pdf.text(lineText, startX, startY);
        startY += lineHeight;

        // ถ้ามีข้อมูลเกินขนาดหน้า PDF ให้เพิ่มหน้าใหม่
        if (startY > pageHeight - lineHeight) {
          pdf.addPage();
          startY = 20; // รีเซ็ตตำแหน่ง Y
        }
      });

      // แสดงข้อมูลบรรทัดต่อไป
      tableRows.forEach((row) => {
        row.forEach((value, i) => {
          let lines = [];

          if (i === 1 || i === 2) {
            // ถ้าเป็น JobItemTitle หรือ JobItemName ให้แสดงหัวข้อด้วย
            const header = tableHeaders[i];
            const lineText = `${header}: ${value || "N/A"}`;
            lines = splitTextToLines(lineText, maxWidth, pdf, fontSize);
          } else {
            // ข้อมูลที่ไม่ใช่ JobItemTitle หรือ JobItemName
            const lineText = `${tableHeaders[i]}: ${value || "N/A"}`;
            lines = splitTextToLines(lineText, maxWidth, pdf, fontSize);
          }

          // พิมพ์แต่ละบรรทัด
          lines.forEach((line, index) => {
            pdf.text(line, startX, startY);
            startY += lineHeight; // เพิ่มบรรทัดใหม่

            // ถ้ามีข้อมูลเกินขนาดหน้า PDF ให้เพิ่มหน้าใหม่
            if (startY > pageHeight - lineHeight) {
              pdf.addPage();
              startY = 20; // รีเซ็ตตำแหน่ง Y
            }
          });
        });
      });

      // บันทึก PDF
      pdf.save("ExportedReport.pdf");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("ไม่สามารถส่งออกไฟล์ PDF ได้: " + error.message);
    }
  };

  const exportToCSV = () => {
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

    const tableData = filteredData.flatMap((dataset) =>
      dataset.data.map((item) => {
        const itemDate = new Date(item.x); // แปลงเป็น Date โดยใช้ UTC time (จาก item.x)

        // แปลงเวลาเป็น Local Time
        const localDate = new Date(
          itemDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
        );

        // ฟอร์แมตวันที่และเวลาในรูปแบบ Local Time
        const formattedDate = localDate
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-"); // 07-01-2025
        const formattedTime = localDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // ใช้เวลาแบบ 24 ชั่วโมง
        }); // เช่น 08:30

        // สร้าง Shift ตามช่วงเวลา
        const hour = localDate.getHours(); // ใช้ Local Time เพื่อคำนวณ
        const shift = hour < 12 ? "AM" : "PM"; // ใช้เวลา Local ในการคำนวณ Shift

        return {
          DocNumber: item.docNumber || "Unknown",
          JobItemTitle: item.jobItemTitle || "Unknown",
          JobItemName: item.jobItemName || "Unknown",
          upper_lower:item.upper_lower || "Unknown",
          Month: months[localDate.getMonth()],
          Date: formattedDate,
          Time: formattedTime,
          Shift: shift,
          ActualValue: item.actualValue ?? "-",    
          Job_status:item.Job_status,     
          Img_file:item.Img_file,            

        };
      })
    );

    if (tableData.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const sortedDates = tableData
      .map((item) => new Date(item.Date.split("-").reverse().join("-")))
      .sort((a, b) => a - b);

    const startDateFormatted = sortedDates[0]?.toISOString().split("T")[0];
    const endDateFormatted = sortedDates[sortedDates.length - 1]
      ?.toISOString()
      .split("T")[0];

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const fileName = `FilteredData_${startDateFormatted}_to_${endDateFormatted}.xlsx`;
    FileSaver.saveAs(data, fileName);
  };

  const saveAsPNG = async () => {
    try {
      const table = document.querySelector(".min-w-full"); // เลือกตารางจาก class
      if (!table) throw new Error("Table not found");

      // ใช้วันที่ที่เลือกจากฟอร์ม
      const startDateFormatted = startDate
        ? format(startDate, "dd-MM-yyyy")
        : "";
      const endDateFormatted = endDate ? format(endDate, "dd-MM-yyyy") : "";

      // ถ้าไม่มีวันที่จากฟอร์ม ใช้วันที่จากข้อมูลในตาราง
      const tableData = filteredData.flatMap((dataset) =>
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

      // ดึงข้อมูลในรูปแบบที่ต้องการเหมือนกับใน exportToCSV
      const exportedData = filteredData.flatMap((dataset) =>
        dataset.data.map((item) => {
          const dateObj = new Date(item.x);
          const date = dateObj.toLocaleDateString("en-GB").replace(/\//g, "-"); // dd-MM-yyyy
          const time = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }); // HH:mm
          const shift = dateObj.getHours() < 12 ? "AM" : "PM";
          const month = dateObj.toLocaleString("default", { month: "long" });

          return {
            DocNumber: item.docNumber || "Unknown",
            JobItemTitle: item.jobItemTitle || "Unknown",
            JobItemName: item.jobItemName || "Unknown",
            upper_lower:"E",
            Month: month,
            Date: date,
            Time: time,
            Shift: shift,
            ActualValue: item.actualValue ?? "-",
            Job_status:'B',
            Img_file:item.Img_file,
          };
        })
      );

      if (exportedData.length === 0) {
        alert("ไม่มีข้อมูลสำหรับบันทึก PNG");
        return;
      }

      // สร้างตารางข้อมูลที่ต้องการแสดง
      const tableHeaders = [
        "DocNumber",
        "JobItemTitle",
        "JobItemName",
        "Upper/Lower",
        "Month",
        "Date",
        "Time",
        "Shift",
        "ActualValue",
      ];

      const tableRows = exportedData.map((data) => [
        data.DocNumber,
        data.JobItemTitle,
        data.JobItemName,
        data.upper_lower,
        data.Month,
        data.Date,
        data.Time,
        data.Shift,
        data.ActualValue,
      ]);

      // สร้าง canvas และแคปภาพจากตาราง
      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");

      // สร้างลิงก์สำหรับดาวน์โหลดไฟล์ PNG
      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;

      // เพิ่มลิงก์ลงในเอกสารแล้วคลิกเพื่อดาวน์โหลด
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


  function pressCheck(b) {
            alert(b);
  }

  //handleWorkgroupChange(workgroupOfUser.workgroup);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const maxDateStr = tomorrow.toISOString().split("T")[0];

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
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
            type={"date"}
            /*type={
              reportType === "date" || reportType === "shift" ? "date" : "month"
            }*/
            id="start-month"
            value={format(startDate, "yyyy-MM-dd")}
             max={format(maxDateStr, "yyyy-MM-dd")}  // ✅ จำกัดไม่ให้เลือกวันที่ในอนาคต
           
            onChange={(e) => {
              onDateStartFilterChange(e.target.value);
              const selectedStartDate = new Date(e.target.value);
              setStartDate(selectedStartDate);
              // checkStartAndEnd(); 
              if (reportType === "date" || reportType === "shift") {
                //setEndDate(selectedStartDate);
              } else {
                //setEndDate(getLastDayOfMonth(selectedStartDate));
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
            type={"date"}
            // type={
            //   reportType === "date" || reportType === "shift" ? "date" : "month"
            // }
            id="end-month"
            value={format(endDate, "yyyy-MM-dd")}
            max={format(maxDateStr, "yyyy-MM-dd")}  // ✅ จำกัดไม่ให้เลือกวันที่ในอนาคต
            
            onChange={(e) => {
              onDateEndFilterChange(e.target.value);
              const selectedEndDate = new Date(e.target.value);
              setEndDate(selectedEndDate);
              //checkStartAndEnd();
              if (reportType === "date" || reportType === "shift") {
               // setEndDate(selectedEndDate);
              } else {
                //setEndDate(getLastDayOfMonth(selectedEndDate));
              }
            }}
            disabled={isLoading}
          />
        </div>

        <div className="relative" style={{ width: "300px" }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workgroup
          </label>

          <select
            className={`w-full border border-gray-300 rounded-md py-2 px-3 bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            onChange={(e) => {
              const selectedValue = e.target.value;
              // if (selectedValue === "All Workgroups") {
              //   setSelectedWorkgroups([]);
              //   setSelectedLineNames([]);
              // } else {

              // }
              handleWorkgroupChange(selectedValue);
              onWorkgroupSelect(e.target.value);
            }}
            
            //value={workgroupOfUser.workgroup}
            //value={selectedWorkgroups.length === 0 ? "All Workgroups" : selectedWorkgroups[0]}
            //value={selectedWorkgroups==""?workgroupOfUser.workgroup:selectedWorkgroups}
          >
             <option value={workgroupOfUser.workgroup}>{workgroupOfUser.workgroup}</option>
              {workgroups
                .filter((workgroupName) => workgroupName.WORKGROUP_NAME !== workgroupOfUser.workgroup)
                .map((workgroupName) => (
                  <option
                    key={workgroupName.WORKGROUP_NAME}
                    value={workgroupName.WORKGROUP_NAME}
                  >
                    {workgroupName.WORKGROUP_NAME}
                  </option>
                ))}
          </select>
        </div>

        <div className="relative">
          <label
            htmlFor="end-month"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            &nbsp;
          </label>
          <button
            className={`bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-md ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            onClick={onPullData}
          >
            Pull Data
          </button>
        </div>

        {/* LineNames UI */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1"
             
          >
            LineName
          </label>
          <div
            onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
             //onClick={() => pressCheck(1)}
            className={`w-full border border-gray-300 cursor-default rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            disabled={isLoading || selectedWorkgroups.length === 0} // ปิดการใช้งานถ้าไม่มี Workgroups ถูกเลือก
          >
            {selectedLineNames.length > 0
              ? `Selected :  ${selectedLineNames[0]}`:"Select......"
              //: selectedWorkgroups.length > 0
              //? "Select LineNames"
              //: "Select Workgroups first"
              }
          </div>
          { isOpen1 && /*selectedWorkgroups.length > 0 &&*/ (
            <div className="absolute bottom-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              <label className="block p-2 cursor-pointer"
                 //onClick={() => setIsOpen1((prevOpen) => !prevOpen)}
                 //onClick={() => pressCheck(2)}
              >
                {/* <input
                  type="radio"
                  name="rd1"
                  onChange={() => setSelectedLineNames([])}
                  checked={selectedLineNames.length === 0}
                /> */}

                Select....
              </label>
              {availableLineNames.map((lineName) => (
                <label key={lineName} className="block p-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rd1"
                    value={lineName}
                    checked={selectedLineNames.includes(lineName)}
                    onChange={() => handleLineNameChange(lineName)}
                  />
                  &nbsp;{lineName}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="relative mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report View Type
          </label>
          <select
            className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
              isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
            }`}
            value={reportType}
            onChange={(e) => {
              const selectedReportType = e.target.value;
              setReportType(selectedReportType);

              // เปลี่ยนรูปแบบ startDate และ endDate ตามประเภทที่เลือก
              if (
                selectedReportType === "month" ||
                selectedReportType === "week"
              ) {
                // const currentMonthStart = new Date();
                // setStartDate(
                //   new Date(
                //     currentMonthStart.getFullYear(),
                //     currentMonthStart.getMonth(),
                //     1
                //   )
                // );
                // setEndDate(getLastDayOfMonth(currentMonthStart)); // สิ้นสุดที่วันสุดท้ายของเดือน
              } else if (
                selectedReportType === "date" ||
                selectedReportType === "shift"
              ) {
                /*const currentDate = new Date();
                setStartDate(currentDate);
                setEndDate(currentDate); // ใช้วันที่เดียวกัน*/
              }
            }}
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="date">Date</option>
            <option value="shift">Shift</option>
          </select>
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
      <div className="flex flex-col ">
        {/* Section ตัวเลือก DOC Numbers */}
        <div className=" relative w-full pb-4">
          <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
            <label className="block p-2 font-semibold">DOC Numbers</label>
            <select
              className="w-[250px] p-2 border rounded"
              value={selectedDocNumbers}
              onChange={(e) => handleDocNumberChange(e.target.value)}
            >
              <option value="">-- Select DOC Number --</option>
              {availableDocNumbers.map((docNumber) => (
                <option key={docNumber} value={docNumber}>
                  {docNumber}
                </option>
              ))}
            </select>
          </div>

        </div>
       
        {/* Section ตาราง */}
        <div className="w-full ">
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
