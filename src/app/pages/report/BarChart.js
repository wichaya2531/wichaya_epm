// components/BarChart.js
"use client";
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js"; // เพิ่ม LogarithmicScale
import useFetchReport from "@/lib/hooks/useFetchReport";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend
); // ลงทะเบียน LogarithmicScale

const BarChart = () => {
  const [refresh, setRefresh] = useState(false);
  const { report, isLoading, error } = useFetchReport(refresh);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // กรองผู้ใช้งานที่มีจำนวน Checklist ต่ำกว่า 5 ออก
  const filteredReport = report.filter((item) => item.jobCount > 5);
  // เพิ่มกลุ่ม "Others" สำหรับผู้ใช้งานที่มีจำนวน Checklist ต่ำกว่า 5
  const otherUsers = report.filter((item) => item.jobCount <= 5);
  const reducedReport = [
    ...filteredReport,
    {
      userName: "Others",
      jobCount: otherUsers.reduce((acc, cur) => acc + cur.jobCount, 0),
    },
  ];

  const data = {
    labels: reducedReport.map((item) => item.userName),
    datasets: [
      {
        label: "Number of Checklists Activated",
        backgroundColor: reducedReport.map(
          () => "#" + Math.floor(Math.random() * 16777215).toString(16)
        ),
        data: reducedReport.map((item) => item.jobCount),
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
        text: "Top of Checklists Activated by Each Employee Name",
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
        type: "logarithmic", // ใช้สเกลแบบ Logarithmic เพื่อลดความไม่สมดุลของข้อมูล
        title: {
          display: true,
          text: "Number of Checklists",
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
