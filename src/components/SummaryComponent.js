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

// เพิ่ม prop onSliceClick เพื่อยิงพารามิเตอร์ออกไปภายนอก // NEW
const ProfileCardsWithPie = ({ datas = [], groupField = DEFAULT_GROUP_FIELD, onSliceClick }) => {
  //console.log('datas', datas);
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
    // ปิด tooltips ของ Chart.js แบบ global (ถ้ามี)
    try {
      if (ChartJS && ChartJS.defaults && ChartJS.defaults.plugins) {
        ChartJS.defaults.plugins.tooltip = ChartJS.defaults.plugins.tooltip || {};
        ChartJS.defaults.plugins.tooltip.enabled = false;
      }
    } catch (e) {
      // ignore
    }

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

  // === Base chart options (ไม่มี onClick ที่ผูกกับแต่ละการ์ด) ===
  const baseChartOptions = {
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

  // ฟังก์ชันสำหรับแสดง Swal รวม (badge {total} jobs) – ของเดิม
  function handleShowTotalJobs(profileName, total, jobs) {
    console.log('jobs', jobs);
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
    if (typeof onSliceClick === "function") {
      try {
        onSliceClick({
          profileName,
          label,
          count,
          jobs: jobsOfSlice,   // รายการ jobs ที่อยู่ใน slice นี้
          chartData,           // data object ของ chart ณ การ์ดนี้
        });
      } catch (e) {
        console.error("onSliceClick error:", e);
      }
    }

    try {
      // สร้าง form แบบ POST แล้ว submit เพื่อไปยัง /pages/job-manage/
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/pages/job-manage/";
      form.style.display = "none";

      const addField = (name, value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value ?? "");
      form.appendChild(input);
      };

      addField("profile", profileName ?? "");
      addField("label", label ?? "");
      addField("count", String(count ?? 0));

      const firstJob = jobsOfSlice?.[0];
      if (firstJob) {
      const id = firstJob?.JOB_CODE ?? firstJob?._id ?? firstJob?.JOB_NAME ?? "";
      if (id) addField("job", id);
      }

      // ถ้าต้องการ ส่งรายการ job ids ทั้งหมด แบบ comma-separated
      const jobIds = (jobsOfSlice || [])
      .map((j) => j?.JOB_CODE ?? j?._id ?? j?.JOB_NAME ?? "")
      .filter(Boolean)
      .join(",");
      if (jobIds) addField("jobIds", jobIds);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("POST navigation error:", err);
    }
    // console.log('jobsOfSlice', jobsOfSlice);
    // console.log('label', label);
    // console.log('count', count);
    // console.log('profileName', profileName);
    // console.log('chartData', chartData);
    return; 


    // แสดง Swal // NEW
    const listHtml = jobsOfSlice
      .slice(0, 10) // โชว์ตัวอย่างไม่เกิน 10 แถว (กันยาวเกิน)
      .map((j, i) => {
        const code = j?.JOB_CODE ?? j?.JOB_NAME ?? "(no id)";
        const created = j?.createdAt ? new Date(j.createdAt).toLocaleString() : "-";
        return `<li><b>${i + 1}.</b> ${code} <span style="color:#64748b">(${created})</span></li>`;
      })
      .join("");

    const tableHtml = (jobsOfSlice || [])
      .map((j, i) => {

      console.log('j', j);

      const code = j?.JOB_CODE ?? j?.JOB_NAME ?? "(no id)";
      const status = j?.STATUS_NAME ? j.STATUS_NAME : "-";
      return `
        <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${code}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">
            <div    
            style="cursor:default;text-align:center;border-radius:0.25em;color:white;background-color: ${j?.STATUS_COLOR || '#6b7280'}"       
            className="py-1 px-8 select-none rounded-xl text-white font-bold shadow-xl text-[12px] ipadmini:text-sm flex justify-center items-center px-5"
            >
              ${status}
            </div>
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">
          <button class="swal-row-btn" data-idx="${i}" style="padding:6px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer">
          View
          </button>
        </td>
        </tr>
      `;
      })
      .join("") || `<tr><td colspan="4" style="padding:8px">No items</td></tr>`;

    Swal.fire({
      title: `${profileName} – ${label}`,
      html: `
      <div style="text-align:left;font-size:15px;line-height:1.6">
        <div><b>Count:</b> ${count}</div>
       
        <div style="max-height:280px;overflow:auto;margin-top:6px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb">#</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb">Job</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb">Status</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb">Action</th>
          </tr>
          </thead>
          <tbody>
          ${tableHtml}
          </tbody>
        </table>
        </div>
      </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Close",
      cancelButtonText: "Cancel",
      width: 700,
      didOpen: (popup) => {
      // attach click handlers to row buttons
      popup.querySelectorAll(".swal-row-btn").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
        const idx = Number(btn.getAttribute("data-idx"));
        const job = jobsOfSlice?.[idx];
        // if parent provided onSliceClick, call it with the single job
        if (typeof onSliceClick === "function") {
          try {
          onSliceClick({
            profileName,
            label,
            count,
            jobs: [job],
            job,
            chartData,
          });
          } catch (e) {
          console.error("onSliceClick error:", e);
          }
        }
        // show quick detail for the job
        Swal.fire({
          title: job?.JOB_CODE ?? job?._id ?? "Job detail",
          html: `<pre style="text-align:left;white-space:pre-wrap">${JSON.stringify(job, null, 2)}</pre>`,
          width: 800,
          confirmButtonText: "OK",
        });
        });
      });
      },
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {groupedByProfile.map(([profileName, jobs]) => {
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
                <div className="text-xs text-gray-500">
                  Group by: <span className="font-medium">{groupField}</span>
                </div>
              </div>
              <span
                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 cursor-pointer select-none"
                onClick={() => handleShowTotalJobs(profileName, total, jobs)}
              >
                {total} jobs
              </span>
            </div>

            {/* Pie chart */}
            <div className="w-40 h-40 mx-auto cursor-pointer"> {/* NEW: cursor-pointer */}
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
