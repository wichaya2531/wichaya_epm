"use client";
import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";

const TableComponent = ({
  headers,
  datas,
  searchColumn,
  filterColumn,
  TableName,
  PageSize,
  searchHidden = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(PageSize || 5);
  const [selectedFilter, setSelectedFilter] = useState("");

  const data = datas;

  // ฟิลเตอร์ข้อมูลตาม searchTerm
  const filteredData =
    data && data.length > 0
      ? data.filter((item) =>
          searchColumn
            ? item[searchColumn]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
            : item
        )
      : [];

  // ฟิลเตอร์ข้อมูลตาม selectedFilter
  const finalFilteredData =
    filteredData && filteredData.length > 0
      ? selectedFilter
        ? filteredData.filter((item) => item[filterColumn] === selectedFilter)
        : filteredData
      : [];

  // ตั้งค่าเริ่มต้นให้ uniqueFilterOptions เป็น array ว่าง
  let uniqueFilterOptions = [];

  // ตรวจสอบว่า data เป็น Array และ filterColumn มีค่า
  if (Array.isArray(data) && filterColumn) {
    // สร้างตัวเลือกสำหรับ filterColumn จากข้อมูลที่มีอยู่
    uniqueFilterOptions = Array.from(
      new Set(data.map((item) => item[filterColumn]))
    ).filter(Boolean); // ใช้ filter(Boolean) เพื่อลบค่า null หรือ undefined
  } else {
    console.error("Data is not valid or filterColumn is undefined");
  }

  const totalPages = Math.ceil(finalFilteredData.length / pageSize);
  const currentPageData = finalFilteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
    setCurrentPage(1); // รีเซ็ตหน้าเป็น 1 เมื่อมีการเปลี่ยนตัวกรอง
  };

  return (
    <div className="flex flex-col justify-center gap-5 items-center relative">
      <div className="flex flex-col md:flex-row justify-start items-center w-full my-4 gap-2">
        <div className="flex md:flex-row flex-col gap-2 w-full">
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="mx-2 p-2 border rounded-md flex-shrink-0"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
          </select>

          {filterColumn && (
            <select
              value={selectedFilter}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md p-2 mx-2 flex-shrink-0"
            >
              <option value="">All</option>
              {uniqueFilterOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative mx-2 w-full md:w-auto flex-shrink-0 ">
          <input
            className="border border-gray-300 rounded-md p-2 pl-9 pr-4 w-full"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <SearchIcon className="absolute left-2 top-2 text-gray-500" />
        </div>
      </div>

      <div className="w-full bg-white rounded-lg font-sans flex flex-col justify-center items-start overflow-x-auto shadow-md">
        <h1 className="p-2 text-sm text-secondary font-bold">
          {TableName || "Table Name"}
        </h1>
        <table className="table-auto w-full text-[12px] ipadmini:text-sm">
          <thead className="bg-[#347EC2] text-white text-sm">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-2 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {currentPageData.map((item) => (
              <tr
                key={item.id}
                className="hover:shadow-lg bg-white h-16 border-b border-solid border-[#C6C6C6] hover:bg-gray-100 font-bold"
              >
                {Object.keys(item).map((key) =>
                  key === "action" ? (
                    <td key={key} className="px-4 py-3">
                      <b>
                        {Object.keys(item[key]).map((key1) => item[key][key1])}
                      </b>
                    </td>
                  ) : (
                    <td key={key} className="px-4 py-3">
                      {item[key]}{" "}
                    </td>
                  )
                )}
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

export default TableComponent;
