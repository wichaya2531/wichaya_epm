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
import BarChart1 from "./BarChart1";
import ReportDoc from "./ReportDoc";
import { use, useState } from "react";
import useFetchReport1 from "@/lib/hooks/useFetchReport1";

import useFetchUsers from "@/lib/hooks/useFetchUser";
import { useEffect } from "react";
const Page = () => {
  const [refresh, setRefresh] = useState(false);
  const currentDate = new Date();

  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  // เวลาปัจจุบัน - 3 วัน
  const pastDate = new Date(currentDate);
  pastDate.setDate(currentDate.getDate() - 3);
  const formattedStartDate = pastDate.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(formattedStartDate);
  const pastDate_a = new Date(currentDate);
  const formattedStartDate_a = pastDate_a.toISOString().split("T")[0];
  const [endDate, setEndDate] = useState(formattedStartDate_a);
  const [workgroupSelect, setWorkgroupSelect] = useState(user.workgroup);
  const { report, isLoading } = useFetchReport1(
    refresh,
    startDate,
    endDate,
    workgroupSelect
  );

  const [selectedChart, setSelectedChart] = useState("ReportDoc");


  const [workgroupOfUser, setWorkgroupOfUser] = useState([]);
  const chartButtons = [
    //{ label: "Value in Item", value: "BarChart5" },
    { label: "ReportDoc", value: "ReportDoc" },
    // { label: "Checklist Active By user", value: "BarChart" },
    // { label: "Template By Workgroups", value: "BarChart1" },
    // { label: "User Type workgroup", value: "BarChart2" },
    // { label: "Members in workgroup", value: "BarChart3" },
    // { label: "By activate name", value: "BarChart4" },
  ];

  const handleDateStartFilterChange = (start) => {
    //alert('OK');
    setStartDate(start);
    //setEndDate(end);
    //console.log("Filtered Start Date:", start);
    //console.log('Filtered End Date:', end);
  };

  useEffect(() => {
        //setAllLineName([]);
        /// retrieveSession();
        if (user) {
             //console.log('user in report page', user);
             setWorkgroupOfUser({
              workgroup:user.workgroup,
              workgroup_id:user.workgroup_id
             }); 
        }

  }, [user]);


  const handleDateEndFilterChange = (end) => {
    //alert('OK');
    //setStartDate(start);
    setEndDate(end);
    //console.log('Filtered Start Date:', start);
   // console.log("Filtered End Date:", end);
  };
  const handlePullData = () => {
    //alert(workgroupSelect);
    //alert('OK');
    //setStartDate(start);
    //setEndDate(end);
    //console.log('Filtered Start Date:', start);
    //console.log('Filtered End Date:', end);
    setRefresh(!refresh); // Trigger refresh to refetch data
     //console.log(`Fetching data from ${startDate} to ${endDate}`);
  };

  const handleWorkgroupSelect = (workgroup_name) => {
    setWorkgroupSelect(workgroup_name);
    //alert('workgroup selected '+workgroup_name);
  };

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
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ease-in-out ${
              selectedChart === button.value
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {button.label}
          </button>
        ))}
      </div>
      <div className="mb-4 p-4 bg-white rounded-xl">
        {/* {selectedChart === "BarChart" && <BarChart />}
        {selectedChart === "BarChart1" && <BarChart1 />}
        {selectedChart === "BarChart2" && <BarChart2 />}
        {selectedChart === "BarChart3" && <BarChart3 />}
        {selectedChart === "BarChart4" && <BarChart4 />} */}
        {/* {selectedChart === "BarChart5" && (
          <BarChart5 report={report} isLoading={isLoading} />
        )} */}
        {selectedChart === "ReportDoc" && (
          <ReportDoc
            report={report}
            isLoading={isLoading}
            onDateStartFilterChange={handleDateStartFilterChange}
            onDateEndFilterChange={handleDateEndFilterChange}
            onPullData={handlePullData}
            onWorkgroupSelect={handleWorkgroupSelect}
            workgroupOfUser={workgroupOfUser}
          />
        )}
      </div>
    </Layout>
  );
};
export default Page;
