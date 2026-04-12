import React, { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import VerifiedIcon from "@mui/icons-material/Verified";
import NotificationImportantSharpIcon from "@mui/icons-material/NotificationImportantSharp";
import DeleteIcon from "@mui/icons-material/Delete";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

const ShowmoreData = ({
  data,
  close,
  showOptionAfterClickEvent,
  handleDeleteEventFromShowMoreData,
  handleMoveEventFromShowMoreData,
  loginUser,
  selectedWorkgroup,
  workgroups,
}) => {

  console.log('showmoreData page data=',data);


  var openOptionDeleteJob = false;
  var selectWorkgroupName = "";

  workgroups.forEach((element) => {
    if (element._id === selectedWorkgroup) {
      selectWorkgroupName = element.WORKGROUP_NAME;
    }
  });

  if (
    loginUser.workgroup === selectWorkgroupName &&
    loginUser.role === "Admin Group"
  ) {
    openOptionDeleteJob = true;
  }

  const router = useRouter();
  const { events, date } = data;
  const [showCheckbox, setShowCheckbox] = useState(false);
  const formattedDate = new Date(date).toLocaleDateString();
  const [checkedIds, setCheckedIds] = useState([]);
  const [sortedEvents, setSortedEvents] = useState([]);
  const [sortKey, setSortKey] = useState("");

  useEffect(() => {
    handleSort("line_name");
  }, []);

  useEffect(() => {
    if (!showCheckbox) {
      setCheckedIds([]);
    }
  }, [showCheckbox]);


 const handleMove = () => {
    if (checkedIds.length === 0) {
      return;
    }

    handleMoveEventFromShowMoreData(checkedIds);
  };


  const handleSort = (key) => {
    setSortKey(key);
    const sorted = [...data.events].sort((a, b) =>
      (a[key] || "").localeCompare(b[key] || "")
    );
    setSortedEvents(sorted);
  };

  const handleSelectEvent = (event) => {
    if (router) {
      let viewMode = "";

      if (event.status_name === "plan") {
        close();
        Swal.fire({
          title: "Checklist is in plan status",
          text: "You cannot view the Checklist in plan status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (event.status_name === "complete") {
        viewMode = "true";
      } else if (event.status_name === "overdue") {
        close();
        Swal.fire({
          title: "Checklist is overdue",
          text: "You cannot view the Checklist in overdue status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (event.status_name === "waiting for approval") {
        close();
        Swal.fire({
          title: "Checklist is waiting for approval",
          text: "You cannot view the Checklist in waiting for approval status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (
        event.status_name === "new" ||
        event.status_name === "ongoing" ||
        event.status_name === "renew"
      ) {
        viewMode = "false";
      }

      sessionStorage.setItem("viewMode", viewMode);
      const url = `/pages/view-jobs?job_id=${event.job_id}`;
      window.open(url, "_blank");
    }
  };

  const getEventUniqueId = (event) => `${event.event_type}-${event.event_id}`;

  const handleCheckboxChange = (eventId, isChecked) => {
    setCheckedIds((prev) => {
      if (isChecked) {
        if (prev.includes(eventId)) return prev;
        return [...prev, eventId];
      } else {
        return prev.filter((id) => id !== eventId);
      }
    });
  };

  const handleSelectAll = () => {
    const allIds = sortedEvents.map((event) => getEventUniqueId(event));

    if (checkedIds.length === allIds.length && allIds.length > 0) {
      setCheckedIds([]);
    } else {
      setCheckedIds(allIds);
    }
  };

  const handleDelete = () => {
    if (checkedIds.length === 0) {
      return;
    }

    handleDeleteEventFromShowMoreData(checkedIds);
  };

  const isAllSelected =
    sortedEvents.length > 0 && checkedIds.length === sortedEvents.length;

  return (
    <div
      className="w-3/4 h-full max-h-[80vh] bg-white p-5 rounded-lg shadow-lg overflow-y-auto relative"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitScrollbar: "none",
      }}
    >
      <div
        id="header-bar"
        className="sticky top-0 z-10 bg-white"
        style={{
          border: "1px solid none",
          width: "100%",
          height: "5em",
          top: "-19px",
        }}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-800">
            Checklists on {formattedDate} :: Total Checklists: {events.length}
          </h2>
          <IconButton onClick={close} className="absolute top-2 right-2">
            <CloseIcon />
          </IconButton>
        </div>

        <div
          style={{
            borderBottom: "1px solid none",
            width: "100%",
            position: "relative",
            fontSize: "0.8em",
          }}
        >
          <div className="flex items-start flex-wrap gap-3">
            <fieldset className="border border-gray-300 rounded-md px-3 py-2 min-w-fit">
              <legend className="px-1 text-gray-700 font-semibold">Sort</legend>
              <div className="flex items-center flex-wrap gap-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sorting"
                    className="w-5 h-5 text-red-500"
                    checked={sortKey === "line_name"}
                    onChange={() => handleSort("line_name")}
                    disabled={showCheckbox}
                  />
                  <span className="ml-1">Line Name</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sorting"
                    className="w-5 h-5 text-red-500"
                    checked={sortKey === "job_name"}
                    onChange={() => handleSort("job_name")}
                    disabled={showCheckbox}
                  />
                  <span className="ml-1">Job Name</span>
                </label>
              </div>
            </fieldset>

            {openOptionDeleteJob && (
              <fieldset className="border border-gray-300 rounded-md px-3 py-2 min-w-fit">
                <legend className="px-1 text-gray-700 font-semibold">Action</legend>

                <div className="flex items-center flex-wrap gap-2">
                  <input
                    type="checkbox"
                    id="hidden-show-select"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                    onChange={(e) => setShowCheckbox(e.target.checked)}
                    checked={showCheckbox}
                    disabled={!openOptionDeleteJob}
                  />

                  <label
                    htmlFor="hidden-show-select"
                    className="ml-1 cursor-pointer select-none"
                  >
                    Sel
                  </label>

                  {showCheckbox && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-1 py-1 text-[0.8em] rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                      >
                        {isAllSelected ? "Unselect All" : "Select All"}
                      </button>

                      <DeleteIcon
                        onClick={checkedIds.length > 0 ? handleDelete : undefined}
                        className={`w-5 h-5 ml-1 transition-shadow duration-200 ${
                          checkedIds.length > 0
                            ? "text-red-500 cursor-pointer hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      />

                      <CompareArrowsIcon
                        onClick={checkedIds.length > 0 ? handleMove : undefined}
                        className={`w-5 h-5 ml-1 transition-shadow duration-200 ${
                          checkedIds.length > 0
                            ? "text-blue-500 cursor-pointer hover:shadow-[0_0_8px_2px_rgba(59,130,246,0.7)]"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      />

                    </div>
                  )}
                </div>
              </fieldset>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2 mb-4"></p>      
      <hr className="border-gray-300 my-4" />

      <ul className="flex flex-col gap-3">
        <ul className="flex flex-wrap gap-2 overflow-auto max-h-96 custom-scroll">
          
          {sortedEvents.map((event, index) => {
            const eventId = getEventUniqueId(event);
            const isChecked = checkedIds.includes(eventId);

            return (
              <li key={index} className="flex items-center justify-between gap-2">
                {showCheckbox && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      data-job-id={eventId}
                      className="checkable-event w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                      checked={isChecked}
                      onChange={(e) =>
                        handleCheckboxChange(eventId, e.target.checked)
                      }
                    />
                    <span className="ml-2">-</span>
                  </div>
                )}

                <span
                  className="text-sm font-semibold p-1 text-white rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => showOptionAfterClickEvent(event)}
                  style={{
                    backgroundColor: event.color || "#f0f0f0",
                  }}
                >
                  <div>
                  {
                        event.title
                  }

                    <div style={{ fontSize: '10px', padding: '1px', color: 'blue' }}>
                      {[event.machine_name, event.wd_tag].filter(Boolean).join(" : ")}
                    </div>
                  </div>
                  
                  {event.last_get_by && event.status_name === "ongoing" && (
                    <AssignmentIndIcon
                      style={{
                        marginLeft: 4,
                        color: "white",
                        fontSize: "1.5em",
                      }}
                    />
                  )}
                  {event.abnormal_item === 1 && (
                    <NotificationImportantSharpIcon
                      style={{
                        marginLeft: 4,
                        color: "white",
                        fontSize: "1.5em",
                      }}
                    />
                  )}
                  {event.sticker_verify === true && (
                    <VerifiedIcon
                      style={{
                        marginLeft: 4,
                        color: "white",
                        fontSize: "1.5em",
                      }}
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </ul>
    </div>
  );
};

export default ShowmoreData;