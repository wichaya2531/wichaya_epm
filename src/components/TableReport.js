// src/components/tableReport.js
import React from "react";

const TableReport = ({ datasets }) => {
  // ดึงข้อมูลจาก datasets
  const tableData = Object.values(datasets).flatMap((dataset) =>
    dataset.data.map((item) => ({
      lineName: dataset.label.split(" - ")[0], // Line Name
      workgroupName: dataset.label.split(" - ")[1], // Workgroup Name
      jobItemName: item.jobItemName, // JOB_ITEM_NAME
      date: new Date(item.x).toLocaleDateString(), // แปลงเป็นวันที่
      docNumber: item.docNumber, // DOC_NUMBER
      actualValue: item.actualValue, // ACTUAL_VALUE
    }))
  );

  return (
    <div>
      <table className="min-w-full border-collapse table-auto">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-left">Line Name</th>
            <th className="border px-4 py-2 text-left">Workgroup Name</th>
            <th className="border px-4 py-2 text-left">Date</th>
            <th className="border px-4 py-2 text-left">DOC_NUMBER</th>
            <th className="border px-4 py-2 text-left">JOB_ITEM_NAME</th>
            <th className="border px-4 py-2 text-left">ACTUAL_VALUE</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.lineName}</td>
              <td className="border px-4 py-2">{row.workgroupName}</td>
              <td className="border px-4 py-2">{row.date}</td>
              <td className="border px-4 py-2">{row.docNumber}</td>
              <td className="border px-4 py-2">{row.jobItemName}</td>
              <td className="border px-4 py-2">{row.actualValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableReport;
