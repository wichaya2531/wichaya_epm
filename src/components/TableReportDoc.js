import React, { useState } from "react";

const TableReportDoc = ({ datasets }) => {
  const tableData = Object.values(datasets).flatMap((dataset) =>
    dataset.data.map((item) => ({
      docNumber: item.docNumber,
      jobItemName: item.jobItemName,
      month: new Date(item.x).getMonth(),
      actualValue: item.actualValue,
    }))
  );
  const groupedData = tableData.reduce((acc, item) => {
    const key = `${item.docNumber}-${item.jobItemName}`;
    if (!acc[key]) {
      acc[key] = {
        docNumber: item.docNumber,
        jobItemName: item.jobItemName,
        months: Array(12).fill(null),
      };
    }
    acc[key].months[item.month] = item.actualValue;
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

  const getBackgroundColor = (actualValue) => {
    switch (actualValue?.toLowerCase()) {
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

      {/* ตาราง */}
      <table className="min-w-full border-collapse table-auto rounded-lg">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-left font-semibold bg-blue-600 text-white">
              Doc Number
            </th>
            <th className="border px-4 py-2 text-left font-semibold bg-blue-600 text-white">
              Job Item Name
            </th>
            {[
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
            ].map((month) => (
              <th
                key={month}
                className="border px-4 py-2 text-left font-semibold bg-blue-600 text-white"
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.docNumber}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.jobItemName}
              </td>
              {row.months.map((value, monthIndex) => (
                <td
                  key={monthIndex}
                  className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                    value
                  )}`}
                >
                  {value || "-"}
                </td>
              ))}
            </tr>
          ))}
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
