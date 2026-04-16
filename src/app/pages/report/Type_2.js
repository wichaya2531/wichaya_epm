"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import useFetchReport2 from "@/lib/hooks/useFetchReport2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── hex → rgba ────────────────────────────────────────────────────────────────
const hexToRgba = (hex = "#9ca3af", alpha = 0.15) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const hexToRgb = (hex = "#9ca3af") => {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
};

// ── Job Card ──────────────────────────────────────────────────────────────────
const JobCard = ({ job, selectMode, selected, onToggle }) => {
  const color = job.JOB_STATUS_COLOR || "#9ca3af";
  return (
    <div
      onClick={() => selectMode && onToggle(job._id)}
      className={`relative flex flex-col gap-1 p-2 rounded-lg border shadow-sm transition-all cursor-default
        ${selectMode ? "cursor-pointer" : ""}
        ${selected ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
      style={{
        width: "10vw", minWidth: "130px", maxWidth: "180px",
        backgroundColor: hexToRgba(color, selected ? 0.3 : 0.15),
        borderColor: selected ? "#3b82f6" : hexToRgba(color, 0.5),
      }}
    >
      {/* Checkbox (select mode) */}
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(job._id)}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 right-1.5 w-4 h-4 accent-blue-500"
        />
      )}

      {/* Status dot + badge */}
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-bold uppercase truncate" style={{ color }}>
          {job.JOB_STATUS || "unknown"}
        </span>
      </div>

      {/* Job Name */}
      <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate" title={job.JOB_NAME}>
        {job.JOB_NAME || "—"}
      </p>

      {/* Line Name */}
      <p className="text-[10px] text-gray-500 truncate" title={job.LINE_NAME}>
        🏭 {job.LINE_NAME || "—"}
      </p>

      {/* WD TAG */}
      <p className="text-[10px] text-gray-500 truncate" title={job.WD_TAG}>
        🏷 {job.WD_TAG || "—"}
      </p>

      {/* DOC Number */}
      <p className="text-[10px] text-gray-400 truncate font-mono" title={job.DOC_NUMBER}>
        {job.DOC_NUMBER || "—"}
      </p>

      {/* Items count + submitted by */}
      <div className="mt-auto pt-1 border-t border-gray-200 flex justify-between items-center">
        <span className="text-[10px] text-gray-400">{job.ITEM_COUNT ?? 0} items</span>
        {job.SUBMITTED_BY && (
          <span className="text-[10px] text-gray-400 truncate ml-1" title={job.SUBMITTED_BY}>
            👤 {job.SUBMITTED_BY}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Build single-job PDF doc ──────────────────────────────────────────────────
const buildJobDoc = async (jobId) => {
  const res  = await fetch(`/api/job/get-job-value?job_id=${jobId}`);
  const data = await res.json();
  if (data.status !== 200) return null;

  const { jobData, jobItemData } = data;
  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(52, 126, 194);
  doc.rect(0, 0, pageW, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Checklist PM Report", margin, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(jobData.WorkgroupName || "", pageW - margin, 8, { align: "right" });

  let y = 18;
  doc.setTextColor(30, 30, 30);

  // ── Job Info block ───────────────────────────────────────────────────────────
  const infoLeft  = [
    ["Checklist Name", jobData.Name || ""],
    ["Document No.",   jobData.DocumentNo || ""],
    ["Line Name",      jobData.LINE_NAME || ""],
    ["WD TAG",         jobData.WD_TAG || ""],
    ["Version",        jobData.ChecklistVer || ""],
  ];
  const infoRight = [
    ["Status",         jobData.Status || ""],
    ["Submitted By",   jobData.SubmittedBy || ""],
    ["Submitted At",   jobData.SubmitedAt || ""],
    ["Activated By",   jobData.ActivatedBy || ""],
    ["Updated At",     jobData.LastestUpdate || ""],
  ];

  doc.setFontSize(8);
  infoLeft.forEach(([label, val], i) => {
    const rowY = y + i * 6;
    doc.setFont("helvetica", "bold");
    doc.text(label + " :", margin, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(String(val), margin + 32, rowY);
  });
  infoRight.forEach(([label, val], i) => {
    const rowY = y + i * 6;
    const x    = pageW / 2 + 4;
    doc.setFont("helvetica", "bold");
    doc.text(label + " :", x, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(String(val), x + 28, rowY);
  });
  y += infoLeft.length * 6 + 4;

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  // ── Items table ──────────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Checklist Items [${jobItemData.length}]`, margin, y);
  y += 3;

  const tableRows = jobItemData.map((item, idx) => [
    idx + 1,
    item.JobItemTitle || "",
    item.JobItemName?.replace(/\{[^}]*\}/g, "").trim() || "",
    item.UpperSpec != null ? String(item.UpperSpec) : "-",
    item.LowerSpec != null ? String(item.LowerSpec) : "-",
    item.ActualValue != null ? String(item.ActualValue) : "",
    item.Value != null ? String(item.Value) : "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Item Title", "Item Name", "USL", "LSL", "Actual Value", "Value"]],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [52, 126, 194], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 50 },
      3: { cellWidth: 14 },
      4: { cellWidth: 14 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        const val = String(hookData.row.raw[5] || "").toLowerCase();
        const colorMap = {
          pass:         [198, 255, 198],
          ok:           [198, 255, 198],
          good:         [204, 229, 255],
          fail:         [255, 182, 193],
          change:       [255, 227, 153],
          "not change": [255, 239, 204],
          done:         [221, 160, 221],
          check:        [255, 255, 204],
        };
        if (colorMap[val]) hookData.cell.styles.fillColor = colorMap[val];
      }
    },
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageH - 6);
  doc.text(
    `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
    pageW - margin,
    pageH - 6,
    { align: "right" }
  );

  // ── build filename: JOB_NAME + LINE_NAME + datetime ─────────────────────────
  const now       = new Date();
  const pad       = (n) => String(n).padStart(2, "0");
  const datetime  = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const safeName  = (s) => (s || "").replace(/[/\\:*?"<>|]/g, "_").trim();
  const fileName  = `${safeName(jobData.Name)}_${safeName(jobData.LINE_NAME)}_${datetime}`;

  return { doc, docNo: jobData.DocumentNo || jobId, fileName };
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
const generatePDF = async (selectedJobIds) => {
  const today = new Date().toISOString().split("T")[0];

  if (selectedJobIds.length === 1) {
    // ── Single job → download as PDF directly ────────────────────────────────
    const result = await buildJobDoc(selectedJobIds[0]);
    if (!result) throw new Error("Failed to fetch job data");
    result.doc.save(`${result.fileName}.pdf`);

  } else {
    // ── Multiple jobs → generate separate PDFs → pack into ZIP ───────────────
    const JSZip = (await import("jszip")).default;
    const zip   = new JSZip();

    const usedNames = {};
    for (let i = 0; i < selectedJobIds.length; i++) {
      const result = await buildJobDoc(selectedJobIds[i]);
      console.log(`[ZIP] job ${i + 1}/${selectedJobIds.length} id=${selectedJobIds[i]} → ${result ? result.docNo : "FAILED"}`);
      if (!result) continue;
      const pdfBlob = result.doc.output("blob");

      // ── ensure unique filename inside ZIP ────────────────────────────────
      let baseName = result.fileName;
      if (usedNames[baseName] !== undefined) {
        usedNames[baseName] += 1;
        baseName = `${baseName}_${usedNames[baseName]}`;
      } else {
        usedNames[baseName] = 0;
      }
      zip.file(`${baseName}.pdf`, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url     = URL.createObjectURL(zipBlob);
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = `report_${today}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// ── Type_2 Component ──────────────────────────────────────────────────────────
const Type_2 = ({ workgroupOfUser }) => {

  // ── dates ──────────────────────────────────────────────────────────────────
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultStart = yesterday.toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultEnd = tomorrow.toISOString().split("T")[0];

  const [startDate, setStartDate]             = useState(defaultStart);
  const [endDate, setEndDate]                 = useState(defaultEnd);
  const [workgroupSelect, setWorkgroupSelect] = useState(workgroupOfUser?.workgroup || "");
  const [fetchEnabled, setFetchEnabled]       = useState(false);
  const [refresh, setRefresh]                 = useState(false);
  const [workgroups, setWorkgroups]           = useState([]);
  const [searchName, setSearchName]           = useState("");
  const [searchLine, setSearchLine]           = useState("");

  // ── Select mode ────────────────────────────────────────────────────────────
  const [selectMode, setSelectMode]           = useState(false);
  const [selectedIds, setSelectedIds]         = useState([]);
  const [exporting, setExporting]             = useState(false);

  // ── useFetchReport2 ────────────────────────────────────────────────────────
  const { report = [], isLoading } = useFetchReport2(
    refresh, startDate, endDate, workgroupSelect, fetchEnabled
  );

  // sync workgroup เมื่อ workgroupOfUser โหลดเสร็จ
  useEffect(() => {
    if (workgroupOfUser?.workgroup && !workgroupSelect) {
      setWorkgroupSelect(workgroupOfUser.workgroup);
    }
  }, [workgroupOfUser]);

  // ── fetch workgroups ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkgroups = async () => {
      try {
        const res  = await fetch("/api/workgroup/get-workgroups");
        const data = await res.json();
        setWorkgroups(data.workgroups || []);
      } catch (err) {
        console.error("fetchWorkgroups:", err);
      }
    };
    fetchWorkgroups();
  }, []);

  // ── jobs ───────────────────────────────────────────────────────────────────
  const jobs = useMemo(() => {
    if (!Array.isArray(report) || report.length === 0) return [];
    return report.map((j) => ({ ...j, key: j._id || j.DOC_NUMBER + j.LINE_NAME }));
  }, [report]);

  // ── local filter ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q1 = searchName.toLowerCase();
    const q2 = searchLine.toLowerCase();
    return jobs.filter((j) => {
      const matchName = q1 ? (j.JOB_NAME   || "").toLowerCase().includes(q1) : true;
      const matchLine = q2 ? (j.LINE_NAME  || "").toLowerCase().includes(q2) : true;
      return matchName && matchLine;
    });
  }, [jobs, searchName, searchLine]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setFetchEnabled(true);
    setRefresh((prev) => !prev);
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleJob = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = () => {
    const allIds = filtered.map((j) => j._id).filter(Boolean);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    try {
      await generatePDF(selectedIds);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert(`Export PDF failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const maxDateStr = defaultEnd;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((j) => selectedIds.includes(j._id));

  return (
    <div className="bg-white rounded-lg p-3 flex flex-col gap-4">

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Start Date</label>
          <input
            type="date" max={maxDateStr} value={startDate} disabled={isLoading}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">End Date</label>
          <input
            type="date" max={maxDateStr} value={endDate} disabled={isLoading}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Workgroup */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Workgroup</label>
          <select
            disabled={isLoading}
            onChange={(e) => setWorkgroupSelect(e.target.value)}
            className="border border-gray-300 rounded-md py-1.5 px-2 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {workgroupOfUser?.workgroup && (
              <option value={workgroupOfUser.workgroup}>{workgroupOfUser.workgroup}</option>
            )}
            {workgroups
              .filter((w) => w.WORKGROUP_NAME !== workgroupOfUser?.workgroup)
              .map((w) => (
                <option key={w.WORKGROUP_NAME} value={w.WORKGROUP_NAME}>
                  {w.WORKGROUP_NAME}
                </option>
              ))}
          </select>
        </div>

        {/* Checklist Name search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Checklist Name</label>
          <input
            type="text" value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded-md py-1.5 px-2 text-sm w-36"
          />
        </div>

        {/* Line Name search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Line Name</label>
          <input
            type="text" value={searchLine}
            onChange={(e) => setSearchLine(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded-md py-1.5 px-2 text-sm w-36"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch} disabled={isLoading}
          className="self-end bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-bold px-5 py-1.5 rounded-md shadow text-sm transition"
        >
          {isLoading ? "Loading..." : "Search Data"}
        </button>
      </div>

      {/* ── Toolbar (Select / Export) ─────────────────────────────────────── */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">

          {/* Select toggle */}
          <button
            onClick={toggleSelectMode}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold border transition
              ${selectMode
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-600 border-blue-400 hover:bg-blue-50"}`}
          >
            {selectMode ? "✓ Selecting..." : "Select"}
          </button>

          {/* Select All (in select mode) */}
          {selectMode && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-1.5 rounded-md text-sm font-semibold border border-gray-400
                         text-gray-700 hover:bg-gray-100 transition"
            >
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </button>
          )}

          {/* Export PDF (when items selected) */}
          {selectMode && selectedIds.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-1.5 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-700
                         text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting
                ? `Exporting ${selectedIds.length} job(s)...`
                : selectedIds.length === 1
                  ? `📄 Export PDF (1)`
                  : `🗜️ Export ZIP (${selectedIds.length})`}
            </button>
          )}

          {/* Result count */}
          <span className="text-xs text-gray-500 ml-auto">
            แสดง <span className="font-semibold text-gray-700">{filtered.length}</span> / {jobs.length} รายการ
          </span>
        </div>
      )}

      {/* ── Card Grid ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {isLoading && (
          <div className="w-full flex justify-center py-10 text-gray-400 animate-pulse text-sm">
            กำลังโหลดข้อมูล...
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="w-full flex justify-center py-10 text-gray-400 text-sm">
            {jobs.length === 0 ? "กด Search Data เพื่อดึงข้อมูล" : "ไม่พบข้อมูลที่ค้นหา"}
          </div>
        )}

        {!isLoading && filtered.map((job) => (
          <JobCard
            key={job.key}
            job={job}
            selectMode={selectMode}
            selected={selectedIds.includes(job._id)}
            onToggle={toggleJob}
          />
        ))}
      </div>

    </div>
  );
};

export default Type_2;
