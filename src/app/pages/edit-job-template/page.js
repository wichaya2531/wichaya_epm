"use client";

import Layout from "@/components/Layout.js";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import ProfileGroup from "@/lib/models/ProfileGroup.js";
import useFetchJobTemplate from "@/lib/hooks/useFetchJobTemplate.js";
import useFetchProfiles from "@/lib/hooks/useFetchProfiles.js";
// import useFetchUsers from "@/lib/hooks/useFetchUsers.js"; // ไม่ใช้
import Swal from "sweetalert2";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { getSession } from "@/lib/utils/utils.js";
import useFetchWorkgroups from "@/lib/hooks/useFetchWorkgroups";

// ---------------------- Timeout options & helpers (นอกคอมโพเนนต์) ----------------------
const TIMEOUT_OPTIONS = [
  { value: "12 hrs", label: "12 hrs" },
  { value: "1 days", label: "1 days" },
  { value: "3 days", label: "3 days" },
  { value: "7 days", label: "7 days" },
  { value: "15 days", label: "15 days" },
  { value: "30 days", label: "30 days" },
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "12 months", label: "12 months" },
];

// JS version (ใช้ได้กับไฟล์ .js/.tsx)
function normalizeTimeout(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();

  if (s === "12 hr" || s === "12 hour" || s === "12 hours") return "12 hrs";
  if (s === "1 day") return "1 days";
  if (s === "3 day") return "3 days";
  if (s === "7 day") return "7 days";
  if (s === "15 day") return "15 days";
  if (s === "30 day") return "30 days";
  if (s === "3 month") return "3 months";
  if (s === "6 month") return "6 months";
  if (s === "12 month") return "12 months";

  const hit = TIMEOUT_OPTIONS.find(
    (o) => o.value.toLowerCase() === s || o.label.toLowerCase() === s
  );
  return hit ? hit.value : null;
}
// ----------------------------------------------------------------------------------------

const approverHeader = ["Name", "Action"];
const notifyHeader = ["Name", "Action"];
const notifyOverdueHeader = ["Name", "Action"];

