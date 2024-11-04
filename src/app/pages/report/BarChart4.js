"use client";
import React, { useState } from "react";
import useFetchReport from "@/lib/hooks/useFetchReport";
import useFetchUsers from "@/lib/hooks/useFetchUser";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Swal from "sweetalert2";
import timeGridPlugin from "@fullcalendar/timegrid";
const BarChart4 = () => {
  const [refresh, setRefresh] = useState(false);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const { report } = useFetchReport(refresh);
  const { user, isLoading: usersloading } = useFetchUsers(refresh);
  const [workgroupDropdownOpen, setWorkgroupDropdownOpen] = useState(false);
  const workgroupColors = {
    "Tooling NEO": "#FFB3B3",
    "Tooling ESD Realtime": "#B3FFC9",
    "HSA Tooling Solvent": "#B3D1FF",
    "HSA Tooling": "#FFB3E6",
    "Tooling Cleaning": "#FFE0B3",
    "Tooling GTL": "#D1B3FF",
    "HSA Tooling Automation": "#B3FFF0",
    "No Workgroup": "#E0E0E0",
    Others: "#F0F0F0",
  };
  const filterReportByWorkgroup = (data, selectedWorkgroup) => {
    if (selectedWorkgroup.length === 0) return data;
    return data.filter((item) =>
      selectedWorkgroup.includes(item.workgroupName)
    );
  };
  const filteredReport = filterReportByWorkgroup(report, selectedWorkgroup);

  const convertToCalendarEvents = (data) => {
    const events = [];
    const dateMap = new Map();
    data.forEach((item) => {
      if (Array.isArray(item.createdAt)) {
        item.createdAt.forEach((date) => {
          const eventDate = new Date(date);
          const dateKey = eventDate.toISOString().split("T")[0];
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, new Map());
          }
          if (!dateMap.get(dateKey).has(item.userName)) {
            dateMap.get(dateKey).set(item.userName, []);
          }
          dateMap
            .get(dateKey)
            .get(item.userName)
            .push({
              title: item.userName,
              backgroundColor: workgroupColors[item.workgroupName] || "#F0F0F0",
              textColor: "#4B5563",
              createdAt: date,
              workgroupName: item.workgroupName,
            });
        });
      }
    });
    dateMap.forEach((userMap, dateKey) => {
      const allEventsForDate = [];
      userMap.forEach((eventsForUser) => {
        allEventsForDate.push(...eventsForUser);
        const displayedEvents = eventsForUser.slice(0, 5);
        events.push(
          ...displayedEvents.map((event) => ({
            title: event.title,
            start: dateKey,
            end: dateKey,
            backgroundColor: event.backgroundColor,
            textColor: "#4B5563",
            borderColor: event.backgroundColor,
          }))
        );
      });
      if (allEventsForDate.length > 5) {
        events.push({
          title: "ดูข้อมูลเพิ่มเติม",
          start: dateKey,
          end: dateKey,
          backgroundColor: "#FFA500",
          textColor: "#4B5563",
          extendedProps: {
            date: dateKey,
            userNames: allEventsForDate,
          },
          classNames: ["more-info"],
          borderColor: "#FFA500",
        });
      }
    });
    return events;
  };
  const handleEventClick = (info) => {
    if (info.event.title === "ดูข้อมูลเพิ่มเติม") {
      const selectedDate = info.event.extendedProps.date;
      const userEvents = info.event.extendedProps.userNames || [];
      const userListHTML = userEvents
        .map((event) => {
          return `
        <div style="background-color: ${
          workgroupColors[event.workgroupName] || "#F0F0F0"
        }; padding: 5px; margin: 2px; border-radius: 4px; color: #4B5563;">
          ${event.title}
        </div>
      `;
        })
        .join("");
      Swal.fire({
        title: "ข้อมูลเพิ่มเติม",
        html: `<div style="color: #4B5563;">วัน: ${selectedDate}</div><div>${userListHTML}</div>`,
        icon: "info",
        confirmButtonText: "ปิด",
      });
    }
  };

  const calendarEvents = convertToCalendarEvents(filteredReport);
  const workgroupOptions = [
    ...new Set(report.map((item) => item.workgroupName)),
  ];

  const toggleWorkgroupDropdown = () =>
    setWorkgroupDropdownOpen(!workgroupDropdownOpen);

  const handleWorkgroupCheckboxChange = (workgroup) => {
    const newSelectedWorkgroup = selectedWorkgroup.includes(workgroup)
      ? selectedWorkgroup.filter((wg) => wg !== workgroup)
      : [...selectedWorkgroup, workgroup];
    setSelectedWorkgroup(newSelectedWorkgroup);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 bg-white rounded-lg p-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workgroup
          </label>
          <button
            onClick={toggleWorkgroupDropdown}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-left bg-white hover:bg-gray-50 focus:outline-none"
          >
            {selectedWorkgroup.length > 0
              ? `Selected ${selectedWorkgroup.length} workgroups`
              : "Select Workgroups"}
          </button>
          {workgroupDropdownOpen && (
            <div className="absolute bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full z-10 shadow-lg">
              {workgroupOptions.map((workgroup, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    id={`workgroup_${index}`}
                    value={workgroup}
                    checked={selectedWorkgroup.includes(workgroup)}
                    onChange={() => handleWorkgroupCheckboxChange(workgroup)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`workgroup_${index}`}
                    className="cursor-pointer"
                  >
                    {workgroup}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(workgroupColors).map(([workgroup, color]) => (
            <div key={workgroup} className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-sm">{workgroup}</span>
            </div>
          ))}
        </div>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek,dayGridDay,timeGridWeek,timeGridDay",
        }}
      />
    </div>
  );
};

export default BarChart4;
