"use client";
import React, { useState, useEffect, useMemo } from "react";
import SearchIcon from "@mui/icons-material/Search";

const TableComponent = ({
  headers = [],
  datas = [],
  searchColumn,
  filterColumn,
  filterColumn1,
  TableName,
  PageSize,
  searchHidden = null,       // (ยังไม่ใช้ แต่คงไว้ตามเดิม)
  linenameOnSelect = null,   // (ยังไม่ใช้ แต่คงไว้ตามเดิม)
  currentPage,
  onPageChange,
  disablePageSize,
  disableFilter,
  refreshEvent,
  isLoading,
 // handleSelectProfileGroup,
}) => {

  //console.log('refreshEvent',refreshEvent);
  // -------------------- State --------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(PageSize || 5);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedFilter1, setSelectedFilter1] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  //currentPage=1;
  // -------------------- Cookie Helpers (ผูกกับ TableName) --------------------
  const cookieKey = `rows_${TableName || "default"}`;

  const setRowsVisible = (rows) => {
    try {
      document.cookie = `${cookieKey}=${rows}; path=/; max-age=31536000`; // 1 ปี
    } catch(err) {
       console.error("📄 Stack trace:\n", err.stack);
      console.error(err);
    }
  };

  const getRowsVisible = () => {
    try {
      const cookies = document.cookie.split(";");
      for (const c of cookies) {
        const cookie = c.trim();
        if (cookie.startsWith(`${cookieKey}=`)) {
          return cookie.substring(cookieKey.length + 1);
        }
      }
    } catch(err) {
           console.error("📄 Stack trace:\n", err.stack);
         console.error(err);
    }
    return 5;
  };

  // -------------------- Init from cookie --------------------
  useEffect(() => {
    const rowsVisible = getRowsVisible();
    const n = Number(rowsVisible);
    if (!Number.isNaN(n) && n > 0) setPageSize(n);
  }, []); // run once

  // -------------------- Unique filter options --------------------
  const uniqueFilterOptions = useMemo(() => {
    if (!Array.isArray(datas) || !filterColumn) return [];
    return Array.from(new Set(datas.map((it) => it?.[filterColumn]))).filter(Boolean);
  }, [datas, filterColumn]);

  //console.log('uniqueFilterOptions.',uniqueFilterOptions);
  //console.log('filterColumn1',filterColumn);
  
  const uniqueFilterOptions1 = useMemo(() => {
    if (!Array.isArray(datas) || !filterColumn1) return [];
    return Array.from(new Set(datas.map((it) => it?.[filterColumn1]))).filter(Boolean);
  }, [datas, filterColumn1]);

  //console.log('uniqueFilterOptions1.',uniqueFilterOptions1);  
  // -------------------- Sorting --------------------
  const sortedData = useMemo(() => {
    const data = Array.isArray(datas) ? datas : [];
    if (!sortConfig.key) return data;
    const order = sortConfig.direction === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
      const va = a?.[sortConfig.key];
      const vb = b?.[sortConfig.key];

      // แปลงเป็นสตริงเพื่อเลี่ยง crash จากชนิดข้อมูล
      const sa = String(va ?? "");
      const sb = String(vb ?? "");

      if (sa < sb) return -1 * order;
      if (sa > sb) return 1 * order;
      return 0;
    });
  }, [datas, sortConfig]);

  // -------------------- Search --------------------
  const afterSearch = useMemo(() => {
    if (!Array.isArray(sortedData) || sortedData.length === 0) return [];
    if (!searchColumn) return sortedData;

    const q = String(searchTerm ?? "").toLowerCase();
    return sortedData.filter((item) => {
      const v = String(item?.[searchColumn] ?? "").toLowerCase();
      return v.includes(q);
    });
  }, [sortedData, searchColumn, searchTerm]);

  // -------------------- Filters (2 ช่อง) --------------------
  const finalFilteredData = useMemo(() => {
    if (!Array.isArray(afterSearch) || afterSearch.length === 0) return [];
    return afterSearch
      .filter((item) =>
        selectedFilter ? item?.[filterColumn] === selectedFilter : true
      )
      .filter((item) =>
        selectedFilter1 ? item?.[filterColumn1] === selectedFilter1 : true
      );
  }, [afterSearch, selectedFilter, selectedFilter1, filterColumn, filterColumn1]);
  
  // console.log('finalFilteredData',finalFilteredData);

  // -------------------- Pagination --------------------
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const totalPages = Math.max(1, Math.ceil(finalFilteredData.length / safePageSize));

  // ถ้า currentPage เกินจากจำนวนหน้าใหม่ ให้ย้ายกลับเข้าขอบเขต
  useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
    }
    if (currentPage < 1) {
      onPageChange(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * safePageSize;
    const end = currentPage * safePageSize;
    return finalFilteredData.slice(start, end);
  }, [finalFilteredData, currentPage, safePageSize]);
  
 // console.log('currentPage',currentPage);
  //console.log('currentPageData.',currentPageData);
  // -------------------- Handlers --------------------
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onPageChange(1);
  };

  const handlePageSizeChange = (e) => {
    const n = Math.max(1, Number(e.target.value) || 1);
    setPageSize(n);
    onPageChange(1);
    setRowsVisible(n);
  };

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
    onPageChange(1);
  };

  const handleFilterChange1 = (e) => {
    setSelectedFilter1(e.target.value);
    onPageChange(1);
    //handleSelectProfileGroup(e.target.value);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const goToPage = (page) => {
    if (typeof page !== "number") return; // กันกด “...”
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  // -------------------- Page numbers (มี “...”) --------------------
  const generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
    const pageNumbers = [];
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage <= half) {
      end = Math.min(totalPages, maxVisible);
    } else if (currentPage + half >= totalPages) {
      start = Math.max(1, totalPages - maxVisible + 1);
    }

    if (start > 1) {
      pageNumbers.push(1);
      if (start > 2) pageNumbers.push("...");
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  // สำหรับ mobile dropdown ให้เป็นตัวเลขล้วน
  const allPageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  // -------------------- Render --------------------
  return (
    <div className="flex flex-col justify-center gap-5 items-center relative w-full">
      {/* Controls */}
      <div
        className="flex flex-row flex-wrap justify-start items-center w-full my-4 gap-2 text-left"
        style={{ display: disableFilter && disablePageSize ? "none" : "" }}
      >
        <div className="flex flex-row gap-2 text-left max-w-full w-full">
          {/* Rows */}
          <div
            className="max-w-[20vw] inline-block pr-6"
            style={{ visibility: disablePageSize ? "hidden" : "visible" }}
          >
            <div>Rows : </div>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="mx-2 p-2 border rounded-md flex-shrink-0 max-w-[100%] inline-block"
              id="table-rows-num"
            >
              {[5, 10, 15, 20, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Filter #1 */}
          {filterColumn && (
            <div className="max-w-[250px] inline-block pr-6">
              <div>Line Name : </div>
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-md p-2 flex-shrink-0 max-w-[200px]"
              >
                <option value="">All</option>
                {uniqueFilterOptions.map((option, idx) => (
                  <option key={`${filterColumn}-${idx}`} value={option}>
                    {String(option ?? "")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter #2 */}
          {filterColumn1 && (
            <div className="max-w-[350px] inline-block">
              <div>Profile Group : </div>
              <select
                value={selectedFilter1}
                onChange={handleFilterChange1}
                className="border border-gray-300 rounded-md p-2 flex-shrink-0 max-w-[200px]"
              >
                <option value="">All</option>
                {uniqueFilterOptions1.map((option, idx) => (
                  <option key={`${filterColumn1}-${idx}`} value={option}>
                    {String(option ?? "")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div
            className="relative mx-2 md:w-auto flex-shrink-0 max-w-[200px] inline-block ml-auto"
            style={{ visibility: disableFilter ? "hidden" : "visible" }}
          >
            <input
              className="border border-gray-300 rounded-md p-2 pl-9 pr-4 max-w-[150px]"
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <SearchIcon className="absolute left-2 top-2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-white rounded-lg font-sans flex flex-col justify-center items-start overflow-x-auto shadow-md">
        <h1 className="p-2 text-sm text-secondary font-bold">
          {TableName || "Table Name"}
        </h1>

        <table className="table-auto w-full text-[12px] ipadmini:text-sm">
          <thead className="bg-[#347EC2] text-white text-sm">
            <tr>
              {headers.map((headerKey) => (
                <th
                  key={headerKey}
                  className="px-2 py-2 cursor-pointer"
                  onClick={() => handleSort(headerKey)}
                  title={`Sort by ${headerKey}`}
                >
                  {headerKey}
                  {sortConfig.key === headerKey
                    ? sortConfig.direction === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-center">
            {currentPageData.map((item, rowIdx) => (
              <tr
                key={item?.ID ?? item?.id ?? `${TableName || "T"}-row-${rowIdx}`}
                className="hover:shadow-lg bg-white h-16 border-b border-solid border-[#C6C6C6] hover:bg-gray-100 font-bold"
              >
                {headers.map((headerKey, colIdx) => (
                  <td key={`${rowIdx}-${headerKey}`} className="px-4 py-3">
                    {item?.[headerKey] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}           
            {/* ไม่มีข้อมูล */}
            {currentPageData.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-gray-500">
                  ....
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {/* Prev */}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded disabled:opacity-50 transition duration-300"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          Prev
        </button>

        {/* Page numbers (desktop) */}
        {/* หมายเลขหน้า (แสดงเฉพาะจอใหญ่) */}
        <div className="hidden sm:flex gap-2">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`py-2 px-4 rounded-lg font-semibold transition duration-300 ${
                currentPage == page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-blue-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Page dropdown (mobile) */}
        <select
          className="sm:hidden border rounded px-3 py-2 bg-gray-200 hover:bg-gray-300 transition duration-300"
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
        >
          {allPageNumbers.map((page) => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>

        {/* Next */}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded disabled:opacity-50 transition duration-300"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TableComponent;
