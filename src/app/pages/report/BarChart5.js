"use client";
import React, { useState, useRef } from "react";
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
import useFetchUsers from "@/lib/hooks/useFetchUser";
import { format, parseISO } from "date-fns";
import "chartjs-adapter-date-fns";
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
  const [SelectedLineNames, setSelectedLineNames] = useState([]);
  const [startDate, setStartDate] = useState(new Date("2024-01-01"));
  const [endDate, setEndDate] = useState(new Date("2024-12-31"));
  const { report } = useFetchReport1(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const chartRef = useRef(null);

  const handleDateFilter = () => {
    // กำหนดฟังก์ชันในการรีเฟรชข้อมูลตามวันที่ที่เลือก
    setRefresh(!refresh);
  };

  const groupedData = report
    .map((item) => {
      if (!item.jobItemsCreatedAt || !item.ACTUAL_VALUE) {
        console.warn(
          `jobItemsCreatedAt or ACTUAL_VALUE is undefined for item:`,
          item
        );
        return null;
      }
      const createdAt = parseISO(item.jobItemsCreatedAt); // แปลงเป็นวันที่
      if (isNaN(createdAt.getTime())) {
        console.warn(
          `Invalid date for jobItemsCreatedAt: ${item.jobItemsCreatedAt}`
        );
        return null;
      }

      return {
        x: createdAt.toISOString(), // ใช้ createdAt เป็นแกน X
        y: parseFloat(item.ACTUAL_VALUE), // ใช้ ACTUAL_VALUE เป็นแกน Y
      };
    })
    .filter((item) => item !== null) // กรองค่า null ออกจาก array
    .filter((item) => {
      const date = new Date(item.x);
      return date >= startDate && date <= endDate; // ฟิลเตอร์วันที่
    })
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.x === curr.x);
      if (existing) {
        existing.y += curr.y; // ถ้ามีวันเดียวกันให้รวมค่า y
      } else {
        acc.push(curr); // ถ้าไม่มีให้เพิ่มเข้าไป
      }
      return acc;
    }, []); // เริ่มต้นด้วย array ว่าง

  const datasets = [
    {
      label: "Actual Values",
      type: "line",
      borderColor: "rgba(79, 129, 189, 1)",
      backgroundColor: "rgba(79, 129, 189, 0.1)",
      data: groupedData.map((item) => ({ x: item.x, y: item.y })),
      tension: 0.4,
      fill: true,
    },
  ];
  const data = {
    labels: [],
    datasets: datasets,
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        font: {
          size: 12,
          weight: "bold",
        },
        formatter: (value) => value.y.toLocaleString(),
      },
    },
    layout: {
      padding: {
        top: 30,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    scales: {
      x: {
        type: "time", // กำหนดให้แกน x เป็นประเภท time
        time: {
          unit: "month", // แสดงหน่วยเป็นเดือน
          displayFormats: {
            month: "MMM yyyy", // เปลี่ยนเป็น 'MMM yyyy'
          },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: (value) => value.toLocaleString(),
        },
      },
    },
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg">
        {/* ปุ่มสำหรับฟิลเตอร์วันที่ */}
        <div>
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={format(startDate, "yyyy-MM-dd")}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={format(endDate, "yyyy-MM-dd")}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <button onClick={handleDateFilter}>Filter</button>
        <div>
          <label htmlFor="line-name">Select Line Name:</label>
          <select
            id="line-name"
            onChange={(e) => setSelectedLineNames(e.target.value)}
          >
            <option value="">All Line Names</option>
            {Array.isArray(user) ? (
              user.map((u) => (
                <option key={u.id} value={u.LINE_NAME}>
                  {u.LINE_NAME}
                </option>
              ))
            ) : (
              <option value="">Loading...</option>
            )}
          </select>
        </div>
      </div>
      <div style={{ height: "300px", width: "100%" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
export default BarChart5;
