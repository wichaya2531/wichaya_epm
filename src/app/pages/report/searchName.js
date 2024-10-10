// components/BarChart.js
"use client";
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import useFetchReport from "@/lib/hooks/useFetchReport";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const SearchName = () => {
  const [refresh, setRefresh] = useState(false);
  const [searchName, setSearchName] = useState(""); // state สำหรับเก็บค่าชื่อ userName ที่จะค้นหา
  const { report, isLoading, error } = useFetchReport(refresh);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // กรองข้อมูลตามชื่อผู้ใช้ (userName) ที่ค้นหา
  const filteredReport = report.filter((item) =>
    item.userName.toLowerCase().includes(searchName.toLowerCase())
  );

  const data = {
    labels: filteredReport.map((item) => item.userName),
    datasets: [
      {
        label: "Number of Checklists Activated",
        backgroundColor: filteredReport.map(
          () => "#" + Math.floor(Math.random() * 16777215).toString(16)
        ),
        data: filteredReport.map((item) => item.jobCount),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Number of Checklists Activated by Each Employee Name",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Employee Name",
        },
      },
      y: {
        title: {
          display: true,
          text: "Number of Checklists",
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="flex flex-wrap items-center space-x-4 w-full max-w-lg">
        <label
          htmlFor="searchName"
          className="font-semibold text-lg whitespace-nowrap"
        >
          Search by Employee Name:
        </label>
        <input
          type="text"
          id="searchName"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)} // อัปเดตค่าที่ค้นหา
          placeholder="Enter username"
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredReport.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="mt-5">No data found for this Employee Name.</div>
      )}
    </div>
  );
};

export default SearchName;
