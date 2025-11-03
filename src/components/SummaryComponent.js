"use client";
import Swal from "sweetalert2";
import React, { useMemo } from "react";
import Cookies from "js-cookie";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";
import { useRouter } from "next/navigation";
//import { Router } from "express";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// ===== Utils =====
function abbreviate(label, maxLen = 8) {
  if (!label) return "(unknown)";
  return label.length > maxLen ? label.slice(0, maxLen) + "…" : label;
}

function getProfileName(it) {
  return String(it?.PROFILE_NAME ?? it?.PROFILE_GROUP ?? "(no profile)");
}

// สีสำรอง ถ้า record ไม่มี STATUS_COLOR
const FALLBACK_COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa",
  "#22d3ee", "#f87171", "#4ade80", "#f59e0b", "#c084fc",
];

const DEFAULT_GROUP_FIELD = "STATUS_NAME";

// เพิ่ม prop onSliceClick เพื่อยิงพารามิเตอร์ออกไปภายนอก // NEW
const ProfileCardsWithPie = ({ datas = [], groupField = DEFAULT_GROUP_FIELD, onSliceClick }) => {
   const router = useRouter();
  //console.log('datas', datas);
    // วนลูปใน array แล้วอัปเดต field ในแต่ละ object
    datas.forEach(item => {
      if (item.STATUS_NAME) {
        item.STATUS_NAME = abbreviate(item.STATUS_NAME, 10);
      }
    });  
  // Group jobs ตาม PROFILE_NAME
  const groupedByProfile = useMemo(() => {
    const map = new Map();
    for (const it of datas || []) {
      const key = getProfileName(it);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [datas]);

const buildChartData = (jobs) => {
  const countMap = new Map();
  for (const j of jobs) {
    const label = String(j?.[groupField] ?? "(unknown)");
    const current = countMap.get(label) || { count: 0, color: undefined };
    const color = current.color ?? j?.STATUS_COLOR ?? undefined;
    countMap.set(label, { count: current.count + 1, color });
  }

  // ✅ ใช้ entries เพื่อ map label เดิม + ชื่อย่อ
  const entries = Array.from(countMap.entries()).map(([label, { count, color }], i) => ({
    label,                                // label เดิม
    display: label /*abbreviate(label, 8)*/,        // label ที่ตัดเหลือ 8 ตัว
    count,
    color: color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return {
    data: {
      labels: entries.map((e) => e.display), // แสดงชื่อที่ย่อแล้ว
      datasets: [
        {
          label: `Jobs by ${groupField}`,
          data: entries.map((e) => e.count),
          backgroundColor: entries.map((e) => e.color),
        },
      ],
    },
    total: jobs.length,
    meta: { entries },
  };
};

// === Base chart options ===
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",          // ✅ อยู่ด้านล่าง
      align: "center",             // ✅ เรียงแนวนอนตรงกลาง
      labels: {
        boxWidth: 12,
        padding: 10,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const label = ctx?.label ?? "";
          const v = ctx?.parsed ?? 0;
          const total = ctx?.dataset?.data?.reduce?.((s, x) => s + x, 0) || 0;
          const pct = total ? ((v / total) * 100).toFixed(1) : "0.0";
          return `${label}: ${v} (${pct}%)`;
        },
      },
    },
    datalabels: {
      color: "#fff",
      font: { weight: "bold", size: 12 },
      formatter: (value) => value,
    },
  },
};

  if (groupedByProfile.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-white rounded-2xl shadow">
                  <div className="flex items-center justify-center text-lg" style={{border:'1px solid none',width:'100%'}}>
                      <span className="animate-pulse mr-2">⏳</span>
                      Please wait...
                    </div>
      </div>
    );
  }

  // ฟังก์ชันสำหรับแสดง Swal รวม (badge {total} jobs) – ของเดิม
  function handleShowTotalJobs(profileName, total, jobs) {
    //console.log('jobs', jobs);
    Swal.fire({
      title: "Job Summary",
      html: `
        <div style="text-align:left;font-size:16px;line-height:1.6">
          <div><b>Profile:</b> ${profileName}</div>
          <div><b>Total Jobs:</b> ${total}</div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "OK",
    });
  }

  // ฟังก์ชันสำหรับคลิกที่ slice ของ Pie // NEW
  function handleSliceClick({ profileName, label, count, jobsOfSlice, chartData }) {
    // ยิงออกไปให้ parent ถ้าต้องการใช้งานต่อ // NEW
   //console.log(' handleSliceClick jobsOfSlice',jobsOfSlice); 
   //router.push("/pages/job-manage/"); // ไปยังหน้า dashboard
   //console.log('messageFromLayout', messageFromLayout);
   //return;
    


    const jobIds = jobsOfSlice.map(j => j._id);
    sessionStorage.setItem("jobIds", JSON.stringify(jobIds));
    // Navigate ไปยังหน้าถัดไป
    router.push("/pages/job-manage");
  // return;

  // try {
  //     const form = document.createElement("form");
  //     //jmp:1
  //     //Cookies.set("jobTable_quickview_current_page", pageNumber, { expires: 1 / (24 * 60) }); // มีอายุ 1 นาที 
  //     // Router.push({
  //     //   pathname: "/pages/job-manage",
  //     // }); 
  //     // return;


      
  //     form.method = "POST";
  //     form.action = "/pages/job-manage/api/"; // ปลายทางที่คุณต้องการส่งไป
  //     form.style.display = "none";

  //     const addField = (name, value) => {
  //       const input = document.createElement("input");
  //       input.type = "hidden";
  //       input.name = name;
  //       input.value = String(value ?? "");
  //       form.appendChild(input);
  //     };



  //     // ตัวอย่าง: jobsOfSlice คือ Array ของ object
  //     // const jobsOfSlice = [
  //     //   { _id: "68ed1d5a265771bc0bcf4f28" },
  //     //   { _id: "68ed1d5a265771bc0bcf4f29" },
  //     // ];

  //     // ส่งเป็น JSON string (array จริง)
  //     addField("jobIds", JSON.stringify(jobsOfSlice.map(j => j._id)));
      
  //     console.log('form',form);
  //     return;
  //     document.body.appendChild(form);
  //     form.submit();
  //   } catch (err) {
  //     console.error("POST redirect error:", err);
  //   }

    
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {groupedByProfile.map(([profileName, jobs]) => {
        //console.log('profileName' ,profileName);
        //console.log('jobs' ,jobs);
        const { data, total } = buildChartData(jobs);
        const latest = jobs
          .map((j) => new Date(j?.updatedAt || j?.createdAt || 0).getTime())
          .reduce((m, t) => Math.max(m, t), 0);

        // สร้าง options เฉพาะการ์ดนี้ เพื่อให้รู้ context (profileName, jobs, data) // NEW
        const optionsForThisCard = {
          ...baseChartOptions,
          // ใช้ onClick ของ Chart.js (v4) — elements มีข้อมูล slice ที่ active ตอนคลิก // NEW
          onClick: (_event, elements, chart) => {
            const el = elements?.[0];
            if (!el) return;
            const idx = el.index; // index ของ slice ที่คลิก
            const label = data.labels?.[idx] ?? "(unknown)";
            const count = data.datasets?.[0]?.data?.[idx] ?? 0;

            // jobs ที่อยู่ใน slice นี้
            const jobsOfSlice = jobs.filter(
              (j) => String(j?.[groupField] ?? "(unknown)") === label
            );

            handleSliceClick({
              profileName,
              label,
              count,
              jobsOfSlice,
              chartData: data,
            });
          },
          // ช่วยบอกผู้ใช้ว่าเป็นคลิกได้
          // (ใส่ cursor pointer ผ่าน plugin จริงๆ ไม่ได้ จำง่ายๆ ใช้ wrapper div แทน)
        };

        return (
          <div
            key={profileName}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {profileName}
                </h3>
                {/* <div className="text-xs text-gray-500">
                  Group by: <span className="font-medium">{groupField}</span>
                </div> */}
              </div>
              <span
                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 cursor-pointer select-none"
                onClick={() => handleShowTotalJobs(profileName, total, jobs)}
              >
                {total} jobs
              </span>
            </div>

            {/* Pie chart */}
           <div className="w-60 h-56 mx-auto cursor-pointer">
            <Pie data={data} options={optionsForThisCard} />
          </div>

            {/* Footer */}
            <div className="text-xs text-gray-500">
              Updated latest:{" "}
              {latest ? new Date(latest).toLocaleString() : "-"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileCardsWithPie;
