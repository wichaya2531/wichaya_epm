"use client";
import { useState, useEffect } from "react";
import useFetchJobs from "@/lib/hooks/useFetchJobs.js";
import TableComponent from "./TableComponent";
import TableComponentAdmin from "./TableComponentAdmin";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useFetchUser from "@/lib/hooks/useFetchUser";

const jobsActiveHeader = [
  "ID",
  "Checklist Name",
  "Line Name",
  // "Document no.",
  "Status",
  "Active",
  "Submitted By",
  "Action",
];
const jobsActiveHeaderAdmin = [
  "",
  "ID",
  "Checklist Name",
  "Line Name",
  // "Document no.",
  "Status",
  "Active",
  "Submitted By",
  "Action",
];

const statusOptions = [
  "All",
  "New",
  "Ongoing",
  "Plan",
  "Waiting for approval",
  "Complete",
  "Renew",
  "Overdue",
];

const JobsTable = ({ refresh }) => {
  const router = useRouter();
  //console.log(process.env.NEXT_PUBLIC_NOTIFY_NEW_USER);
  //console.log("****use JibsTable****");
  //console.log("JobsTable=>",refresh);
  //console.log(refresh);
  const { user, isLoading: userLoading } = useFetchUser(refresh);
  const { jobs, setJobs, isLoading: jobsLoading } = useFetchJobs(refresh); // Assuming useFetchJobs supports filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null); // Default start date as null
  const [endDate, setEndDate] = useState(null); // Default end date as null
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSelectJob = (jobId) => {
    setSelectedJobs((prevSelected) =>
      prevSelected.includes(jobId)
        ? prevSelected.filter((id) => id !== jobId)
        : [...prevSelected, jobId]
    );
  };

  // ฟังก์ชันลบงานที่เลือก
  const handleDeleteSelected = async () => {
    if (selectedJobs.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/job/remove-job`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_ids: selectedJobs }), // ส่ง array
        });

        const result = await response.json();
        if (response.ok) {
          Swal.fire("Deleted!", "Selected jobs have been deleted.", "success");
          setJobs((prevJobs) =>
            prevJobs.filter((job) => !selectedJobs.includes(job._id))
          );
          setSelectedJobs([]);
        } else {
          Swal.fire(
            "Error!",
            result.error || "Failed to delete jobs.",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Failed to delete jobs.", "error");
      }
    }
  };

  //console.log("jobs.=>", jobs);
  const filteredJobs =
    jobs &&
    jobs.filter((job) => {
      //console.log("filterxxx");

      // Filter by status
      if (
        filterStatus !== "All" &&
        job.STATUS_NAME !== filterStatus.toLowerCase()
      ) {
        return false;
      }

      // Filter by start date
      if (startDate && new Date(job.createdAt) < new Date(startDate)) {
        return false;
      }

      // Filter by end date
      if (endDate && new Date(job.createdAt) > new Date(endDate)) {
        return false;
      }

      // Filter by search query
      if (
        searchQuery &&
        !job.JOB_NAME.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

  const navigateToJob = (job_id, viewMode) => {
    sessionStorage.setItem("viewMode", viewMode);
    router.push("/pages/view-jobs?job_id=" + job_id);
  };

  const handleSearch = (e) => {
    //console.log("use search");
    setSearchQuery(e.target.value);
  };

  const jobsActiveBody =
    filteredJobs &&
    filteredJobs.map((job, index) => {
      let statusColor = job.STATUS_COLOR;
      // ตรวจสอบค่า Active ตาม STATUS_NAME
      const activeValue =
        job.STATUS_NAME === "complete"
          ? job.SUBMITTED_DATE
            ? new Date(job.SUBMITTED_DATE).toLocaleString()
            : "Not Active"
          : job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : "Not Active";
      return {
        ...(user.role === "Admin Group" && {
          checkbox: (
            <input
              type="checkbox"
              checked={selectedJobs.includes(job._id)}
              onChange={() => handleSelectJob(job._id)}
            />
          ),
        }),
        ID: index + 1,
        "Checklist Name": job.JOB_NAME,
        "Document no.": job.LINE_NAME,
        Status: (
          <div
            style={{ backgroundColor: statusColor }}
            className="py-1 select-none rounded-2xl text-white font-bold shadow-xl text-[12px] ipadmini:text-sm flex justify-center items-center px-3"
          >
            {job.STATUS_NAME ? job.STATUS_NAME : "pending"}
          </div>
        ),
        Active: activeValue, // ใช้ activeValue ที่ได้จากการตรวจสอบ
        "Submitted By": job.SUBMITTED_BY ? job.SUBMITTED_BY.EMP_NAME : "-",
        Action: (
          <div>
            {job.STATUS_NAME === "complete" ? (
              <div
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                // href={{
                //   pathname: "/pages/view-jobs",
                //   query: {
                //     job_id: job._id,
                //     view: "true",
                //   },
                // }}

                onClick={() => {
                  //console.log("Button clicked!");
                  // เพิ่ม logic เพิ่มเติมตามที่คุณต้องการ เช่น การตรวจสอบ หรือการแจ้งเตือน
                  //alert(`You clicked the job: ${job._id}`);
                  navigateToJob(job._id, true);
                }}
              >
                View
              </div>
            ) : job.STATUS_NAME !== "overdue" ? (
              <>
                {job.STATUS_NAME === "ongoing" ||
                job.STATUS_NAME === "new" ||
                job.STATUS_NAME === "renew" ? (
                  <div className="flex gap-2 items-center justify-center">
                    <div
                      className="text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                      // href={{
                      //   pathname: "/pages/view-jobs",
                      //   query: {
                      //     job_id: job._id,
                      //     view: "false",
                      //   },
                      // }}

                      onClick={() => {
                        //console.log("Button clicked!");
                        // เพิ่ม logic เพิ่มเติมตามที่คุณต้องการ เช่น การตรวจสอบ หรือการแจ้งเตือน
                        //alert(`You clicked the job: ${job._id}`);
                        navigateToJob(job._id, false);
                      }}
                    >
                      Get
                    </div>
                    <div
                      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-pointer"
                      // href={{
                      //   pathname: "/pages/view-jobs",
                      //   query: {
                      //     job_id: job._id,
                      //     view: "true",
                      //   },
                      // }}

                      onClick={() => {
                        // console.log("Button clicked!");
                        // เพิ่ม logic เพิ่มเติมตามที่คุณต้องการ เช่น การตรวจสอบ หรือการแจ้งเตือน
                        //alert(`You clicked the job: ${job._id}`);
                        navigateToJob(job._id, true);
                      }}
                    >
                      View
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-not-allowed cursor-pointer"
                    disabled
                  >
                    unavailable now
                  </button>
                )}
              </>
            ) : (
              <button
                className="text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center cursor-not-allowed cursor-pointer"
                disabled
              >
                overdue
              </button>
            )}
          </div>
        ),
      };
    });

  //console.log("jobsActiveBody=>",jobsActiveBody);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  return (
    <div className="w-full flex flex-col mt-5">
      <div className="flex flex-wrap mb-4 justify-start items-center gap-4">
        <div className="flex-1.5">
          <label
            htmlFor="statusFilter"
            className="block text-sm font-medium  text-black"
          >
            Search Checklist
          </label>
          <label
            htmlFor="search"
            className="mb-2 text-sm font-medium text-black sr-only"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="search"
              id="search"
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 text:dark dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search"
              required
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="flex-2">
          <label
            htmlFor="statusFilter"
            className="block text-sm font-medium text-black"
          >
            Filter by Status
          </label>
          <select
            id="statusFilter"
            className="bg-white w-full border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option
                key={option}
                value={option === "All" ? "All" : option.toLowerCase()}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-2">
          <label
            htmlFor="startDate"
            className="block text-sm font-medium  text-black"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate || ""}
            onChange={handleStartDateChange}
            className="bg-white w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>
        <div className="flex-2">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-900 "
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={endDate || ""}
            onChange={handleEndDateChange}
            className="bg-white w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>
      </div>
      {user.role === "Admin Group" ? (
        <TableComponentAdmin
          headers={jobsActiveHeaderAdmin}
          datas={jobsActiveBody}
          TableName="Active Jobs"
          PageSize={5}
          searchColumn={"Checklist Name"}
          searchHidden={true}
          filteredJobs={filteredJobs}
          selectedJobs={selectedJobs}
          handleDeleteSelected={handleDeleteSelected}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          setSelectedJobs={setSelectedJobs}
        />
      ) : (
        <TableComponent
          headers={jobsActiveHeader}
          datas={jobsActiveBody}
          TableName="Active Jobs"
          PageSize={5}
          searchColumn={"Checklist Name"}
          searchHidden={true}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};

export default JobsTable;
