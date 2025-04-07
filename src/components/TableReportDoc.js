import React, { useState } from "react";

const TableReportDoc = ({
  filteredData,
  startDate,
  endDate,
  reportType,
  currentPage,
  onPageChange,
}) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startMonth = startDate ? startDate.getMonth() : 0;
  const startYear = startDate ? startDate.getFullYear() : 0;
  const endMonth = endDate ? endDate.getMonth() : 11;
  const endYear = endDate ? endDate.getFullYear() : 9999;

  // filteredData,
  // startDate,
  // endDate,
  // reportType,
  // currentPage,
  // onPageChange,
  //console.log('filteredData',filteredData);
  // console.log('startDate',startDate);
  // console.log('endDate',endDate);
  // console.log('reportType',reportType);
  // console.log('currentPage',currentPage);
  // console.log('onPageChange',onPageChange);

  //console.log('data transfer is OK');

  let datesToShow = [];

  if (reportType === "date" || reportType === "shift") {
    // คำนวณวันที่ทั้งหมดในช่วงเวลาที่เลือก
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      datesToShow.push(new Date(currentDate)); // เพิ่มวันในช่วงที่เลือก
      currentDate.setDate(currentDate.getDate() + 1); // ไปยังวันถัดไป
    }
  }

  // คำนวณสัปดาห์ทั้งหมดในช่วงเวลาที่เลือก
  const getWeeksInRange = (startDate, endDate) => {
    const weeks = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let startOfWeek = new Date(currentDate);

      // ถ้าเป็น Week 1 ให้เริ่มจาก startDate
      if (weeks.length === 0) {
        startOfWeek = new Date(startDate);
      } else {
        startOfWeek.setDate(currentDate.getDate());
      }

      let endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // ป้องกันไม่ให้ endOfWeek เกิน endDate
      if (endOfWeek > endDate) {
        endOfWeek = new Date(endDate);
      }

      // ดึงแค่วันที่
      const startLabel = startOfWeek.getDate();
      const endLabel = endOfWeek.getDate();

      weeks.push({
        start: startOfWeek,
        end: endOfWeek,
        label: `${startLabel}-${endLabel} / Week ${weeks.length + 1}`,
      });

      // ขยับไปวันถัดไปของ endOfWeek
      currentDate = new Date(endOfWeek);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
  };

  // คำนวณสัปดาห์ทั้งหมดในช่วงเวลาที่เลือก
  const weeksToShow = getWeeksInRange(startDate, endDate);

  // คำนวณเดือนทั้งหมดในช่วงเวลาที่เลือก
  const monthsToShow = [];
  let currentMonth = new Date(startDate);

  if (reportType === "month") {
    if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
      monthsToShow.push(new Date(startDate));
    } else {
      while (currentMonth <= endDate) {
        monthsToShow.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }
  } else if (reportType === "week") {
    // ใช้ weeksToShow สำหรับแสดงข้อมูลในรูปแบบสัปดาห์
  } else if (reportType === "date" || reportType === "shift") {
    // ตัวแปร datesToShow จะถูกใช้ในภายหลัง
  }

  // สร้าง tableData ที่กรองข้อมูลตามช่วงเวลา
  const tableData = Object.values(filteredData).flatMap((dataset) =>
    dataset.data
      .map((item) => {
        const itemDate = new Date(item.x);
        console.log("item.x (raw):", item.x);
        const hours = itemDate.getHours();
        const ampm = hours < 12 ? "AM" : "PM";
        return {
          docNumber: item.docNumber,
          jobItemName: item.jobItemName,
          jobItemTitle: item.jobItemTitle,
          month: itemDate.getMonth(),
          year: itemDate.getFullYear(),
          actualValue: item.actualValue,
          date: itemDate,
          dateStr: itemDate.toISOString().split("T")[0],
          time: itemDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ampm: ampm,
        };
      })
      .filter((item) => {
        if (reportType === "month") {
          return (
            (item.year > startYear ||
              (item.year === startYear && item.month >= startMonth)) &&
            (item.year < endYear ||
              (item.year === endYear && item.month <= endMonth))
          );
        } else if (reportType === "week") {
          return weeksToShow.some(
            (week) => item.date >= week.start && item.date <= week.end
          );
        } else if (reportType === "date" || reportType === "shift") {
          return datesToShow.some(
            (date) =>
              date instanceof Date &&
              date.toISOString().split("T")[0] === item.dateStr
          );
        }
        return false;
      })
  );

  // สร้าง groupedData ตามเงื่อนไขที่กำหนด
  const groupedData = tableData.reduce((acc, item) => {
    const key = `${item.docNumber}-${item.jobItemName}`;

    if (!acc[key]) {
      acc[key] = {
        docNumber: item.docNumber,
        jobItemName: item.jobItemName,
        jobItemTitle: item.jobItemTitle,
        months: Array(monthsToShow.length).fill(null),
        weeks: Array(weeksToShow.length).fill(null),
        dates: Array(datesToShow.length).fill(null),
      };
    }

    let index = -1;

    if (reportType === "month") {
      index = monthsToShow.findIndex(
        (month) =>
          month instanceof Date &&
          month.getMonth() === item.month &&
          month.getFullYear() === item.year
      );
      if (index !== -1) {
        acc[key].months[index] = item.actualValue;
      }
    } else if (reportType === "week") {
      index = weeksToShow.findIndex(
        (week) =>
          week instanceof Object &&
          item.date >= week.start &&
          item.date <= week.end
      );
      if (index !== -1) {
        acc[key].weeks[index] = item.actualValue;
      }
    } else if (reportType === "date") {
      // สำหรับ reportType === "date"
      index = datesToShow.findIndex(
        (date) =>
          date instanceof Date &&
          date.toISOString().split("T")[0] === item.dateStr
      );
      if (index !== -1) {
        acc[key].dates[index] = {
          date: item.dateStr, // เก็บแค่วันที่
          actualValue: item.actualValue, // เก็บ actual value
        };
      }
    } else if (reportType === "shift") {
      // สำหรับ reportType === "shift"
      index = datesToShow.findIndex(
        (date) =>
          date instanceof Date &&
          date.toISOString().split("T")[0] === item.dateStr
      );
      if (index !== -1) {
        acc[key].dates[index] = {
          date: item.dateStr,
          time: item.time,
          ampm: item.ampm,
          actualValue: item.actualValue,
        };
      }
    }
    console.log("item.x (raw):", item.time);
    console.log("item.x (raw):", item.ampm);
    return acc;
  }, {});

  const formattedData = Object.values(groupedData);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const totalPages = Math.ceil(formattedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedData = formattedData.slice(
    startIndex,
    startIndex + rowsPerPage
  );
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  const generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
    const pageNumbers = [];
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    // Case 1: หากอยู่ที่หน้าแรก
    if (currentPage <= half) {
      end = Math.min(totalPages, maxVisible);
    }
    // Case 2: หากอยู่ที่หน้าสุดท้าย
    else if (currentPage + half >= totalPages) {
      start = Math.max(1, totalPages - maxVisible + 1);
    }

    // เริ่มต้นการแสดงหมายเลขหน้า
    if (start > 1) {
      pageNumbers.push(1);
      if (start > 2) pageNumbers.push("..."); // แสดง "..." เมื่อมีหน้าเยอะ
    }

    // เพิ่มหมายเลขหน้าที่แสดง
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    // การแสดงหน้า 324 หรือหน้าอื่น ๆ
    if (end < totalPages) {
      if (end < totalPages - 1) pageNumbers.push("..."); // แสดง "..." หากมีหน้าหลาย
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  // เพิ่ม console.log เพื่อตรวจสอบวันที่
  // console.log("startDate: ", startDate);
  // console.log("endDate: ", endDate);
  // console.log("weeksToShow: ", weeksToShow);
  // console.log("monthsToShow: ", monthsToShow);
  // console.log("datesToShow: ", datesToShow);
  // console.log("formattedData: ", formattedData);
  // console.log("reportType: ", reportType);

  const getBackgroundColor = (actualValue) => {
    // ตรวจสอบว่า actualValue เป็น string หรือไม่
    if (typeof actualValue === "string") {
      switch (actualValue.toLowerCase()) {
        case "pass":
          return "bg-green-200";
        case "good":
          return "bg-blue-200";
        case "not change":
          return "bg-gray-200";
        case "fail":
          return "bg-red-200";
        case "change":
          return "bg-yellow-200";
        case "done":
          return "bg-purple-200";
        case "check":
          return "bg-orange-200";
        case "unknown":
          return "bg-indigo-200";
        default:
          return "bg-white";
      }
    } else {
      return "bg-white"; // ถ้าไม่ใช่ string จะใช้พื้นหลังเป็นสีขาว
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <label
            htmlFor="rowsPerPage"
            className="mr-2 font-semibold text-gray-700"
          >
            Rows:
          </label>
          <select
            id="rowsPerPage"
            className="px-2 py-1 border rounded bg-white-200"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {[5, 10, 15, 20, 25, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className="min-w-full border-collapse table-auto rounded-lg">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border px-4 py-3 text-left font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white tracking-wider uppercase"
            >
              Doc Number
            </th>
            <th
              rowSpan={2}
              className="border px-4 py-3 text-left font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white tracking-wider uppercase"
            >
              Item Title
            </th>
            <th
              rowSpan={2}
              className="border px-4 py-3 text-left font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white tracking-wider uppercase"
            >
              Item Name
            </th>
            {/* แสดงข้อมูลตามประเภท reportType */}
            {reportType === "month" &&
              monthsToShow.map((monthDate, index) => (
                <th
                  key={index}
                  className="border px-4 py-2 text-left font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                >
                  {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                </th>
              ))}
            {reportType === "week" &&
              weeksToShow.map((week, index) => (
                <th
                  key={index}
                  className="border px-4 py-2 text-left font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                >
                  {week.label}
                </th>
              ))}
            {reportType === "date" &&
              datesToShow.map((date, index) => (
                <th
                  key={index}
                  // ใช้ colSpan 2 เพื่อรวม AM และ PM ในแถวบนสุด
                  className="border px-4 py-2 text-center font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                >
                  {date.toLocaleDateString()}
                </th>
              ))}
            {reportType === "shift" &&
              datesToShow.map((date, index) => (
                <th
                  key={index}
                  colSpan={2} // ใช้ colSpan 2 เพื่อรวม AM และ PM ในแถวบนสุด
                  className="border px-4 py-2 text-center font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                >
                  {date.toLocaleDateString()}
                </th>
              ))}
          </tr>
          {reportType === "shift" && (
            <tr>
              {datesToShow.map((date, index) => (
                <React.Fragment key={index}>
                  <th className="border px-4 py-2 text-center font-semibold bg-gray-300">
                    AM
                  </th>
                  <th className="border px-4 py-2 text-center font-semibold bg-gray-300">
                    PM
                  </th>
                </React.Fragment>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {displayedData.length > 0 ? (
            displayedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-sm text-gray-700">
                  {row.docNumber}
                </td>
                <td className="border px-4 py-2 text-sm text-gray-700">
                  {row.jobItemTitle}
                </td>
                <td className="border px-4 py-2 text-sm text-gray-700">
                  {row.jobItemName}
                </td>
                {reportType === "month" &&
                  row.months.map((value, monthIndex) => (
                    <td
                      key={monthIndex}
                      className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                        value
                      )}`}
                    >
                      {value || "-"}{" "}
                    </td>
                  ))}
                {reportType === "week" &&
                  row.weeks.map((value, weekIndex) => (
                    <td
                      key={weekIndex}
                      className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                        value
                      )}`}
                    >
                      {value !== null && value !== undefined ? value : "-"}{" "}
                      {/* แสดง "-" ถ้าค่าเป็น null หรือ undefined */}
                    </td>
                  ))}
                {reportType === "date" &&
                  row.dates.map((dateData, dateIndex) => {
                    const value = dateData?.actualValue ?? "-"; // ใช้ค่าของ actualValue ถ้ามี ไม่งั้นใช้ "-"

                    return (
                      <td
                        key={dateIndex}
                        className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                          value
                        )}`}
                      >
                        {value}
                      </td>
                    );
                  })}
                {reportType === "shift" &&
                  datesToShow.map((date, dateIndex) => {
                    const dateData = row.dates[dateIndex];

                    const time = dateData ? dateData.time : "-";
                    const ampm = dateData ? dateData.ampm : "-";
                    const value = dateData ? dateData.actualValue : "-";

                    // เปลี่ยนค่า ampm ให้เหมือนกับ value หาก ampm เป็น "AM" หรือ "PM"
                    const ampmValue = ampm !== "-" ? value : ampm;

                    return (
                      <React.Fragment key={dateIndex}>
                        <td
                          key={`time-${dateIndex}`}
                          className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                            ampmValue
                          )}`}
                        >
                          {ampmValue}{" "}
                          {/* แสดงค่า ampm ที่ถูกแปลงเป็นค่า value หากมีค่า AM หรือ PM */}
                        </td>
                        <td
                          key={`value-${dateIndex}`}
                          className={`border px-4 py-2 text-sm text-gray-700 text-center align-middle`}
                        >
                          -
                        </td>
                      </React.Fragment>
                    );
                  })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  reportType === "month"
                    ? monthsToShow.length + 3
                    : reportType === "week"
                    ? weeksToShow.length + 3
                    : datesToShow.length + 3
                }
                className="border px-4 py-6 text-center text-gray-500 text-sm"
              >
                Please select an option above to display data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {/* ปุ่ม Prev */}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded disabled:opacity-50 transition duration-300"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          Prev
        </button>

        {/* หมายเลขหน้า (แสดงเฉพาะจอใหญ่) */}
        <div className="hidden sm:flex gap-2">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`py-2 px-4 rounded-lg font-semibold transition duration-300 ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-blue-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Dropdown เปลี่ยนหน้า (แสดงบนมือถือ) */}
        <select
          className="sm:hidden border rounded px-3 py-2 bg-gray-200 hover:bg-gray-300 transition duration-300"
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
        >
          {pageNumbers.map((page) => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>

        {/* ปุ่ม Next */}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded disabled:opacity-50 transition duration-300"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TableReportDoc;
