"use client"; // เพิ่มบรรทัดนี้

import Layout from "@/components/Layout";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import BarChart from "./BarChart";
import BarChart2 from "./BarChart2";
import BarChart3 from "./BarChart3";
import BarChart4 from "./BarChart4";
import BarChart5 from "./BarChart5";
import { useState } from "react";

const Page = () => {
  // สร้าง state สำหรับเก็บข้อมูลว่าจะแสดงกราฟไหน
  const [selectedChart, setSelectedChart] = useState("BarChart");
  const chartButtons = [
    { label: "จำนวนงาน", value: "BarChart" },
    { label: "กลุ่มงานต่างๆ", value: "BarChart2" },
    { label: "สมาชิกแต่ละกลุ่มงาน", value: "BarChart3" },
    { label: "วันที่ของแต่ละงาน", value: "BarChart4" },
    { label: "ข้อมูลไอเทมต่างๆ", value: "BarChart5" },
  ];

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/report.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Report
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex items-center">
          Summarize the data.
        </h1>
      </div>

      {/* ปุ่มสำหรับแสดงกราฟต่าง ๆ */}
      <div className="flex justify-start mb-4 space-x-4">
        {chartButtons.map((button) => (
          <button
            key={button.value}
            onClick={() => setSelectedChart(button.value)}
            className={`px-4 py-2 rounded-md ${
              selectedChart === button.value
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-black"
            } hover:bg-blue-500`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="mb-4 p-4 bg-white rounded-xl">
        {/* แสดงผลกราฟตามค่าของ state */}
        {selectedChart === "BarChart" && <BarChart />}
        {selectedChart === "BarChart2" && <BarChart2 />}
        {selectedChart === "BarChart3" && <BarChart3 />}
        {selectedChart === "BarChart4" && <BarChart4 />}
        {selectedChart === "BarChart5" && <BarChart5 />}
      </div>
    </Layout>
  );
};

export default Page;
