"use client";
import Layout from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchJobEvents from "@/lib/hooks/useFetchJobEvents";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import ShowmoreData from "@/app/pages/job-calendar/ShowmoreData";
import useFetchWorkgroups from "@/lib/hooks/useFetchWorkgroups";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import VerifiedIcon from "@mui/icons-material/Verified";
import NotificationImportantSharpIcon from "@mui/icons-material/NotificationImportantSharp";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useFetchProfiles from "@/lib/hooks/useFetchProfiles.js";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);

const Page = () => {
  const router = useRouter();
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(moment().format("YYYY-MM"));
  const [refresh, setRefresh] = useState(false);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState("");
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  // ค่าที่พิมพ์/เลือกใน input
  const [lineNameInput, setLineNameInput] = useState("");
  const [checklistNameInput, setChecklistNameInput] = useState("");
  const [profilegroupIdInput, setProfilegroupIdInput] = useState("");
  const [wdTagInput, setWdTagInput] = useState("");

  // ค่าที่ใช้ค้นหาจริง หลังจากกด Apply
  const [lineNameSearch, setLineNameSearch] = useState("");
  const [checklistNameSearch, setChecklistNameSearch] = useState("");
  const [profilegroupIdSearch, setProfilegroupIdSearch] = useState("");
  const [wdTagSearch, setWdTagSearch] = useState("");

  const { user } = useFetchUser();
  const { workgroups } = useFetchWorkgroups();
  const { profiles, loading: profilesLoading } = useFetchProfiles(selectedWorkgroup);

  const { events, eventLoading, error } = useFetchJobEvents(
    selectedWorkgroup,
    selectedType,
    selectedPlanType,
    refresh,
    date,
    currentMonth,
    lineNameSearch,
    checklistNameSearch,
    profilegroupIdSearch,
    wdTagSearch
  );

  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState({});

  const handleMonthChange = (newMonth) => {
    const [y, m] = newMonth.split("-").map(Number);
    const newDate = new Date(y, m - 1, 1);
    setDate(newDate);
    setCurrentMonth(newMonth);
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    if (user && user.workgroup_id) {
      setSelectedWorkgroup(user.workgroup_id);
      setRefresh((prev) => !prev);
    }
  }, [user?.workgroup_id]);

  const handleApplySearch = () => {
    setLineNameSearch(lineNameInput.trim());
    setChecklistNameSearch(checklistNameInput.trim());
    setProfilegroupIdSearch(profilegroupIdInput);
    setWdTagSearch(wdTagInput.trim());
    setRefresh((prev) => !prev);
  };

  const handleClearSearch = () => {
    setLineNameInput("");
    setChecklistNameInput("");
    setProfilegroupIdInput("");
    setWdTagInput("");

    setLineNameSearch("");
    setChecklistNameSearch("");
    setProfilegroupIdSearch("");
    setWdTagSearch("");

    setRefresh((prev) => !prev);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleMoveEventFromShowMoreData = async (eventIds) => {
    close();

    const today = new Date().toISOString().split("T")[0];

    Swal.fire({
      title: `Move ${eventIds.length} item(s)`,
      html: `
        <label for="swal-date">DateTime:</label><br/>
        <input type="date" id="swal-date" class="swal2-input" min="${today}">
        <input type="time" id="swal-time" class="swal2-input">
      `,
      showCancelButton: true,
      confirmButtonText: "Submit",
      preConfirm: () => {
        const date = document.getElementById("swal-date").value;
        const time = document.getElementById("swal-time").value;

        if (!date) {
          Swal.showValidationMessage("กรุณาเลือกวันที่");
          return false;
        }

        if (!time) {
          Swal.showValidationMessage("กรุณาเลือกเวลา");
          return false;
        }

        return `${date} ${time}`;
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const response = await fetch(`/api/schedual/edit-schedual`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _id: eventIds.map((id) => id.replace("schedule-", "")),
            datetime: result.value,
          }),
        });

        const data = await response.json();

        if (data.status === 200) {
          Swal.fire("Success", data.message || "Move completed", "success");
          setRefresh((prev) => !prev);
          return;
        }

        Swal.fire("Error", data.message || "Move failed", "error");
      } catch (err) {
        console.error("Bulk move error:", err);
        Swal.fire("Error", "Network error or server issue", "error");
      }
    });
  };



  const handleDeleteEventFromShowMoreData = async (events) => {
    close();

    try {
      const response = await fetch("/api/events/deletes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire("Deleted!", `${events.length} item(s) removed`, "success");
        setRefresh((prev) => !prev);
      } else {
        Swal.fire("Error!", result.message || "Failed to delete", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error!", "Network error or server issue", "error");
    }
  };

  const handleshowOptionAfterClickEvent = async (b) => {
    let data_lv1;
    try {
      const res = await fetch(
        "/api/job/get-job-event-infomation?job_id=" +
          b.job_id +
          "&user_id=" +
          user._id +
          "&user_workgroup_id=" +
          user.workgroup_id
      );
      data_lv1 = await res.json();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }

    close();

    let htmlBtn = ``;
    if (b.status_name === "ongoing") {
      htmlBtn += `<div>Last_get_by: ${b.last_get_by}</div>`;
      if (b.last_get_date) {
        htmlBtn += `<div>Last_get_time: ${moment(b.last_get_date).format(
          "YYYY-MM-DD HH:mm:ss"
        )}</div>`;
      }
      htmlBtn += `<p>`;
    }

    if (data_lv1.menu.includes("Get")) {
      htmlBtn += `<button id="btn-get" class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Get</button>`;
    }
    if (data_lv1.menu.includes("Edit")) {
      htmlBtn += `<button id="btn-edit" class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Edit</button>`;
    }
    if (data_lv1.menu.includes("View")) {
      htmlBtn += `<button id="btn-view" class="swal2-cancel swal2-styled" style="background-color:#2196F3;">View</button>`;
    }
    if (data_lv1.menu.includes("Approve")) {
      htmlBtn += `<button id="btn-approve" class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Approve</button>`;
    }
    if (data_lv1.menu.includes("Move")) {
      htmlBtn += `<button id="btn-move" class="swal2-cancel swal2-styled" style="background-color:rgb(143, 138, 138);">Move</button>`;
    }
    if (data_lv1.menu.includes("Trigger")) {
      htmlBtn += `<button id="btn-trigger" class="swal2-cancel swal2-styled" style="background-color:rgba(9, 180, 40, 1);">Trigger</button>`;
    }
    if (data_lv1.menu.includes("Delete")) {
      htmlBtn += `<button id="btn-delete" class="swal2-cancel swal2-styled" style="background-color: #f44336;">Delete</button>`;
    }

    htmlBtn += `<button id="btn-cancel" class="swal2-cancel swal2-styled">Cancel</button>`;

    Swal.fire({
      title: b.title,
      text: "",
      icon: "info",
      showConfirmButton: false,
      html: htmlBtn,
      didOpen: () => {
        const popup = Swal.getPopup();

        popup.querySelector("#btn-get")?.addEventListener("click", () => {
          sessionStorage.setItem("viewMode", false);
          window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
          Swal.close();
        });

        popup.querySelector("#btn-edit")?.addEventListener("click", () => {
          sessionStorage.setItem("viewMode", false);
          window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
          Swal.close();
        });

        popup.querySelector("#btn-view")?.addEventListener("click", () => {
          sessionStorage.setItem("viewMode", true);
          window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
          Swal.close();
        });

        popup.querySelector("#btn-approve")?.addEventListener("click", () => {
          window.open("/pages/job-review?job_id=" + b.job_id, "_blank");
          sessionStorage.setItem("approveMode", true);
          Swal.close();
        });

        popup.querySelector("#btn-trigger")?.addEventListener("click", async () => {
          Swal.close();
          try {
            const response = await fetch(`/api/schedual/schedual-manual-trigger`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                _id: [b.event_id],
              }),
            });
            const data = await response.json();
            if (data.status === 200) {
              location.reload();
              return;
            }
            alert(data.message);
          } catch (err) {
            if (process.env.NEXT_PUBLIC_DEBUG == "true") {
              console.log("Error Code : 110");
              console.error("📄 Stack trace:\n", err.stack);
              console.error("Error update job:", err);
            }
          }
        });

        popup.querySelector("#btn-move")?.addEventListener("click", () => {
          Swal.close();

          const today = new Date().toISOString().split("T")[0];

          Swal.fire({
            title: "" + b.title,
            html: `
              <label for="swal-date">DateTime:</label><br/>
              <input type="date" id="swal-date" class="swal2-input" min="${today}">
              <input type="time" id="swal-time" class="swal2-input">
            `,
            showCancelButton: true,
            confirmButtonText: "Submit",
            preConfirm: () => {
              const date = document.getElementById("swal-date").value;
              const time = document.getElementById("swal-time").value;

              if (!date) {
                Swal.showValidationMessage("กรุณาเลือกวันที่");
              }

              if (!time) {
                Swal.showValidationMessage("กรุณาเลือกเวลา");
              }

              return `${date} ${time}`;
            },
          }).then(async (result) => {
            if (result.isConfirmed) {
              const datetime = result.value;
              try {
                const response = await fetch(`/api/schedual/edit-schedual`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    _id: [b.event_id],
                    datetime: datetime,
                  }),
                });
                const data = await response.json();
                if (data.status === 200) {
                  setRefresh((prev) => !prev);
                  return;
                }
                alert(data.message);
              } catch (err) {
                if (process.env.NEXT_PUBLIC_DEBUG == "true") {
                  console.error("📄 Stack trace:\n", err.stack);
                  console.log("Error Code : 111");
                  console.error("Error update job:", err);
                }
              }
            }
          });
        });

        popup.querySelector("#btn-delete")?.addEventListener("click", () => {
          Swal.close();
          Swal.fire({
            title: "Are you sure?",
            text: 'to delete " ' + b.title + '"',
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true,
          }).then(async (result) => {
            if (result.isConfirmed) {
              if (data_lv1.info.STATUS === "plan") {
                try {
                  const response = await fetch(`/api/schedual/remove-schedual`, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ _id: [b.event_id] }),
                  });
                  const data = await response.json();
                  if (data.status === 200) {
                    setRefresh((prev) => !prev);
                    return;
                  }
                  alert(data.message);
                } catch (err) {
                  if (process.env.NEXT_PUBLIC_DEBUG == "true") {
                    console.log("Error Code : 112");
                    console.error("📄 Stack trace:\n", err.stack);
                    console.error("Error deleting job:", error);
                  }
                }
              } else {
                try {
                  const response = await fetch(`/api/job/remove-job`, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ job_ids: [b.job_id] }),
                  });
                  const data = await response.json();
                  if (data.status === 200) {
                    setRefresh((prev) => !prev);
                  }
                } catch (err) {
                  if (process.env.NEXT_PUBLIC_DEBUG == "true") {
                    console.log("Error Code : 113");
                    console.error("📄 Stack trace:\n", err.stack);
                    console.error("Error deleting job:", error);
                  }
                }
              }
            }
          });
        });

        popup.querySelector("#btn-cancel")?.addEventListener("click", () => {
          Swal.close();
        });
      },
    });
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const eventPropGetter = (event) => {
    return {
      style: {
        fontSize: "0.8em",
        backgroundColor: event.color || "#3174ad",
      },
    };
  };

  const dayPropGetter = (date) => {
    const isCurrentDate = moment(date).isSame(new Date(), "day");
    return {
      style: {
        border: isCurrentDate ? "2px solid #bebebe" : undefined,
        backgroundColor: isCurrentDate ? "white" : undefined,
        boxShadow: isCurrentDate ? "0px 4px 8px rgba(0, 0, 0, 0.2)" : undefined,
        padding: "2em",
      },
    };
  };

  const handleSelectEvent = (event) => {
    handleshowOptionAfterClickEvent(event);
  };

  const handleShowmore = (events, date) => {
    setEventData({ events, date: date.toString() });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
  };

  const handleChangeWorkgroup = (e) => {
    setSelectedWorkgroup(e);
    setProfilegroupIdInput("");
    setProfilegroupIdSearch("");
    setRefresh((prev) => !prev);
  };

  const handleChangeType = (selectedType) => {
    setSelectedType(selectedType);
    if (selectedType !== "plan") {
      setSelectedPlanType("");
    }
    setRefresh((prev) => !prev);
  };

  const handleChangePlanType = (selectedPlanType) => {
    setSelectedPlanType(selectedPlanType);
    setRefresh((prev) => !prev);
  };

  const CustomEvent = ({ event }) => {
    return (
      <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexGrow: 1,
          }}
        >
          {event.title}
        </span>
        {event.status_name === "ongoing" && event.last_get_by && (
          <AssignmentIndIcon
            style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectEvent(event);
            }}
          />
        )}
        {event.abnormal_item === 1 && (
          <NotificationImportantSharpIcon
            style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }}
          />
        )}
        {event.sticker_verify === true && (
          <VerifiedIcon
            style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }}
          />
        )}
      </div>
    );
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/calendar.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Calendar
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex items-center">
          Details on activation dates for all checklists.
        </h1>
      </div>

      <div className="bg-white rounded-xl p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 mt-4 text-sm gap-3">
          <div className="relative flex flex-col md:flex-row">
            <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
              Month.
            </label>
            <input
              type="month"
              className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
              value={moment(date).format("YYYY-MM")}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={eventLoading}
            />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center">
            <label className="pointer-events-none absolute left-3 bg-white px-1 top-0 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
              Workgroup
            </label>
            <select
              className={`peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500 ${
                eventLoading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              onChange={(e) => handleChangeWorkgroup(e.target.value)}
              disabled={eventLoading}
              value={selectedWorkgroup}
            >
              <option value="" disabled>
                Select workgroups
              </option>
              <option value="all">All</option>
              {workgroups.map((workgroup) => (
                <option key={workgroup._id} value={workgroup._id}>
                  {workgroup.WORKGROUP_NAME}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center">
            <label className="pointer-events-none absolute left-3 bg-white px-1 top-0 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
              Type
            </label>
            <select
              className={`peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500 ${
                eventLoading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              onChange={(e) => handleChangeType(e.target.value)}
              disabled={eventLoading}
              value={selectedType}
            >
              <option value="" disabled>
                Select Type
              </option>
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="ongoing">ongoing</option>
              <option value="plan">Plan</option>
              <option value="overdue">Overdue</option>
              <option value="waiting for approval">Waiting for approval</option>
              <option value="complete">Complete</option>
              <option value="renew">Renew</option>
            </select>
          </div>

          {selectedType === "plan" && (
            <div className="relative flex flex-col md:flex-row items-start md:items-center">
              <label className="pointer-events-none absolute left-3 bg-white px-1 top-0 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
                Plan Type:
              </label>
              <select
                className={`peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500 ${
                  eventLoading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                }`}
                onChange={(e) => handleChangePlanType(e.target.value)}
                disabled={eventLoading}
                value={selectedPlanType}
              >
                <option value="">All</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="2monthly">2Monthly</option>
                <option value="3monthly">3Monthly</option>
                <option value="6monthly">6Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setShowSearchFilters((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
          >
            <ExpandMoreIcon
              className={`transition-transform duration-200 ${
                showSearchFilters ? "rotate-180" : ""
              }`}
              fontSize="small"
            />
            {showSearchFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showSearchFilters && (
          <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div className="relative flex flex-col w-full">
                <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
                  Line Name
                </label>
                <input
                  type="text"
                  id="line-name-search"
                  value={lineNameInput}
                  onChange={(e) => setLineNameInput(e.target.value)}
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  disabled={eventLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplySearch();
                  }}
                />
              </div>

              <div className="relative flex flex-col w-full">
                <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
                  Checklist Name
                </label>
                <input
                  type="text"
                  id="checklist-name-search"
                  value={checklistNameInput}
                  onChange={(e) => setChecklistNameInput(e.target.value)}
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  disabled={eventLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplySearch();
                  }}
                />
              </div>

              <div className="relative flex flex-col w-full">
                <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
                  WD Tag
                </label>
                <input
                  type="text"
                  id="wd-tag-search"
                  value={wdTagInput}
                  onChange={(e) => setWdTagInput(e.target.value)}
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  disabled={eventLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplySearch();
                  }}
                />
              </div>

              <div className="relative flex flex-col w-full">
                <label className="pointer-events-none absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all z-10 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:top-1 peer-valid:text-xs">
                  ProfileGroup Name
                </label>

                <select
                  id="profilegroup-name-search"
                  value={profilegroupIdInput}
                  onChange={(e) => setProfilegroupIdInput(e.target.value)}
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  disabled={eventLoading || profilesLoading}
                >
                  <option value="">All ProfileGroup</option>
                  {profiles.map((profile) => (
                    <option key={profile._id} value={profile._id}>
                      {profile.PROFILE_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={handleApplySearch}
                  disabled={eventLoading}
                  className={`h-[46px] w-full rounded-md px-4 text-sm font-semibold text-white transition ${
                    eventLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={handleClearSearch}
                  disabled={eventLoading}
                  className={`h-[46px] w-full rounded-md px-4 text-sm font-semibold transition ${
                    eventLoading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center" title="New: The checklist that has just activated, and no one hasn't edited yet.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#0081ff" }}></span>
              <span className="text-sm">New</span>
            </div>
            <div className="flex items-center" title="Ongoing: The checklist is being edited by some checker.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#E76E03" }}></span>
              <span className="text-sm">Ongoing</span>
            </div>
            <div className="flex items-center" title="Plan: The checklist hasn't been activated, but it will activate at the time it's set.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#D5DBDB" }}></span>
              <span className="text-sm">Plan</span>
            </div>
            <div className="flex items-center" title="Waiting for approval: The checklist has been submitted and is waiting for approval.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#FFBB61" }}></span>
              <span className="text-sm">Waiting for approval</span>
            </div>
            <div className="flex items-center" title="Complete: The checklist has been approved.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#3cb371" }}></span>
              <span className="text-sm">Complete</span>
            </div>
            <div className="flex items-center" title="Renew: The checklist has been rejected and needs to be retaken.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#FFD700" }}></span>
              <span className="text-sm">Renew</span>
            </div>
            <div className="flex items-center" title="Overdue: The checklist has exceeded the timeout.">
              <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: "#ff0000" }}></span>
              <span className="text-sm">Overdue</span>
            </div>
          </div>
        </div>

        <div style={{ height: 800 }} className="overflow-auto">
          <Calendar
            localizer={localizer}
            events={[...(events || [])]}
            step={60}
            views={["month"]}
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            onShowMore={(events, date) => handleShowmore(events, date)}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            onSelectEvent={handleSelectEvent}
            components={{
              event: CustomEvent,
            }}
            toolbar={false}
          />
        </div>
      </div>

      <Modal open={open} onClose={close}>
        <Box
          className="absolute top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/2 max-w-3xl w-full max-h-90vh overflow-y-auto p-4 rounded-lg"
          sx={{ outline: "none" }}
        >
          <ShowmoreData
              data={eventData}
              close={close}
              showOptionAfterClickEvent={handleshowOptionAfterClickEvent}
              handleDeleteEventFromShowMoreData={handleDeleteEventFromShowMoreData}
              handleMoveEventFromShowMoreData={handleMoveEventFromShowMoreData}
              loginUser={user}
              selectedWorkgroup={selectedWorkgroup}
              workgroups={workgroups}
            />
        </Box>
      </Modal>
    </Layout>
  );
};

export default Page;