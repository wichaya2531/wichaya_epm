import React, { useState } from "react";

const TableReport = ({ datasets }) => {
  // ดึงข้อมูลจาก datasets
  const tableData = Object.values(datasets).flatMap((dataset) =>
    dataset.data.map((item) => ({
      lineName: dataset.label.split(" - ")[0], // Line Name
      workgroupName: dataset.label.split(" - ")[1], // Workgroup Name
      jobItemName: item.jobItemName, // JOB_ITEM_NAME
      date: new Date(item.x), // แปลงเป็นวันที่และเวลา
      docNumber: item.docNumber, // DOC_NUMBER
      actualValue: item.actualValue, // ACTUAL_VALUE
    }))
  );

  // เรียงข้อมูลจากวันที่ล่าสุดไปยังวันที่เก่า
  tableData.sort((a, b) => b.date - a.date);

  const [rowsPerPage, setRowsPerPage] = useState(10); // จำนวนแถวต่อหน้า (ค่าเริ่มต้น: 10)
  const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน
  const totalPages = Math.ceil(tableData.length / rowsPerPage); // คำนวณจำนวนหน้าทั้งหมด
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedData = tableData.slice(startIndex, startIndex + rowsPerPage); // แสดงข้อมูลที่กรองตามหน้า

  // ฟังก์ชันในการเลือกสีพื้นหลังตาม actualValue
  const getBackgroundColor = (actualValue) => {
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
        return "bg-white"; // ถ้าไม่มีค่าที่ตรงจะเป็นพื้นหลังขาว
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      {/* Dropdown เลือกจำนวนแถว */}
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
              setCurrentPage(1); // กลับไปหน้าแรกเมื่อเปลี่ยนจำนวนแถว
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

      {/* ตาราง */}
      <table className="min-w-full border-collapse table-auto rounded-lg">
        <thead>
          <tr>
            {[
              "Workgroup Name",
              "Line Name",
              "DOC_NUMBER",
              "JOB_ITEM_NAME",
              "Date",
              "ACTUAL_VALUE",
            ].map((header) => (
              <th
                key={header}
                className="border px-4 py-2 text-left font-semibold bg-blue-600 text-white"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.workgroupName}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.lineName}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.docNumber}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.jobItemName}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.date.toLocaleString()}
              </td>
              <td
                className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                  row.actualValue
                )}`}
              >
                {row.actualValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ปุ่มเปลี่ยนหน้า */}
      <div className="flex justify-evenly items-center m-4">
        <button
          className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-500"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        <span className="text-sm font-semibold text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-500"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TableReport;