const Page = ({ searchParams }) => {
  const { workgroups } = useFetchWorkgroups();
  const jobTemplate_id = searchParams.jobTemplate_id;

  const [selectLineNames, setSelectLineNames] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [notifies, setNotifies] = useState([]);
  const [notifiesOverdue, setNotifiesOverdue] = useState([]);

  const [selectedApprover, setSelectedApprover] = useState(null);
  const [selectedNotify, setSelectedNotify] = useState(null);
  const [selectedNotifyOverdue, setSelectedNotifyOverdue] = useState(null);

  // ✅ เก็บ Timeout เป็น “สตริง” ไม่ใช่อ็อบเจ็กต์
  const [timeoutValue, setTimeoutValue] = useState("");

  // checklist type ยังเก็บเป็นอ็อบเจ็กต์ได้ (ถ้าไม่เจอปัญหา)
  const [checklistType, setChecklistType] = useState(null);

  const [dueDate, setDueDate] = useState("");
  const [refresh, setRefresh] = useState(false);

  const [filteredOptions, setFilteredOptions] = useState([]);
  const [allOptions, setAllOptions] = useState([]);

  const [currentPageTableApprove, setCurrentPageTableApprove] = useState(1);
  const [currentPageTableNotify, setCurrentPageTableNotify] = useState(1);
  const [currentPageTableOverdue, setCurrentPageTableOverdue] = useState(1);

  // checkboxes
  const [evidentImageReq, setEvidentImageReq] = useState(false);
  const [agileSkipCheck, setAgileSkipCheck] = useState(false);
  const [sortItemByPosition, setSortItemByPosition] = useState(false);
  const [publicEditInWorkgroup, setPublicEditInWorkgroup] = useState(false);

  // form controlled fields
  const [jobTemplateName, setJobTemplateName] = useState("");
  const [docNum, setDocNum] = useState("");
  const [checklistVer, setChecklistVer] = useState("");
  const [lineName, setLineName] = useState("N/A");

  const [usersInActiveList, setUsersInActiveList] = useState([]);
  const [users, setUsers] = useState([]);

  // ใช้ ref กัน useEffect เซ็ตทับหลังผู้ใช้เลือกแล้ว
  const hasTouchedTimeout = useRef(false);

  const {
    user,
    isLoading: isUserLoading,
    error: userError,
  } = useFetchUser(refresh);

  const {
    jobTemplate,
    isLoading: isJobTemplateLoading,
    error: jobTemplateError,
  } = useFetchJobTemplate(jobTemplate_id, refresh);

  const { profiles, loading: profilesLoading, error: profilesError } = useFetchProfiles(user?.workgroup_id);

  // เมื่อ jobTemplate มาแล้ว -> เซ็ตค่าเริ่มต้นทุกอย่าง (timeout ทำเฉพาะตอนยังไม่เคยแตะ)
  useEffect(() => {
    if (!isJobTemplateLoading && jobTemplate) {
      setEvidentImageReq(!!jobTemplate.PICTURE_EVEDENT_REQUIRE);
      setAgileSkipCheck(!!jobTemplate.AGILE_SKIP_CHECK);
      setSortItemByPosition(!!jobTemplate.SORT_ITEM_BY_POSITION);
      setPublicEditInWorkgroup(!!jobTemplate.PUBLIC_EDIT_IN_WORKGROUP);

      if (!hasTouchedTimeout.current) {
        const normalized = normalizeTimeout(jobTemplate.TIMEOUT);
        setTimeoutValue(normalized || "");
      }

      setChecklistType(
        jobTemplate.TYPE
          ? { value: jobTemplate.TYPE, label: jobTemplate.TYPE }
          : null
      );

      setJobTemplateName(jobTemplate.JOB_TEMPLATE_NAME || "");
      setDocNum(jobTemplate.DOC_NUMBER || "");
      setChecklistVer(jobTemplate.CHECKLIST_VERSION || "");
      setLineName(jobTemplate.LINE_NAME || "N/A");

      setApprovers(jobTemplate.ApproverList || []);
      setNotifies(jobTemplate.NotifyList || []);
      setNotifiesOverdue(jobTemplate.NotifyOverdueList || []);
    }
  }, [jobTemplate, isJobTemplateLoading]);

  // ดึงผู้ใช้ใน workgroup ของ user
  useEffect(() => {
    if (user?.workgroup_id) {
      const fetchUsers = async () => {
        try {
          const res = await fetch(
            `/api/user/get-users-in-workgroup/${user.workgroup_id}`,
            { next: { revalidate: 10 } }
          );
          const data = await res.json();
          setUsers(data.users || []);
          setUsersInActiveList(data.users || []);
        } catch (error) {
          // เงียบไว้หรือ console.warn ก็ได้
        }
      };
      fetchUsers();
    }
  }, [user?.workgroup_id]);

  // คำนวณ DueDate เริ่มต้น (+1 ปีจากวันนี้) ครั้งเดียว
  useEffect(() => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    const formatted = currentDate.toISOString().split("T")[0];
    setDueDate(formatted);
  }, []);

  // กรอง users ตาม workgroup ของ user สำหรับ Add Approver/Notify Active
  useEffect(() => {
    if (user && users && workgroups) {
      const currentWorkgroup = workgroups.find(
        (wg) => wg.WORKGROUP_NAME === user.workgroup
      );
      if (currentWorkgroup) {
        const filteredUsers = users
          .filter((u) => currentWorkgroup.USER_LIST.includes(u._id))
          .map((u) => ({ value: u._id, label: u.name }));
        setFilteredOptions(filteredUsers);
      }
    }
  }, [approvers, notifies, users, workgroups, user]);

  // สำหรับ Add Notify Overdue ใช้ผู้ใช้ทั้งหมด
  useEffect(() => {
    const all = users.map((u) => ({ value: u._id, label: u.name }));
    setAllOptions(all);
  }, [users]);

  // สร้างข้อมูลให้ TableComponent
  const dataApprover = (approvers || []).map((approver) => ({
    Name: approver.EMP_NAME,
    Action: (
      <button
        onClick={() => handleRemoveApprover(approver._id)}
        className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-3 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
      >
        Del
      </button>
    ),
  }));

  const dataNotify = (notifies || []).map((notify) => ({
    Name: notify.EMP_NAME,
    Action: (
      <button
        onClick={() => handleRemoveNotify(notify._id)}
        className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-3 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
      >
        Del
      </button>
    ),
  }));

  const dataNotifyOverdue = (notifiesOverdue || []).map((n) => ({
    Name: n.EMP_NAME,
    Action: (
      <button
        onClick={() => handleRemoveNotifyOverdue(n._id)}
        className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-3 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
      >
        Del
      </button>
    ),
  }));

  // Handlers: Add
  const handleAddApprover = () => {
    if (!selectedApprover) {
      Swal.fire("Oops.....", "Please select an Approver!", "error");
      return;
    }
    const newApprover = {
      _id: selectedApprover.value,
      EMP_NAME: selectedApprover.label,
    };
    setApprovers((prev) => [...prev, newApprover]);
    setSelectedApprover(null);
  };

  const handleAddNotify = () => {
    if (!selectedNotify) {
      Swal.fire("Oops..", "Please select a Notify!", "error");
      return;
    }
    const newNotify = {
      _id: selectedNotify.value,
      EMP_NAME: selectedNotify.label,
    };
    setNotifies((prev) => [...prev, newNotify]);
    setSelectedNotify(null);
  };

  const handleAddNotifyOverdue = () => {
    if (!selectedNotifyOverdue) {
      Swal.fire("Oops..", "Please select a Notify Overdue!", "error");
      return;
    }
    const newNotifyOverdue = {
      _id: selectedNotifyOverdue.value,
      EMP_NAME: selectedNotifyOverdue.label,
    };
    setNotifiesOverdue((prev) => [...prev, newNotifyOverdue]);
    setSelectedNotifyOverdue(null);
  };

  // Handlers: Remove (ยิง API แล้วอัปเดต state)
  const handleRemoveApprover = async (userId) => {
    try {
      const response = await fetch(`/api/job-template/remove-approver`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTemplateId: jobTemplate_id, userId }),
      });
      if (response.ok) {
        setApprovers((prev) => prev.filter((a) => a._id !== userId));
      } else {
        console.error("Failed to remove approver");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRemoveNotify = async (userId) => {
    try {
      const response = await fetch(`/api/job-template/remove-notify`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTemplateId: jobTemplate_id, userId }),
      });
      if (response.ok) {
        setNotifies((prev) => prev.filter((n) => n._id !== userId));
      } else {
        console.error("Failed to remove notify");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRemoveNotifyOverdue = async (userId) => {
    try {
      const response = await fetch(`/api/job-template/remove-notifyoverdue`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTemplateId: jobTemplate_id, userId }),
      });
      if (response.ok) {
        setNotifiesOverdue((prev) => prev.filter((x) => x._id !== userId));
      } else {
        console.error("Failed to remove notify overdue");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // ดึง Line Name ตาม session
  useEffect(() => {
    const run = async () => {
      const session = await getSession();
      if (session) fetchLineNames(session);
      else console.error("Failed to get session.");
    };
    run();
  }, []);

  const fetchLineNames = async (userSession) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userSession.user_id);
      const response = await fetch(`/api/select-line-name/get-line-name`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === 200) {
        setSelectLineNames(data.selectLineNames || []);
      } else {
        console.error("Failed to fetch line names:", data.error);
      }
    } catch (error) {
      console.error("Error fetching line names:", error);
    }
  };

  // เปลี่ยน timeout แล้ว mark ว่าผู้ใช้แตะ select แล้ว
  const onChangeTimeout = (opt) => {
    hasTouchedTimeout.current = true;
    setTimeoutValue(opt?.value || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const jobTemplateID = jobTemplate_id;
    const author = user?._id;
    const workgroup = user?.workgroup_id;

    const approvers_id = approvers.map((a) => a._id);
    const notifies_id = notifies.map((n) => n._id);
    const notifiesOverdue_id = notifiesOverdue.map((n) => n._id);

    if (approvers_id.length === 0) {
      const result = await Swal.fire({
        title: "Notify",
        text: "You have not specified the Approver List for this template. Do you want to confirm this action?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Continue",
        cancelButtonText: "Back to Edit",
      });
      if (!result.isConfirmed) return;
    }

    const removedApprovers =
      (jobTemplate?.ApproverList || [])
        .filter((x) => !approvers_id.includes(x._id))
        .map((x) => x._id) ?? [];

    const removedNotifies =
      (jobTemplate?.NotifyList || [])
        .filter((x) => !notifies_id.includes(x._id))
        .map((x) => x._id) ?? [];

    const removedNotifiesOverdue =
      (jobTemplate?.NotifyOverdueList || [])
        .filter((x) => !notifiesOverdue_id.includes(x._id))
        .map((x) => x._id) ?? [];

    const payload = {
      jobTemplateID,
      author,
      workgroup,
      due_date: dueDate,
      line_name: lineName,
      job_template_name: jobTemplateName,
      doc_num: docNum,
      checklist_ver: checklistVer,
      timeout: timeoutValue || jobTemplate?.TIMEOUT || null, // ✅ ใช้สตริงจาก state
      checklist_type: checklistType?.value ?? jobTemplate?.TYPE ?? null,
      approvers_id,
      notifies_id,
      notifiesOverdue_id,
      removedApprovers,
      removedNotifies,
      removedNotifiesOverdue,
      PICTURE_EVEDENT_REQUIRE: evidentImageReq,
      AGILE_SKIP_CHECK: agileSkipCheck,
      SORT_ITEM_BY_POSITION: sortItemByPosition,
      PUBLIC_EDIT_IN_WORKGROUP: publicEditInWorkgroup,
    };

    try {
      const res = await fetch(`/api/job-template/edit-job-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        next: { revalidate: 10 },
      });
      const response = await res.json();
      if (response.status === 500) {
        console.error(response.error);
      } else {
        Swal.fire({
          title: "Done!",
          text: "You have successfully edited a Checklist template!",
          icon: "success",
        });
        setNotifies([]);
        setApprovers([]);
        setNotifiesOverdue([]);
        setRefresh((prev) => !prev);

        // ถ้าต้องการให้ timeout กลับมา sync ตาม template รอบใหม่:
        hasTouchedTimeout.current = false;
      }
    } catch (error) {
      Swal.fire({ title: "Oops...", text: error.message, icon: "error" });
    }
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-5">
      <h1 className="flex items-center text-2xl font-bold mb-4 p-4 bg-white rounded-xl">
        <Link href="/pages/job-item-template">
          <ArrowBackIosNewIcon />
        </Link>
        Edit Checklist Template:&nbsp;
        <span className="text-blue-700">
          {jobTemplate?.JOB_TEMPLATE_NAME || ""}
        </span>
      </h1>

      <div className="mb-4 p-4 bg-white rounded-xl">
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <div>
            <label
              htmlFor="author"
              className="block mb-2 text-sm font-medium text-black"
            >
              Author
            </label>
            <input
              type="text"
              id="author"
              className="bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={user?.name || ""}
              name="author"
              required
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="workgroup"
              className="block mb-2 text-sm font-medium text-black"
            >
              Workgroup
            </label>
            <input
              type="text"
              id="workgroup"
              className="bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={user?.workgroup || ""}
              name="workgroup"
              required
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="due_date"
              className="block mb-2 text-sm font-medium text-black"
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-white border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="due_date"
              required
            />
          </div>

          <div>
            <label
              htmlFor="job_template_name"
              className="block mb-2 text-sm font-medium text-black"
            >
              Checklist Template Name
            </label>
            <input
              type="text"
              id="job_template_name"
              className="bg-white border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={jobTemplateName}
              onChange={(e) => setJobTemplateName(e.target.value)}
              name="job_template_name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="doc_num"
              className="block mb-2 text-sm font-medium text-black"
            >
              Document no.
            </label>
            <input
              type="text"
              id="doc_num"
              className="bg-white border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="doc_num"
              value={docNum}
              onChange={(e) => setDocNum(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="checklist_ver"
              className="block mb-2 text-sm font-medium text-black"
            >
              Checklist Version
            </label>
            <input
              type="text"
              id="checklist_ver"
              className="bg-white border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              name="checklist_ver"
              value={checklistVer}
              onChange={(e) => setChecklistVer(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="line_name"
              className="block mb-2 text-sm font-medium text-black"
            >
              Line Name
            </label>
            <select
              id="line_name"
              name="line_name"
              className="max-w-[300px] bg-white border border-gray-300 text-[1em] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={lineName}
              onChange={(e) => setLineName(e.target.value)}
            >
              <option value={jobTemplate?.LINE_NAME || ""}>
                {jobTemplate?.LINE_NAME || "—"}
                {" (Current) "}
              </option>
              <option value="N/A">&nbsp;&nbsp;&nbsp;N/A&nbsp;&nbsp;&nbsp;</option>
              {selectLineNames.map((ln) => (
                <option key={ln._id} value={ln.name}>
                  {ln.name}
                </option>
              ))}
            </select>
          </div>

          <div className="z-50">
            <label
              htmlFor="timeout-select"
              className="block mb-2 text-sm font-medium text-black"
            >
              Timeout
            </label>
            <select
              id="timeout-select"
              value={timeoutValue}
              onChange={(e) => {
                hasTouchedTimeout.current = true;
                setTimeoutValue(e.target.value);
              }}
              className="bg-white border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 text-black"
            >
              <option value="">Select Timeout</option>
              {TIMEOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="z-50">
            <label
              htmlFor="checklist-type"
              className="block mb-2 text-sm font-medium text-black"
            >
              Checklist Type
            </label>
            <Select
              inputId="checklist-type"
              options={[
                { value: "Shiftly", label: "Shiftly" },
                { value: "Daily", label: "Daily" },
                { value: "Weekly", label: "Weekly" },
                { value: "Monthly", label: "Monthly" },
              ]}
              isSearchable
              name="checklist-type"
              value={checklistType}
              onChange={setChecklistType}
              className="z-50"
            />
          </div>

          <div className="z-50">
            <div style={{ border: "1px solid none", padding: "5px" }}>
              <input
                type="checkbox"
                id="picture-evident-require"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                checked={evidentImageReq}
                onChange={(e) => setEvidentImageReq(e.target.checked)}
              />
              <label
                htmlFor="picture-evident-require"
                className="text-gray-800 pr-2 font-medium text-sm md:text-base"
              >
                &nbsp;&nbsp;&nbsp;Evident Picture Require
              </label>
            </div>

            <div id="agile-skip-check-wrap" style={{ border: "1px solid none", padding: "5px" }}>
              <input
                type="checkbox"
                id="agile-skip-check"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                checked={agileSkipCheck}
                onChange={(e) => setAgileSkipCheck(e.target.checked)}
              />
              <label
                htmlFor="agile-skip-check"
                className="text-gray-800 pr-2 font-medium text-sm md:text-base"
              >
                &nbsp;&nbsp;&nbsp;Agile Skip Check
              </label>
            </div>

          </div>
          <div className="z-50">
            <div id="sort-item-wrap" style={{ border: "1px solid none", padding: "5px" }}>
              <input
                type="checkbox"
                id="sort-item-by-position"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                checked={sortItemByPosition}
                onChange={(e) => setSortItemByPosition(e.target.checked)}
              />
              <label
                htmlFor="sort-item-by-position"
                className="text-gray-800 pr-2 font-medium text-sm md:text-base"
              >
                &nbsp;&nbsp;&nbsp;Sort Item By Position
              </label>
            </div>

            <div id="public-edit-wrap" style={{ border: "1px solid none", padding: "5px" }}>
              <input
                type="checkbox"
                id="public-edit-in-workgroup"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                checked={publicEditInWorkgroup}
                onChange={(e) => setPublicEditInWorkgroup(e.target.checked)}
              />
              <label
                htmlFor="public-edit-in-workgroup"
                className="text-gray-800 pr-2 font-medium text-sm md:text-base"
              >
                &nbsp;&nbsp;&nbsp;Public edit in workgroup
              </label>
            </div>

          </div>

          <div className="flex flex-col items-start space-y-2 border-red-300" >
            <label
              htmlFor="profiles"
              className="block mb-2 text-sm font-medium text-black"
            >
              Profiles
            </label>
            <select
              id="profiles"
              name="profiles"
              className="max-w-[300px] bg-white border border-gray-300 text-[1em] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
             // value={lineName}
             // onChange={(e) => setLineName(e.target.value)}
            >
              {
//  <              option value={jobTemplate?.LINE_NAME || ""}>
//                 {jobTemplate?.LINE_NAME || "—"}
//                 {" (Current) "}
//               </option>
              }

              <option value="N/A">&nbsp;&nbsp;&nbsp;N/A&nbsp;&nbsp;&nbsp;</option>
               {profiles.map((ln) => (
                <option key={ln._id} value={ln.PROFILE_NAME}>
                  {ln.PROFILE_NAME}
                </option>
              ))}
            </select>
          </div>

          {/* Notify Active */}
          <div className="flex flex-col gap-5 ">
            <div className="flex gap-5 w-full">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="notify-active"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Notify Active
                </label>
                <Select
                  inputId="notify-active"
                  options={filteredOptions}
                  value={selectedNotify}
                  onChange={setSelectedNotify}
                  isSearchable
                  className="z-30"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNotify}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>

            <div className="flex gap-5 w-full border border-gray-500 p-5 rounded-lg">
              <TableComponent
                headers={notifyHeader}
                datas={dataNotify}
                TableName="Notify Active List"
                searchColumn="Name"
                currentPage={currentPageTableNotify}
                disablePageSize
                disableFilter
                onPageChange={(page) => setCurrentPageTableNotify(page)}
              />
            </div>
          </div>

          {/* Notify Overdue */}
          <div className="flex flex-col gap-5">
            <div className="flex gap-5 w-full">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="notify-overdue"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Notify Overdue
                </label>
                <Select
                  inputId="notify-overdue"
                  options={allOptions} // ใช้ทั้งหมด
                  value={selectedNotifyOverdue}
                  onChange={setSelectedNotifyOverdue}
                  isSearchable
                  className="z-20"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNotifyOverdue}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>

            <div className="flex gap-5 w-full border border-gray-500 p-5 rounded-lg">
              <TableComponent
                headers={notifyOverdueHeader}
                datas={dataNotifyOverdue}
                TableName="Notify Overdue List"
                searchColumn="Name"
                currentPage={currentPageTableOverdue}
                disablePageSize
                disableFilter
                onPageChange={(page) => setCurrentPageTableOverdue(page)}
              />
            </div>
          </div>

          {/* Approver */}
          <div className="flex flex-col gap-5 ">
            <div className="flex gap-5 w-full">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="approver"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Approver
                </label>
                <Select
                  inputId="approver"
                  options={filteredOptions}
                  value={selectedApprover}
                  onChange={setSelectedApprover}
                  isSearchable
                  className="z-40"
                />
              </div>
              <button
                type="button"
                onClick={handleAddApprover}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>

            <div className="flex gap-5 w-full border border-gray-500 p-5 rounded-lg">
              <TableComponent
                headers={approverHeader}
                datas={dataApprover}
                TableName="Approver List"
                currentPage={currentPageTableApprove}
                disablePageSize
                disableFilter
                onPageChange={(page) => setCurrentPageTableApprove(page)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={handleSubmit}
        >
          Save
        </button>

        <hr className="mt-4" />
      </div>
    </Layout>
  );
};

export default Page;
