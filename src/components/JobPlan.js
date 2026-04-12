import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import { getSession } from "@/lib/utils/utils";
import HelpIcon from "@mui/icons-material/Help";

const JobPlan = ({ data, onClose, setRefresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateType, setDateType] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurrenceOption, setRecurrenceOption] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [allLineName, setAllLineName] = useState([]);
  const [refresh] = useState(false);

  const [selectedLineName, setSelectedLineName] = useState([]);
  const [lineItems, setLineItems] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [shiftDate, setShiftDate] = useState(false);
  const [weekendSkip, setWeekendSkip] = useState(false);

  const [machines, setMachines] = useState([]);
  const [openMachineDropdownId, setOpenMachineDropdownId] = useState(null);

  useEffect(() => {
    setAllLineName([]);
    retrieveSession();
  }, [refresh]);

  useEffect(() => {
    try {
      let localStorageMachines = localStorage.getItem("machines");
      //console.log("🔥 raw localStorage machines:", localStorageMachines);

      if (localStorageMachines !== null) {
        localStorageMachines = JSON.parse(localStorageMachines);

        //console.log("✅ parsed machines:", localStorageMachines);

        setMachines(Array.isArray(localStorageMachines) ? localStorageMachines : []);
      } else {
        setMachines([]);
      }
    } catch (error) {
      console.error("Error parsing machines from localStorage:", error);
      setMachines([]);
    }
  }, []);

  useEffect(() => {
    console.log("🚀 machines state updated:", machines);
    console.table(machines);
  }, [machines]);

  const retrieveSession = async () => {
    const sessionData = await getSession();
    const bufLineName = await fetchLineNames(sessionData);
    setAllLineName(bufLineName);
  };

  const fetchLineNames = async (userSession) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userSession.user_id);

      const response = await fetch(`/api/select-line-name/get-line-name`, {
        method: "POST",
        body: formData,
      });

      const dataResponse = await response.json();
      if (dataResponse.status === 200) {
        return dataResponse.selectLineNames.map((line) => line.name);
      } else {
        console.error("Failed to fetch data:", dataResponse.error);
      }
    } catch (error) {
      console.error("Error fetching line names.:", error);
    }
    return [];
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleHelpButton = () => {
    window.open("./help?filter=open_job_by_planning", "_blank");
  };

  const handleDateTypeChange = (type) => {
    if (!showRecurring) return;

    setDateType(type);

    if (type === "dayOfWeek") {
      setRecurrenceOption("weekly");
      setSelectedDayOfMonth("");
    } else if (type === "dayOfMonth") {
      setRecurrenceOption("monthly");
      setSelectedDayOfWeek("");
    } else {
      setRecurrenceOption("daily");
    }
  };

  const handleRecurringChange = () => {
    const nextShowRecurring = !showRecurring;
    setShowRecurring(nextShowRecurring);

    if (nextShowRecurring) {
      if (dateType === "dayOfMonth") {
        setRecurrenceOption("monthly");
      } else if (dateType === "dayOfWeek") {
        setRecurrenceOption("weekly");
      } else {
        setRecurrenceOption("daily");
      }
    } else {
      setRecurrenceOption("");
      setDateType("");
      setSelectedDayOfWeek("");
      setSelectedDayOfMonth("");
      setShiftDate(false);
      setWeekendSkip(false);
      setStartDate("");
      setEndDate("");
      setIsOpen(false);
      setSearchTerm("");
      setSelectedLineName([]);
      setLineItems([]);
      setOpenMachineDropdownId(null);
    }
  };

  const handleAddLineName = (lineName) => {
    if (!lineName) return;

    const uniqueId =
      Date.now().toString() + "_" + Math.random().toString(36).slice(2, 9);

    setLineItems((prev) => [
      ...prev,
      {
        id: uniqueId,
        name: lineName,
        showInput: false,
        mc_tag: {
          WD_TAG: "",
          MACHINE_NAME: "",
        },
      },
    ]);

    setSelectedLineName((prev) => {
      if (prev.includes(lineName)) return prev;
      return [...prev, lineName];
    });
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      const uniqueNames = [...new Set(updated.map((item) => item.name))];
      setSelectedLineName(uniqueNames);
      return updated;
    });

    if (openMachineDropdownId === id) {
      setOpenMachineDropdownId(null);
    }
  };

  const clearAllLineItems = () => {
    setLineItems([]);
    setSelectedLineName([]);
    setOpenMachineDropdownId(null);
  };

  const toggleLineInput = (id) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, showInput: !item.showInput } : item
      )
    );

    setOpenMachineDropdownId((prev) => (prev === id ? null : prev));
  };

  const handleLineNoteChange = (id, value) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              mc_tag:
                typeof value === "string"
                  ? {
                      ...(typeof item.mc_tag === "object" && item.mc_tag !== null
                        ? item.mc_tag
                        : { WD_TAG: "", MACHINE_NAME: "" }),
                      MACHINE_NAME: value,
                    }
                  : value,
            }
          : item
      )
    );
  };

  const handleSelectMachine = (id, machine) => {
    handleLineNoteChange(id, {
      WD_TAG: machine.wd_tag || "",
      MACHINE_NAME: machine.name || "",
    });
    setOpenMachineDropdownId(null);
  };

  const getFilteredMachines = (keyword) => {
    const safeKeyword = (keyword || "").toLowerCase().trim();
    if (!safeKeyword) return [];

    return machines
      .filter((m) => {
        const machineName = (m.name || "").toLowerCase();
        const wdTag = (m.wd_tag || "").toLowerCase();
        return machineName.includes(safeKeyword) || wdTag.includes(safeKeyword);
      })
      .slice(0, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let nextDate;

    if (dateType === "dayOfWeek") {
      nextDate = getNextDayOfWeek(selectedDayOfWeek);
    } else if (dateType === "dayOfMonth") {
      nextDate = getNextDayOfMonth(selectedDayOfMonth);
    } else {
      nextDate = startDate || "";
    }

    const requestData = {
      activationDate: nextDate,
      activationTime:
        document.getElementById("activate-time")?.value === ""
          ? "07:00"
          : document.getElementById("activate-time")?.value || "07:00",
      recurrence: showRecurring ? recurrenceOption : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      ...data,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      LINE_NAME: lineItems.map((item) => item.name),
      LINE_ITEMS: lineItems.map((item) => ({
        name: item.name,
        mc_tag:
          typeof item.mc_tag === "object"
            ? item.mc_tag
            : {
                WD_TAG: "",
                MACHINE_NAME: item.mc_tag || "",
              },
      })),
      shift_date: shiftDate,
      weekend_skip: weekendSkip,
    };

    console.log("📦 requestData:", requestData);

    if (!nextDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a date",
      });
      setIsSubmitting(false);
      return;
    }

    if (showRecurring && !endDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select an end date",
      });
      setIsSubmitting(false);
      return;
    }

    if (showRecurring && !startDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a start date",
      });
      setIsSubmitting(false);
      return;
    }

    if (showRecurring && lineItems.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select at least one line",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/job/activate-job-template-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        next: { revalidate: 10 },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.message || "Request failed");
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Checklist template activated successfully",
      });

      onClose();
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to activate Checklist template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextDayOfWeek = (dayOfWeek) => {
    if (!startDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a start date",
      });
      return null;
    }

    const startDateObj = new Date(startDate);
    const startDayOfWeek = startDateObj
      .toLocaleString("en-us", { weekday: "long" })
      .toLowerCase();

    const finalDayOfWeek = dayOfWeek || startDayOfWeek;

    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const today = new Date();
    const dayIndex = daysOfWeek.indexOf(finalDayOfWeek.toLowerCase());
    const todayIndex = today.getDay();

    let daysUntilNext = dayIndex - todayIndex;
    if (daysUntilNext <= 0) {
      daysUntilNext += 7;
    }

    today.setDate(today.getDate() + daysUntilNext);
    return today.toISOString().split("T")[0];
  };

  const getNextDayOfMonth = (dayOfMonth) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextDate = new Date(currentYear, currentMonth, Number(dayOfMonth));

    if (nextDate.getMonth() !== currentMonth) {
      while (nextDate.getDate() < Number(dayOfMonth)) {
        nextDate = new Date(currentYear, nextDate.getMonth() + 1, 0);
      }
    } else if (Number(dayOfMonth) < today.getDate()) {
      nextDate = new Date(
        currentYear,
        nextDate.getMonth() + 1,
        Number(dayOfMonth)
      );
    }

    nextDate = new Date(currentYear, nextDate.getMonth(), Number(dayOfMonth));
    nextDate.setDate(nextDate.getDate() + 1);

    return nextDate.toISOString().split("T")[0];
  };

  const filteredLineNames = [...new Set(allLineName)].filter((lineName) =>
    lineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <form
        className="bg-white px-20 py-9 rounded-lg w-[900px] max-h-[90vh] flex flex-col gap-8 relative overflow-auto"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">
          <HelpIcon
            className="text-blue-600 cursor-pointer mr-2"
            onClick={handleHelpButton}
          />
          Plan :{" "}
          <span id="planing-tag" className="text-blue-600">
            {data.jobTemplateName}
          </span>
        </h1>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="recurring"
              name="recurring"
              checked={showRecurring}
              onChange={handleRecurringChange}
              className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center"
            />
            <label htmlFor="recurring" className="text-md font-semibold">
              Recurring
            </label>
          </div>

          <div
            className={`flex items-center gap-4 ${
              !showRecurring ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <label className="text-md font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                id="dayOfWeek"
                name="dateType"
                checked={dateType === "dayOfWeek"}
                onChange={() => handleDateTypeChange("dayOfWeek")}
                disabled={!showRecurring}
                className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center disabled:cursor-not-allowed"
              />
              <span>&nbsp;&nbsp; Day of the Week</span>
            </label>

            <label className="text-md font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                id="dayOfMonth"
                name="dateType"
                checked={dateType === "dayOfMonth"}
                onChange={() => handleDateTypeChange("dayOfMonth")}
                disabled={!showRecurring}
                className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center disabled:cursor-not-allowed"
              />
              <span>&nbsp;&nbsp;Day of the Month</span>
            </label>
          </div>

          {dateType === "dayOfWeek" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="day" className="text-sm font-semibold">
                Select Day of the Week
              </label>
              <select
                id="day"
                name="day"
                className="border border-gray-300 rounded-md p-2"
                value={selectedDayOfWeek}
                onChange={(e) => setSelectedDayOfWeek(e.target.value)}
              >
                <option value="" disabled>
                  Select Day of the Week
                </option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          )}

          {dateType === "dayOfMonth" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="date" className="text-md font-semibold">
                Select Day of the Month
              </label>
              <select
                id="date"
                name="date"
                className="border border-gray-300 rounded-md p-2"
                value={selectedDayOfMonth}
                onChange={(e) => setSelectedDayOfMonth(e.target.value)}
              >
                <option value="" disabled>
                  Select Day of the Month
                </option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            className={`flex items-center gap-2 ${
              !showRecurring ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="checkbox"
              id="shift-date"
              name="shift-date"
              checked={shiftDate}
              onChange={(e) => setShiftDate(e.target.checked)}
              disabled={!showRecurring}
              className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center disabled:cursor-not-allowed"
            />
            <label htmlFor="shift-date" className="text-md font-semibold">
              &nbsp; Shift Date
            </label>

            <span className="mx-2" />

            <input
              type="checkbox"
              id="weekend-skip"
              name="weekend-skip"
              checked={weekendSkip}
              onChange={(e) => setWeekendSkip(e.target.checked)}
              disabled={!showRecurring}
              className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center disabled:cursor-not-allowed"
            />
            <label htmlFor="weekend-skip" className="text-md font-semibold">
              &nbsp;&nbsp;Weekend Skip
            </label>
          </div>

          {showRecurring && (
            <div className="relative grid grid-cols-2 items-start gap-4 w-full">
              <div className="relative flex flex-col gap-2 min-w-0">
                <label
                  htmlFor="recurrence"
                  className="pointer-events-none absolute left-3 top-0 bg-white px-1 text-gray-500 text-sm transition-all z-10"
                >
                  Recurrence
                </label>

                <select
                  id="recurrence"
                  name="recurrence"
                  value={recurrenceOption}
                  onChange={(e) => setRecurrenceOption(e.target.value)}
                  className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="2monthly">2Monthly</option>
                  <option value="3monthly">3Monthly</option>
                  <option value="6monthly">6Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>

                <div className="relative">
                  <label
                    htmlFor="start-date"
                    className="pointer-events-none absolute left-3 top-0 bg-white px-1 text-gray-500 text-sm transition-all z-10"
                  >
                    Start Date
                  </label>

                  <input
                    type="date"
                    id="start-date"
                    name="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="end-date"
                    className="pointer-events-none absolute left-3 top-0 bg-white px-1 text-gray-500 text-sm transition-all z-10"
                  >
                    End Date
                  </label>

                  <input
                    type="date"
                    id="end-date"
                    name="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="activate-time"
                    className="pointer-events-none absolute left-3 top-0 bg-white px-1 text-gray-500 text-sm transition-all z-10"
                  >
                    Activate Time
                  </label>

                  <input
                    type="time"
                    id="activate-time"
                    name="activate-time"
                    className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                    defaultValue="07:00"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="line-name" className="text-sm font-semibold">
                    เลือก Line Name
                  </label>

                  <div
                    id={"allLinePanel-" + data.jobTemplateID}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="border border-gray-300 rounded-md p-2 w-full text-left"
                    >
                      {lineItems.length > 0
                        ? `${lineItems.length} row selected`
                        : "Select Line Name"}
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 bottom-full -translate-y-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-b p-2 w-full"
                        />

                        <div className="max-h-60 overflow-auto">
                          {filteredLineNames.map((lineName) => (
                            <button
                              key={lineName}
                              type="button"
                              onClick={() => handleAddLineName(lineName)}
                              className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                                +
                              </span>
                              <span className="break-all">{lineName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col gap-2 min-w-0">
                <div className="relative block">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold">Additional</label>

                    <button
                      type="button"
                      onClick={clearAllLineItems}
                      className="px-2 py-1 rounded bg-red-50 text-red-600 text-xs hover:bg-red-100"
                    >
                      Clear All
                    </button>
                  </div>

                  <div
                    id="line-container"
                    className="border border-gray-300 rounded-md p-3 h-[300px] overflow-y-auto flex flex-col gap-3"
                  >
                    {lineItems.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        ยังไม่ได้เลือก Line
                      </div>
                    ) : (
                      lineItems.map((item, index) => {
                        const machineKeyword =
                          typeof item.mc_tag === "object"
                            ? `${item.mc_tag.WD_TAG || ""} ${item.mc_tag.MACHINE_NAME || ""}`
                            : item.mc_tag || "";

                        const filteredMachines = getFilteredMachines(machineKeyword);

                        //console.log("🔍 filter keyword:", machineKeyword);
                        //console.log("🔍 filteredMachines:", filteredMachines);

                        return (
                          <div
                            key={item.id}
                            className="border rounded-md px-3 py-3 bg-gray-50 flex flex-col gap-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm break-all">
                                  {index + 1}. {item.name}
                                </div>

                                <div className="text-[0.8em] text-gray-700 break-all mt-2">
                                  {typeof item.mc_tag === "object"
                                    ? `${item.mc_tag.WD_TAG || ""}${
                                        item.mc_tag.WD_TAG && item.mc_tag.MACHINE_NAME
                                          ? " - "
                                          : ""
                                      }${item.mc_tag.MACHINE_NAME || ""}`
                                    : item.mc_tag || ""}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleLineInput(item.id)}
                                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                                >
                                  {item.showInput ? "Hide Tag" : "Add Tag"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeLineItem(item.id)}
                                  className="px-2 py-1 rounded bg-gray-700 text-white text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {item.showInput && (
                              <div className="flex flex-col gap-1 relative">
                                <input
                                  type="text"
                                  value={
                                    typeof item.mc_tag === "object"
                                      ? item.mc_tag.MACHINE_NAME || item.mc_tag.WD_TAG || ""
                                      : item.mc_tag || ""
                                  }
                                  onChange={(e) => {
                                    handleLineNoteChange(item.id, {
                                      ...(typeof item.mc_tag === "object" &&
                                      item.mc_tag !== null
                                        ? item.mc_tag
                                        : { WD_TAG: "", MACHINE_NAME: "" }),
                                      MACHINE_NAME: e.target.value,
                                    });
                                    setOpenMachineDropdownId(item.id);
                                  }}
                                  onFocus={() => setOpenMachineDropdownId(item.id)}
                                  placeholder="ค้นหา Machine หรือ WD_TAG"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />

                                {openMachineDropdownId === item.id &&
                                  ((typeof item.mc_tag === "object" &&
                                    (((item.mc_tag.WD_TAG || "").trim() !== "") ||
                                      ((item.mc_tag.MACHINE_NAME || "").trim() !== ""))) ||
                                    (typeof item.mc_tag !== "object" && item.mc_tag !== "")) &&
                                  filteredMachines.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow max-h-40 overflow-auto z-20">
                                      {filteredMachines.map((m, i) => (
                                        <button
                                          key={`${item.id}_${m.wd_tag}_${i}`}
                                          type="button"
                                          onClick={() => handleSelectMachine(item.id, m)}
                                          className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                          <div className="text-sm font-medium">
                                            {m.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {m.wd_tag}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="bg-red-700 text-white font-bold py-2 px-4 self-end absolute top-0 right-0 hover:bg-red-800 shadow-lg rounded-sm"
          onClick={onClose}
        >
          <CloseIcon className="size-18" />
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`text-white font-bold py-2 px-4 self-end shadow-lg rounded-sm ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-700 hover:bg-blue-800"
          }`}
        >
          {isSubmitting ? "Waiting..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default JobPlan;