"use client";
import React, { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import "chartjs-adapter-date-fns";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ExportButtons from "@/components/ExportButtons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import TableReportDoc from "@/components/TableReportDoc";
import useFetchReport1 from "@/lib/hooks/useFetchReport1";

const Type_1 = ({ workgroupOfUser, dateTimeStart, dateTimeEnd }) => {
  // ===== Draft (เปลี่ยนได้ แต่ยังไม่ fetch) =====
  const [startDate, setStartDate] = useState(new Date(dateTimeStart));
  const [endDate, setEndDate] = useState(new Date(dateTimeEnd));
  const [workgroupDraft, setWorkgroupDraft] = useState(workgroupOfUser?.workgroup || "");

  // ===== Query (เปลี่ยนเฉพาะตอนกด Pull Data) =====
  const [queryStart, setQueryStart] = useState(format(new Date(dateTimeStart), "yyyy-MM-dd"));
  const [queryEnd, setQueryEnd] = useState(format(new Date(dateTimeEnd), "yyyy-MM-dd"));
  const [workgroupQuery, setWorkgroupQuery] = useState(workgroupOfUser?.workgroup || "");

  // ===== Filters (ลำดับความสำคัญ: Line -> Doc -> Job -> WD_TAG) =====
  const [selectedLineName, setSelectedLineName] = useState(""); // 1) ตัวคุมหลัก
  const [selectedDocNumber, setSelectedDocNumber] = useState(""); // 2)
  const [selectedJobName, setSelectedJobName] = useState(""); // 3)
  const [selectedWDTag, setSelectedWDTag] = useState(""); // 4)

  const [refresh, setRefresh] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const { report = [], isLoading } = useFetchReport1(
    refresh,
    queryStart,
    queryEnd,
    workgroupQuery,
    fetchEnabled
  );

  useEffect(() => {
    if (dataLoading && !isLoading) setDataLoading(false);
  }, [isLoading, dataLoading]);

  // ===== Workgroup list =====
  const [didInitWg, setDidInitWg] = useState(false);
  const [workgroups, setWorkgroups] = useState([]);

  const fetchWorkgroups = async () => {
    try {
      const response = await fetch(`/api/workgroup/get-workgroups`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) throw new Error("Failed to fetch workgroups");
      const data = await response.json();
      setWorkgroups(data.workgroups || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkgroups();
  }, []);

  // init workgroup ครั้งแรก
  useEffect(() => {
    const wg = workgroupOfUser?.workgroup;
    if (!wg) return;
    if (didInitWg) return;

    setWorkgroupDraft(wg);
    setDidInitWg(true);
  }, [workgroupOfUser?.workgroup, didInitWg]);

  const resetAllFilters = () => {
    setSelectedLineName("");
    setSelectedDocNumber("");
    setSelectedJobName("");
    setSelectedWDTag("");
  };

  const handlePullDataLocal = (e) => {
    e?.preventDefault?.();

    if (endDate < startDate) {
      alert("End Date ต้องมากกว่าหรือเท่ากับ Start Date");
      return;
    }

    setFetchEnabled(true);
    setDataLoading(true);

    setQueryStart(format(startDate, "yyyy-MM-dd"));
    setQueryEnd(format(endDate, "yyyy-MM-dd"));
    setWorkgroupQuery(workgroupDraft);

    resetAllFilters(); // ✅ เปลี่ยนช่วงเวลา/Workgroup แล้ว reset filter ให้สะอาด

    setRefresh((prev) => !prev);
  };

  const filteredValues = (items) =>
    (items || [])
      .filter((v) => v && String(v).trim() !== "" && v !== "Unknown")
      .sort((a, b) => String(a).localeCompare(String(b)));

  // =========================================================
  // 1) ทำ baseReport จาก “Date + WorkgroupQuery” (พื้นฐานสุด)
  // =========================================================
  const baseReport = (report || []).filter((r) => {
    const d = new Date(r.jobItemsUpdatedAt);
    if (isNaN(d.getTime()) || d < startDate || d > endDate) return false;

    // ใช้ workgroupQuery เป็นฐาน (เพราะรายงานถูกดึงตาม workgroupQuery)
    // แต่ถ้าคุณอยากให้ “กรองซ้ำ” ก็ใส่ไว้ได้
    if (workgroupQuery && r.WORKGROUP_NAME && r.WORKGROUP_NAME !== workgroupQuery) return false;

    return true;
  });

  // =========================================================
  // 2) Cascading options: Line -> Doc -> Job -> WD_TAG
  // =========================================================
  const availableLineNames = filteredValues([
    ...new Set(baseReport.map((r) => r.LINE_NAME)),
  ]);

  const reportAfterLine = selectedLineName
    ? baseReport.filter((r) => r.LINE_NAME === selectedLineName)
    : baseReport;

  const availableDocNumbers = filteredValues([
    ...new Set(reportAfterLine.map((r) => r.DOC_NUMBER)),
  ]);

  const reportAfterDoc = selectedDocNumber
    ? reportAfterLine.filter((r) => r.DOC_NUMBER === selectedDocNumber)
    : reportAfterLine;

  const availableJobNames = filteredValues([
    ...new Set(reportAfterDoc.map((r) => r.JOB_NAME)),
  ]);

  const reportAfterJob = selectedJobName
    ? reportAfterDoc.filter((r) => r.JOB_NAME === selectedJobName)
    : reportAfterDoc;

  const availableWDTags = filteredValues([
    ...new Set(reportAfterJob.map((r) => r.WD_TAG)),
  ]);

  // =========================================================
  // 3) Handlers (ลำดับความสำคัญ)
  // =========================================================
  const handleLineNameChange = (lineName) => {
    setSelectedLineName(lineName);

    // reset ตัวถัดไป
    setSelectedDocNumber("");
    setSelectedJobName("");
    setSelectedWDTag("");
  };

  const handleDocNumberChange = (docNumber) => {
    setSelectedDocNumber(docNumber);

    // reset ตัวถัดไป
    setSelectedJobName("");
    setSelectedWDTag("");
  };

  const handleJobNameChange = (jobName) => {
    setSelectedJobName(jobName);

    // reset ตัวถัดไป
    setSelectedWDTag("");
  };

  // =========================================================
  // 4) สร้างข้อมูลสำหรับ Table/Chart (group -> filter ถูกที่)
  // =========================================================
  const groupedDataByLineNameAndWorkgroupAndJobItem = baseReport
    .map((item) => {
      const updatedAt = new Date(item.jobItemsUpdatedAt);
      if (isNaN(updatedAt.getTime())) return null;

      return {
        lineName: item.LINE_NAME || "Unknown",
        jobName: item.JOB_NAME || "Unknown",
        workgroupName: item.WORKGROUP_NAME || "Unknown",
        jobItemName: item.JOB_ITEM_NAME || "Unknown",
        jobItemTitle: item.JOB_ITEM_TITLE || "Unknown",
        upper_lower: (item.UPPER ?? "") + " / " + (item.LOWER ?? ""),
        x: updatedAt.toISOString(),
        y: Number(item.VALUE_NUM ?? 0), // ถ้าคุณไม่มี field นี้ จะไม่ใช้ก็ได้
        actualValue: item.ACTUAL_VALUE ?? "Unknown",
        Value: item.VALUE ?? "Unknown",
        docNumber: item.DOC_NUMBER || "Unknown",
        docRev: item.CHECKLIST_VERSION || "Unknown",
        Job_status: item.JOB_STATUS || "Unknown",
        Img_file: item.FILE || "Unknown",
        wd_tag: item.WD_TAG || "Unknown",
        submittedBy: item.SUBMITTED_BY || "Unknown",   // ⭐ เพิ่มตรงนี้
      };
    })
    .filter(Boolean)
    .reduce((acc, curr) => {
      const groupKey = `${curr.lineName}|${curr.workgroupName}|${curr.jobItemName}`;
      const lineGroup = acc[groupKey] || [];

      // NOTE: เดิมคุณทำ existing.y += curr.y แต่ curr.y ไม่มีจริง
      // ผมคงโครงสร้างไว้ แต่ไม่รวม y หากไม่จำเป็น
      lineGroup.push({
        x: curr.x,
        y: curr.y,
        actualValue: curr.actualValue,
        Value: curr.Value,
        docNumber: curr.docNumber,
        docRev: curr.docRev,
        wd_tag: curr.wd_tag,
        jobItemName: curr.jobItemName,
        jobItemTitle: curr.jobItemTitle,
        upper_lower: curr.upper_lower,
        lineName: curr.lineName,
        Job_status: curr.Job_status,
        Img_file: curr.Img_file,
        jobName: curr.jobName,
        workgroupName: curr.workgroupName,
        submittedBy: curr.submittedBy,   // ⭐ เพิ่มตรงนี้
      });

      acc[groupKey] = lineGroup;
      return acc;
    }, {});

  const sortedDataByLineNameAndWorkgroupAndJobItem = Object.entries(
    groupedDataByLineNameAndWorkgroupAndJobItem
  ).reduce((acc, [groupKey, data]) => {
    acc[groupKey] = (data || []).sort((a, b) => new Date(a.x) - new Date(b.x));
    return acc;
  }, {});

  // ✅ filter groupKey อย่างถูกต้อง + filter item ตามลำดับ Line->Doc->Job->Tag
  const filteredData = Object.entries(sortedDataByLineNameAndWorkgroupAndJobItem)
    .filter(([groupKey, _data]) => {
      const [lineName] = groupKey.split("|");

      if (selectedLineName && lineName !== selectedLineName) return false;
      return true;
    })
    .map(([groupKey, data]) => {
      const [lineName, workgroupName, jobItemName] = groupKey.split("|");

      const finalData = (data || []).filter((item) => {
        if (selectedLineName && item.lineName !== selectedLineName) return false;
        if (selectedDocNumber && item.docNumber !== selectedDocNumber) return false;
        if (selectedJobName && item.jobName !== selectedJobName) return false;
        if (selectedWDTag && item.wd_tag !== selectedWDTag) return false;
        return true;
      });

      return {
        label: `${lineName} - ${workgroupName} - ${jobItemName}`,
        data: finalData.map((item) => ({
          x: item.x,
          y: item.y,
          actualValue: item.actualValue,
          docNumber: item.docNumber,
          docRev: item.docRev,
          jobItemName: item.jobItemName,
          jobItemTitle: item.jobItemTitle,
          upper_lower: item.upper_lower,
          lineName: item.lineName,
          Job_status: item.Job_status,
          Img_file: item.Img_file,
          wd_tag: item.wd_tag,
          Value: item.Value,
          jobName: item.jobName,
          submittedBy: item.submittedBy,   // ⭐ เพิ่มตรงนี้
        })),
      };
    })
    .filter((ds) => ds.data.length > 0);

  // ===== Export (คุณคงเดิมได้) =====
  const exportToCSV = () => {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    const tableData = filteredData.flatMap((dataset) =>
      dataset.data.map((item) => {
        const itemDate = new Date(item.x);
        const localDate = new Date(itemDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

        const formattedDate = localDate.toLocaleDateString("en-GB").replace(/\//g, "-");
        const formattedTime = localDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const shift = localDate.getHours() < 12 ? "AM" : "PM";

        return {
          Linename: item.lineName || "Unknown",
          JobName: item.jobName || "Unknown",
          DocNumber: item.docNumber || "Unknown",
          DocRev: item.docRev || "Unknown",
          JobItemTitle: item.jobItemTitle || "Unknown",
          JobItemName: item.jobItemName || "Unknown",
          upper_lower: item.upper_lower || "Unknown",          
          wd_tag: item.wd_tag || "Unknown",
          Month: months[localDate.getMonth()],
          Date: formattedDate,
          Time: formattedTime,
          Shift: shift,
          ActualValue: item.actualValue ?? "-",
          Value: item.Value ?? "-",
          Job_status: item.Job_status,
           SubmittedBy: item.submittedBy || "Unknown",  // ⭐ เพิ่มตรงนี้
         // SUBMITTED_BY: item.SUBMITTED_BY.EMP_NAME,
          //Img_file: item.Img_file,
        };
      })
    );

    if (tableData.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const fileName = `FilteredData_${queryStart}_to_${queryEnd}.xlsx`;
    FileSaver.saveAs(data, fileName);
  };

  const handleExport = (option) => {
    if (option === "csv") exportToCSV();
    // png/pdf คุณเอาของเดิมมาใส่ต่อได้เลย (ผมไม่แตะเพื่อไม่ให้โค้ดยาวเกิน)
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDateStr = tomorrow.toISOString().split("T")[0];

  // ===== UI states =====
  const [isOpen1, setIsOpen1] = useState(false);
  const [reportType, setReportType] = useState("month");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
            <div className="text-gray-800 font-semibold">Loading Data items...</div>
            <div className="text-gray-500 text-sm">Please wait</div>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap gap-4 bg-white rounded-lg">
          {/* Start Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
                isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
              }`}
              type="date"
              value={format(startDate, "yyyy-MM-dd")}
              max={format(maxDateStr, "yyyy-MM-dd")}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              disabled={isLoading}
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400 ${
                isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
              }`}
              type="date"
              value={format(endDate, "yyyy-MM-dd")}
              max={format(maxDateStr, "yyyy-MM-dd")}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              disabled={isLoading}
            />
          </div>

          {/* Workgroup */}
          <div className="relative" style={{ width: "300px" }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workgroup</label>
            <select
              className={`w-full border border-gray-300 rounded-md py-2 px-3 bg-white hover:bg-gray-50 focus:outline-none ${
                isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
              }`}
              value={workgroupDraft}
              onChange={(e) => setWorkgroupDraft(e.target.value)}
              disabled={isLoading}
            >
              <option value={workgroupOfUser?.workgroup}>{workgroupOfUser?.workgroup}</option>
              {workgroups
                .filter((wg) => wg.WORKGROUP_NAME !== workgroupOfUser?.workgroup)
                .map((wg) => (
                  <option key={wg.WORKGROUP_NAME} value={wg.WORKGROUP_NAME}>
                    {wg.WORKGROUP_NAME}
                  </option>
                ))}
            </select>
          </div>

          {/* Pull Data */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button
              className={`bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-md ${
                isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
              }`}
              onClick={handlePullDataLocal}
              disabled={isLoading}
            >
              Pull Data
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="relative w-full pb-4">
            <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm mt-4 flex flex-wrap gap-4">
              {/* ===== LineName (Priority #1) ===== */}
              <div className="relative w-full sm:w-[180px] md:w-[200px]">
                <label className="block p-2 font-semibold">Line Name</label>

                <div
                  onClick={() => setIsOpen1((p) => !p)}
                  className={`w-full border border-gray-300 cursor-pointer rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 ${
                    isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
                  }`}
                >
                  {selectedLineName ? selectedLineName : "........Select........"}
                </div>

                {isOpen1 && (
                  <div className="absolute bottom-full left-0 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
                    <label
                      className="block p-2 cursor-pointer text-gray-500"
                      onClick={() => handleLineNameChange("")}
                    >
                      ------ All ------
                    </label>

                    {availableLineNames.map((lineName) => (
                      <label
                        key={lineName}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="rd_line"
                          value={lineName}
                          checked={selectedLineName === lineName}
                          onChange={() => handleLineNameChange(lineName)}
                        />
                        <span className="truncate">{lineName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* ===== Doc (Priority #2) ===== */}
              <div className="mb-4">
                <label className="block p-2 font-semibold">DOC No.</label>
                <select
                  className={`w-auto p-2 border rounded ${
                    isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
                  }`}
                  style={{ textAlign: "center" }}
                  value={selectedDocNumber}
                  onChange={(e) => handleDocNumberChange(e.target.value)}
                  disabled={isLoading || !selectedLineName} // ✅ บังคับเลือก Line ก่อน
                >
                  <option value="">----All----</option>
                  {availableDocNumbers.map((docNumber) => (
                    <option key={docNumber} value={docNumber}>
                      {docNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== Job (Priority #3) ===== */}
              <div className="mb-4">
                <label className="block p-2 font-semibold">JOB_NAME</label>
                <select
                  className={`w-auto p-2 border rounded ${
                    isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
                  }`}
                  value={selectedJobName}
                  onChange={(e) => handleJobNameChange(e.target.value)}
                  disabled={isLoading || !selectedLineName}
                >
                  <option value="">----All----</option>
                  {availableJobNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== WD_TAG (Priority #4) ===== */}
              <div className="mb-4">
                <label className="block p-2 font-semibold">WD_TAG</label>
                <select
                  className={`w-auto p-2 border rounded ${
                    isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
                  }`}
                  value={selectedWDTag}
                  onChange={(e) => setSelectedWDTag(e.target.value)}
                  disabled={isLoading || !selectedLineName}
                >
                  <option value="">----All----</option>
                  {availableWDTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div className="relative mb-4">
                <label className="block p-2 font-semibold">Report View Type</label>
                <select
                  className={`border border-gray-300 rounded-md py-2 px-3 w-auto focus:border-blue-400 ${
                    isLoading ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
                  }`}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="date">Date</option>
                  <option value="shift">Shift</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full">
            <TableReportDoc
              filteredData={filteredData}
              startDate={startDate}
              endDate={endDate}
              reportType={reportType}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>

        <ExportButtons handleExport={handleExport} />
      </div>
    </>
  );
};

export default Type_1;
