import React, { useState } from "react";

const TableReportDoc = ({ filteredData, startDate, endDate, reportType }) => {
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

  let datesToShow = []; // ประกาศตัวแปร datesToShow ให้ออกมานอกเงื่อนไข

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

    // เริ่มต้นที่วันแรกของเดือนที่ระบุ
    while (currentDate <= endDate) {
      // หาวันเริ่มต้นของสัปดาห์ (วันจันทร์)
      let startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // set ให้เป็นวันจันทร์

      // หาวันสิ้นสุดของสัปดาห์ (วันอาทิตย์)
      let endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // เพิ่ม 6 วันให้เป็นวันอาทิตย์

      // เพิ่มสัปดาห์นี้เข้าไป
      weeks.push({
        start: startOfWeek,
        end: endOfWeek,
        label: `Week ${weeks.length + 1}`, // เพิ่ม label สำหรับสัปดาห์
      });

      // ไปยังสัปดาห์ถัดไป
      currentDate.setDate(currentDate.getDate() + 7); // ไปวันถัดไป
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
        const hours = itemDate.getHours();
        const ampm = hours < 12 ? "AM" : "PM"; // แบ่ง AM/PM
        return {
          docNumber: item.docNumber,
          jobItemName: item.jobItemName,
          jobItemTitle: item.jobItemTitle,
          month: itemDate.getMonth(),
          year: itemDate.getFullYear(),
          actualValue: item.actualValue,
          date: itemDate, // ใช้ Date Object จริง
          dateStr: itemDate.toISOString().split("T")[0], // แปลงเป็น YYYY-MM-DD
          time: itemDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }), // แปลงเป็นเวลาแบบ 'HH:MM'
          ampm: ampm, // เก็บ AM หรือ PM
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
          date: item.dateStr, // เก็บวันที่
          time: item.time, // เก็บเวลา
          ampm: item.ampm, // เก็บ AM/PM
          actualValue: item.actualValue, // เก็บ actual value
        };
      }
    }

    return acc;
  }, {});

  const formattedData = Object.values(groupedData);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(formattedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedData = formattedData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // เพิ่ม console.log เพื่อตรวจสอบวันที่
  console.log("startDate: ", startDate);
  console.log("endDate: ", endDate);
  console.log("weeksToShow: ", weeksToShow);
  console.log("monthsToShow: ", monthsToShow);
  console.log("datesToShow: ", datesToShow);
  console.log("formattedData: ", formattedData);
  console.log("reportType: ", reportType);

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
              setCurrentPage(1);
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
          {/* แสดง AM/PM เฉพาะแถวที่สอง */}
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
                      {/* ถ้า value เป็น null หรือ undefined จะแสดงเป็น "-" */}
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

                    return (
                      <React.Fragment key={dateIndex}>
                        <td
                          key={`time-${dateIndex}`} // ใช้ backticks สำหรับ string interpolation
                          className="border px-4 py-2 text-sm text-gray-700"
                        >
                          -
                        </td>
                        <td
                          key={`value-${dateIndex}`} // ใช้ backticks สำหรับ string interpolation
                          className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                            value
                          )}`} // ใส่ getBackgroundColor(value) เพื่อกำหนดสีพื้นหลัง
                        >
                          {value}
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

      {/* ปุ่มเปลี่ยนหน้า */}
      <div className="flex justify-evenly items-center m-4">
        <button
          className={`px-4 py-2 border rounded-lg font-medium transition-all duration-300 ${
            currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-md"
          }`}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        {totalPages > 0 && (
          <span className="text-sm font-semibold text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        )}
        <button
          className={`px-4 py-2 border rounded-lg font-medium transition-all duration-300 ${
            currentPage === totalPages || totalPages === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-md"
          }`}
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TableReportDoc;
