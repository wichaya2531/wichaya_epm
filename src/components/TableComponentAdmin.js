"use client";
import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";

const TableComponentAdmin = ({
  headers,
  datas,
  searchColumn,
  filterColumn,
  TableName,
  PageSize,
  searchHidden = null,
  linenameOnSelect = null,
  onPageChange,
  selectedJobs,
  handleSelectAllJobs,
  handleDeleteSelected,
  filteredJobs,
}) => {
  setTimeout(() => {
    var rowsVisible = getRowsVisible();
    try {
      setPageSize(Number(rowsVisible));
    } catch (error) {}
  }, 1000);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(PageSize || 5);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" }); // ใช้สำหรับเก็บสถานะการจัดเรียง

  const data = datas;

  // ฟังก์ชันสำหรับจัดเรียงข้อมูล
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const order = sortConfig.direction === "asc" ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * order;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * order;
      return 0;
    });
  }, [data, sortConfig]);

  const filteredData =
    sortedData && sortedData.length > 0
      ? sortedData.filter((item) =>
          searchColumn
            ? item[searchColumn]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
            : item
        )
      : [];

  const finalFilteredData =
    filteredData && filteredData.length > 0
      ? selectedFilter
        ? filteredData.filter((item) => item[filterColumn] === selectedFilter)
        : filteredData
      : [];

  let uniqueFilterOptions = [];
  if (Array.isArray(data) && filterColumn) {
    uniqueFilterOptions = Array.from(
      new Set(data.map((item) => item[filterColumn]))
    ).filter(Boolean);
  }

  const totalPages = Math.ceil(finalFilteredData.length / pageSize);
  const currentPageData = finalFilteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    try {
      onPageChange(page);
    } catch (error) {}
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
    setRowsVisible(event.target.value);
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const setRowsVisible = (rows) => {
    document.cookie = `rows=${rows}; path=/; max-age=31536000`; // 1 year
  };

  const getRowsVisible = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith("rows=")) {
        return cookie.substring(5, cookie.length);
      }
    }
    return 5;
  };

  return (
    <div className="flex flex-col justify-center gap-5 items-center relative">
      <div className="flex flex-row flex-wrap justify-start items-center w-full my-4 gap-2 text-left">
        <div className="flex flex-row gap-2 text-left max-w-full">
          <div className="max-w-[20vw] inline-block">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="mx-2 p-2 border rounded-md flex-shrink-0 max-w-[100%] inline-block"
              id="table-rows-num"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {filterColumn && (
            <div className="max-w-[250px] inline-block">
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-md p-2 flex-shrink-0 max-w-[200px]"
              >
                <option value="">All</option>
                {uniqueFilterOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <div className="relative mx-2 md:w-auto flex-shrink-0 max-w-[200px] inline-block ml-auto">
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

      <div className="w-full bg-white rounded-lg font-sans flex flex-col justify-center items-start overflow-x-auto shadow-md">
        {/* ห่อหัวตารางด้วย flex */}
        <div className="w-full flex justify-between items-center">
          <h1 className="text-sm text-secondary font-bold p-2">
            {TableName || "Table Name"}
          </h1>

          {/* ปุ่ม Select All และ Remove Selected */}
          <div className="flex items-center space-x-4 p-2 rounded-lg ">
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                onChange={handleSelectAllJobs}
                checked={
                  selectedJobs.length === filteredJobs.length &&
                  filteredJobs.length > 0
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
              />
              <label className="text-gray-800 pr-2 font-medium text-sm md:text-base">
                Select All
              </label>
            </div>

            {/* Remove Selected Button */}
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDeleteSelected}
              disabled={selectedJobs.length === 0}
            >
              <DeleteIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <table className="table-auto w-full text-[12px] ipadmini:text-sm">
          <thead className="bg-[#347EC2] text-white text-sm">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-2 py-2 cursor-pointer"
                  onClick={() => handleSort(header)}
                >
                  {header}
                  {sortConfig.key === header
                    ? sortConfig.direction === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {currentPageData.map((item) => (
              <tr
                key={item.ID}
                className="hover:shadow-lg bg-white h-16 border-b border-solid border-[#C6C6C6] hover:bg-gray-100 font-bold"
              >
                {Object.keys(item).map((key) => (
                  <td key={`${item.id}-${key}`} className="px-4 py-3">
                    {item[key] ? item[key] : "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 cursor-pointer"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          Prev
        </button>
        <span className="p-5">{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TableComponentAdmin;
