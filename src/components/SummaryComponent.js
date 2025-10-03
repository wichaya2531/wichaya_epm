"use client";
import Swal from "sweetalert2";
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// ===== Utils =====
function getProfileName(it) {
  return String(it?.PROFILE_NAME ?? it?.PROFILE_GROUP ?? "(no profile)");
}

// สีสำรอง ถ้า record ไม่มี STATUS_COLOR
const FALLBACK_COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa",
  "#22d3ee", "#f87171", "#4ade80", "#f59e0b", "#c084fc",
];

const DEFAULT_GROUP_FIELD = "STATUS_NAME";

const ProfileCardsWithPie = ({ datas = [], groupField = DEFAULT_GROUP_FIELD }) => {
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
    const labels = Array.from(countMap.keys());
    const values = labels.map((l) => countMap.get(l).count);
    const backgroundColor = labels.map((_, idx) => {
      const c = countMap.get(labels[idx]).color;
      return c || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    });
    return {
      data: {
        labels,
        datasets: [
          {
            label: `Jobs by ${groupField}`,
            data: values,
            backgroundColor,
          },
        ],
      },
      total: jobs.length,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
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
        formatter: (value) => value, // แสดงตัวเลขตรงๆ
      },
    },
  };

  if (groupedByProfile.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-white rounded-2xl shadow">
        No data.
      </div>
    );
  }


  // ฟังก์ชันสำหรับแสดง Swal
function handleShowTotalJobs(profileName, total,jobs) {
  console.log('jobs',jobs);
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

  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
    {groupedByProfile.map(([profileName, jobs]) => {
      const { data, total } = buildChartData(jobs);
      const latest = jobs
        .map((j) => new Date(j?.updatedAt || j?.createdAt || 0).getTime())
        .reduce((m, t) => Math.max(m, t), 0);

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
              <div className="text-xs text-gray-500">
                Group by: <span className="font-medium">{groupField}</span>
              </div>
            </div>
          <span
            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 cursor-pointer select-none"
            onClick={() => handleShowTotalJobs(profileName, total,jobs)}
          >
            {total} jobs
          </span>
          </div>

          {/* Pie chart */}
          <div className="w-40 h-40 mx-auto">
            <Pie data={data} options={chartOptions} />
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
