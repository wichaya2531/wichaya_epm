"use client";
import Layout from "@/components/Layout.js";
import ReactDOM from "react-dom";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import { getSession } from "@/lib/utils/utils";
import { useEffect, useState } from "react";
import { config } from "@/config/config.js";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import JobPlan from "@/components/JobPlan";
import SearchIcon from "@mui/icons-material/Search";

const jobTemplatesHeader = [
  "ID",
  "Checklist Template Name",
  "Line Name",
  "Created At",
  "Action",
];

const jobsHeader = [
  "ID",
  "Checklist Name",
  "Line Name" /*"Document no."*/,
  "Status",
  "Active",
  "Activator",
  "Action",
];

const enabledFunction = {
  "activate-job-template": "66389056d81a314967236e07",
  "remove-job": "6638906bd81a314967236e09",
};

const statusOptions = [
  "All",
  "New",
  "Ongoing",
  "Plan",
  "Waiting for approval",
  "Complete",
  "Retake",
  "Overdue",
];

const Page = () => {
  const [refresh, setRefresh] = useState(false);
  const [jobTemplates, setJobTemplates] = useState([]);
  const [session, setSession] = useState({});
  const [user, setUser] = useState({});
  const [userEnableFunctions, setUserEnableFunctions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isShowDetail, setIsShowDetail] = useState(false);
  const [detail, setDetail] = useState({});

  const [isShowPlan, setIsShowPlan] = useState(false);
  const [planData, setPlanData] = useState({});

  const [filterStatus, setFilterStatus] = useState("All");

  const filteredJobs =
    jobs &&
    jobs.filter((job) => {
      // Filter by status
      if (
        filterStatus !== "All" &&
        job.STATUS_NAME !== filterStatus.toLowerCase()
      ) {
        return false;
      }
      return true;
    });

  useEffect(() => {
    retrieveSession();
  }, [refresh]);

  const retrieveSession = async () => {
    const session = await getSession();
    setSession(session);
    await fetchUser(session.user_id);
  };

  const fetchUser = async (user_id) => {
    try {
      const response = await fetch(`/api/user/get-user/${user_id}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUser(data.user);
      setUserEnableFunctions(data.user.actions);
      await fetchJobTemplates(data.user.workgroup_id);
      await fetchJobs(data.user.workgroup_id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchJobTemplates = async (workgroup_id) => {
    try {
      const response = await fetch(
        `/api/workgroup/get-job-templates-from-workgroup/${workgroup_id}`,
        { next: { revalidate: 10 } }
      );
      const data = await response.json();
      if (data.status === 200) {
        setJobTemplates(data.jobTemplates);
      }
    } catch (err) {
      console.log(err);
    }
    showInvalidLineNamePopup;
  };

  const handleActivate = async (requestData) => {
    const lineNamesResponse = await fetch(
      "/api/select-line-name/get-line-name"
    );
    const lineNamesData = await lineNamesResponse.json();

    if (!lineNamesResponse.ok) {
      console.error("Failed to fetch line names:", lineNamesData.error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูล line name ได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const validLineNames = lineNamesData.selectLineNames.map((line) => ({
      value: line.name,
      label: line.name,
    }));

    if (
      validLineNames.some((option) => option.value === requestData.LINE_NAME) ||
      ["N/A", "NA", "na", "n/a"].includes(requestData.LINE_NAME)
    ) {
      if (
        requestData.LINE_NAME &&
        ["N/A", "NA", "na", "n/a"].includes(requestData.LINE_NAME)
      ) {
        showInvalidLineNamePopup(validLineNames, requestData);
      } else {
        // เปิดใช้งาน Checklist template
        try {
          const response = await fetch(
            "/api/job/activate-job-template-manual",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                JobTemplateID: requestData.jobTemplateID,
                JobTemplateCreateID: requestData.jobTemplateCreateID,
                ACTIVATER_ID: requestData.ACTIVATER_ID,
              }),
            }
          );
          const responseData = await response.json();
          if (responseData.status === 200) {
            Swal.fire({
              icon: "success",
              title: "สำเร็จ",
              text: "Checklist template ถูกเปิดใช้งานเรียบร้อยแล้ว",
              confirmButtonText: "ตกลง",
            });
          }
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถเปิดใช้งาน Checklist template ได้",
            confirmButtonText: "ตกลง",
          });
        }
      }
    } else {
      showInvalidLineNamePopup(validLineNames, requestData);
    }
  };

  const showInvalidLineNamePopup = (validLineNames, requestData) => {
    let selectedValue = null;

    Swal.fire({
      title: "เลือก Line Name ที่ต้องการ",
      html: '<div id="select-container" style="margin-top: 10px; height: 300px; overflow: auto; z-index: 20;"></div>',
      showCancelButton: true,
      confirmButtonText: "ส่ง",
      cancelButtonText: "ยกเลิก",
      allowOutsideClick: false,
      heightAuto: false,
      preConfirm: () => {
        if (selectedValue) {
          return selectedValue;
        }
        Swal.showValidationMessage("กรุณาเลือกชื่อ line name");
        return false;
      },
      willOpen: () => {
        const selectContainer = document.getElementById("select-container");

        ReactDOM.render(
          <Select
            options={validLineNames}
            isSearchable={true}
            placeholder="เลือกชื่อ line name"
            styles={{
              control: (base) => ({
                ...base,
                zIndex: 25,
                width: "400px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#999",
                },
                height: "60px",
              }),
              menu: (base) => ({
                ...base,
                zIndex: 25, // กำหนดค่า z-index ให้สูงกว่า SweetAlert2
                maxHeight: "400px", // เพิ่มความสูงสูงสุดของเมนู
                overflowY: "auto", // เพิ่มการเลื่อนแนวตั้งเมื่อมีตัวเลือกเยอะ
                pointerEvents: "auto", // ทำให้การคลิกเมนูมีผล
                position: "absolute",
              }),
              option: (base, { isFocused }) => ({
                ...base,
                padding: "10px",
                backgroundColor: isFocused ? "#f0f0f0" : "#fff", // เปลี่ยนสีเมื่อเลือก
                cursor: "pointer", // เปลี่ยนเคอร์เซอร์เมื่อเลื่อนผ่าน
              }),
            }}
            menuPlacement="auto" // ทำให้เมนูเปิดขึ้นหรือลงอัตโนมัติขึ้นอยู่กับตำแหน่ง
            maxMenuHeight={400} // กำหนดความสูงสูงสุดของเมนูเมื่อมีตัวเลือกเยอะ
            onChange={(selected) => {
              selectedValue = selected ? selected.value : null;
            }}
          />,
          selectContainer
        );
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // ส่งค่า line name ใหม่ไปที่ API
        handleSubmitWithNewLineName(result.value, requestData);
      }
    });
  };

  // ฟังก์ชันสำหรับการส่งค่า line name ใหม่
  const handleSubmitWithNewLineName = async (newLineName, requestData) => {
    const data = {
      JobTemplateID: requestData.jobTemplateID,
      ACTIVATER_ID: requestData.ACTIVATER_ID,
      JobTemplateCreateID: requestData.jobTemplateCreateID,
      LINE_NAME: newLineName, // ส่งค่า line name ใหม่
    };

    try {
      const res = await fetch("/api/job/activate-job-template-manual-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();
      if (response.status === 200) {
        Swal.fire({
          title: "สำเร็จ!",
          text: "สร้าง job ใหม่เรียบร้อยแล้ว!",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
      } else {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: response.error || "ไม่สามารถสร้าง job ใหม่ได้",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Oops...",
        text: error.message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handlePlan = (data) => {
    setPlanData(data);
    setIsShowPlan((prev) => !prev);
  };

  const fetchJobs = async (workgroup_id) => {
    try {
      console.log("workgroup_id....=>", workgroup_id);
      const response = await fetch(
        `/api/job/get-jobs-from-workgroup/${workgroup_id}`,
        { next: { revalidate: 10 } }
      );
      //console.log("response=>",response);
      const data = await response.json();
      //console.log("jobs data=>",data);
      if (data.status === 200) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleRemove = async (job_id) => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: true,
    });

    swalWithBootstrapButtons
      .fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/api/job/remove-job`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ job_id }),
              next: { revalidate: 10 },
            });
            swalWithBootstrapButtons.fire({
              title: "Deleted!",
              text: "Your file has been deleted.",
              icon: "success",
            });
            const data = await response.json();
            if (data.status === 200) {
              setRefresh((prev) => !prev);
            }
          } catch (error) {
            console.error("Error deleting workgroup:", error);
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your imaginary file is safe :)",
            icon: "error",
          });
        }
      });
  };

  const jobTemplatesBody = jobTemplates.map((jobTemplate, index) => {
    const data = {
      jobTemplateID: jobTemplate._id,
      jobTemplateCreateID: jobTemplate.JobTemplateCreateID,
      ACTIVATER_ID: user._id,
      LINE_NAME: jobTemplate.LINE_NAME,
    };
    return {
      ID: index + 1,
      "Checklist Template Name": jobTemplate.JOB_TEMPLATE_NAME,
      "Line Name": jobTemplate.LINE_NAME,
      "Create At": jobTemplate.createdAt,
      Action: (
        <div className="flex gap-2 items-center justify-center">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded"
            onClick={() => handlePlan(data)}
            disabled={
              !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
            }
            style={{
              cursor: !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
                ? "not-allowed"
                : "pointer",
            }}
          >
            plan
          </button>
          <button
            className="bg-orange-500 hover:bg-orange-700 text-white font-semibold py-1 px-2 rounded"
            onClick={() => handleActivate(data)}
            disabled={
              !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
            }
            style={{
              cursor: !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
                ? "not-allowed"
                : "pointer",
            }}
          >
            Activate
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded"
            onClick={() => handleViewDetial(data)}
            disabled={
              !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
            }
            style={{
              cursor: !userEnableFunctions.some(
                (action) =>
                  action._id === enabledFunction["activate-job-template"]
              )
                ? "not-allowed"
                : "pointer",
            }}
          >
            details
          </button>
        </div>
      ),
    };
  });

  const jobsBody =
    filteredJobs &&
    filteredJobs.map((job, index) => {
      return {
        ID: index + 1,
        "Checklist Name": job.JOB_NAME,
        "Line Name": job.LINE_NAME,
        Status: (
          <div
            style={{ backgroundColor: job.STATUS_COLOR }}
            className="px-4 text-[12px] font-bold py-1 rounded-full text-white shadow-xl ipadmini:text-sm whitespace-nowrap overflow-hidden text-ellipsis select-none"
          >
            {job.STATUS_NAME ? job.STATUS_NAME : "pending"}
          </div>
        ),

        Active: job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : "Not Active",
        Activator: job.ACTIVATER_NAME,
        Action: (
          //check permission
          <div className="flex gap-2 items-center justify-center">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded"
              onClick={() => handleRemove(job._id)}
              disabled={
                !userEnableFunctions.some(
                  (action) => action._id === enabledFunction["remove-job"]
                )
              }
              style={{
                cursor: !userEnableFunctions.some(
                  (action) => action._id === enabledFunction["remove-job"]
                )
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ),
      };
    });

  const ShowDetailModal = ({ onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
      const input = document.getElementById("npm-install");
      input.select();
      document.execCommand("copy");
      setIsCopied(true);

      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    };

    // Disable background scrolling when modal is open
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }, []);

    return (
      <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 ">
        <div className="bg-white p-5 rounded-lg w-2/3  flex flex-col gap-6 relative">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Detail</h1>
            <h2 className="text-sm text-secondary">
              To activate through third-party, you need to send a GET request
              with the following pattern:
            </h2>
            <div className="grid grid-cols-8 gap-2 w-full max-w-[23rem]">
              <label htmlFor="npm-install" className="sr-only">
                Label
              </label>
              <input
                id="npm-install"
                type="text"
                className="col-span-6 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={detail.link}
                readOnly
              />
              <button
                onClick={copyToClipboard}
                className="col-span-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 items-center inline-flex justify-center"
              >
                <span>{isCopied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
          <button
            className="bg-red-700 text-white font-bold py-2 px-4 self-end absolute top-0 right-0 hover:bg-red-800 shadow-lg rounded-sm"
            onClick={() => setIsShowDetail(false)} // Close modal on button click
          >
            <CloseIcon className="size-18" />
          </button>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">How to retrieve the Data ?</h1>
            <p className="text-sm text-secondary">
              You can use the following URL pattern followed by the Checklist ID
              that was sent to you after activation through the above URL.
            </p>
            <p className="text-sm text-black bg-gray-300 p-2 font-bold">
              Example:{" "}
              {`http://10.171.134.51:3000/api/job/get-job-value?job_id=job_id`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleViewDetial = (data) => {
    //console.log(data);
    //&LineName=${data.LINE_NAME}
    const link = `${config.host_link}/api/job/activate-job-template-third-party?jobTemID=${data.jobTemplateID}&actID=${data.ACTIVATER_ID}&jobTemCreateID=${data.jobTemplateCreateID}`;
    setDetail(() => ({
      link: link,
    }));
    setIsShowDetail(true);
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-5">
      <h1 className="text-3xl font-bold text-primary flex  items-center">
        {">"} WorkGroup: {user?.workgroup}{" "}
      </h1>
      <h1 className="text-2xl font-bold">Checklist Templates</h1>
      <TableComponent
        headers={jobTemplatesHeader}
        datas={jobTemplatesBody}
        TableName="Checklist Templates"
        searchColumn="Checklist Template Name"
        filterColumn="Line Name"
      />
      <h1 className="text-2xl font-bold">Active Jobs</h1>
      {/* ฟิลเตอร์สถานะ */}
      <div className="mb-4 flex items-center">
        <label htmlFor="status-filter" className="mr-2 font-semibold">
          Filter by Status:
        </label>
        <select
          id="status-filter"
          className="border border-gray-300 rounded p-2 "
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {statusOptions.map((status, index) => (
            <option key={index} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <TableComponent
        headers={jobsHeader}
        datas={jobsBody}
        TableName="Active Checklist"
        searchColumn="Checklist Name"
        filterColumn="Line Name"
      />
      {isShowDetail && <ShowDetailModal />}
      {isShowPlan && (
        <JobPlan
          data={planData}
          onClose={() => setIsShowPlan(false)} // Close modal handler
          setRefresh={setRefresh}
        />
      )}
    </Layout>
  );
};

export default Page;
