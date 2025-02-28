import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import { getSession } from "@/lib/utils/utils";

const JobPlan = ({ data, onClose, setRefresh }) => {
  const [dateType, setDateType] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [showShiftDate, setshowShiftDate] = useState(false);
  const [recurrenceOption, setRecurrenceOption] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState("");
  const [endDate, setEndDate] = useState("");
  var [allLineName, setAllLineName] = useState(false);
  const [refresh] = useState(false);
  const [session, setSession] = useState({});
  const [selectedLineName, setSelectedLineName] = useState("");
  const [isOpen, setIsOpen] = useState(false); // สถานะการแสดงของเมนู
  const [searchTerm, setSearchTerm] = useState(""); // ตัวกรองการค้นหา

  const handleLineNameChange = (lineName) => {
    setSelectedLineName((prevSelectedLineName) => {
      if (prevSelectedLineName.includes(lineName)) {
        // หากค่ามีอยู่แล้วให้ลบออก
        return prevSelectedLineName.filter((name) => name !== lineName);
      } else {
        // หากค่ามิได้เลือก ให้เพิ่มเข้าไปใน array
        return [...prevSelectedLineName, lineName];
      }
    });
  };

  useEffect(() => {
    setAllLineName([]);
    retrieveSession();
  }, [refresh]);

  const retrieveSession = async () => {
    const session = await getSession();
    setSession(session);
    var bufLineName = await fetchLineNames(session);
    //console.log("tt..=>",tt);
    setAllLineName(bufLineName);
    // try {
    //       const lineNamesResponse = await fetch(
    //         "/api/select-line-name/get-line-name"
    //       );
    //       const lineNamesData = await lineNamesResponse.json();
    //       //console.log("lineNamesData.selectLineNames=>", lineNamesData.selectLineNames);
    //       setAllLineName(lineNamesData.selectLineNames.map((line) => line.name));
    // } catch (error) {

    // }
  };

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
        //setSelectLineNames(data.selectLineNames);
        //console.log("data.selectLineNames=>", data.selectLineNames);
        //await setAllLineName(data.selectLineNames.map((line) => line.name));
        //console.log("allLineName=>", allLineName);
        return data.selectLineNames.map((line) => line.name);
      } else {
        console.error("Failed to fetch data:", data.error);
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

  const handleDateTypeChange = (type) => {
    setDateType(type);
  };

  const handleRecurringChange = () => {
    setShowRecurring(!showRecurring);
    if (!showRecurring) {
      setRecurrenceOption("daily");
    } else {
      setRecurrenceOption("");
    }
  };

  const handleSubmit = async (e, checkListTemplate) => {
  
    e.preventDefault();
    let nextDate;
    if (dateType === "dayOfWeek") {
      nextDate = getNextDayOfWeek(selectedDayOfWeek);
    } else if (dateType === "dayOfMonth") {
      nextDate = getNextDayOfMonth(selectedDayOfMonth);
    }
    const requestData = {
      activationDate: nextDate,
      activationTime:
        document.getElementById("activate-time").value == ""
          ? "07:00"
          : document.getElementById("activate-time").value,
      recurrence: showRecurring ? recurrenceOption : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      ...data,
      LINE_NAME: selectedLineName,
      shift_date:document.getElementById("shift-date").checked,   
    };
    //console.log("Request Data:", requestData);
    if (!nextDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a date",
      });
      return;
    }
    if (showRecurring && !endDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select an end date",
      });
      return;
    }
    console.log("requestData", requestData);
    try {
      const response = await fetch("/api/job/activate-job-template-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        next: { revalidate: 10 },
      });

      if (!response.ok) {
      }
      const data = await response.json();
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
    }
  };

  const getNextDayOfWeek = (dayOfWeek) => {
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
    const dayIndex = daysOfWeek.indexOf(dayOfWeek.toLowerCase());
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

    let nextDate = new Date(currentYear, currentMonth, dayOfMonth);

    // if next month has fewer days then add the extra days to the next month in order to get the correct date
    // if next month does not have 30 or 31 then add another month until it does have 30 or 31
    if (nextDate.getMonth() !== currentMonth) {
      while (nextDate.getDate() < dayOfMonth) {
        nextDate = new Date(currentYear, nextDate.getMonth() + 1, 0);
      }
    } else if (dayOfMonth < today.getDate()) {
      nextDate = new Date(currentYear, nextDate.getMonth() + 1, dayOfMonth);
    }

    // Ensure the date is correct even if the next month has fewer days
    nextDate = new Date(currentYear, nextDate.getMonth(), dayOfMonth);
    //add 1 day to the next month
    nextDate.setDate(nextDate.getDate() + 1);

    return nextDate.toISOString().split("T")[0];
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <form
        className="bg-white px-20 py-9 rounded-lg  flex flex-col gap-8 relative overflow-auto"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">Set Advance Activation Date</h1>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <label className="text-md font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                id="dayOfWeek"
                name="dateType"
                checked={dateType === "dayOfWeek"}
                onChange={() => handleDateTypeChange("dayOfWeek")}
                className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center"
              />
              <span>Day of the Week</span>
            </label>
            <label className="text-md font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                id="dayOfMonth"
                name="dateType"
                checked={dateType === "dayOfMonth"}
                onChange={() => handleDateTypeChange("dayOfMonth")}
                className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center"
              />
              <span>Day of the Month</span>
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
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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

          <div className="flex items-center gap-2">
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
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input
              type="checkbox"
              id="shift-date"
              name="shift-date"
              className="transform scale-150 rounded-full h-3 w-3 flex items-center justify-center"
            />
           
            <label htmlFor="recurring" className="text-md font-semibold">
             Shift Date
            </label>
          </div>

          {showRecurring && (
            <div className="flex flex-col gap-2">
              <label htmlFor="recurrence" className="text-sm font-semibold">
                Recurrence
              </label>
              <select
                id="recurrence"
                name="recurrence"
                value={recurrenceOption}
                onChange={(e) => setRecurrenceOption(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <label htmlFor="end-date" className="text-sm font-semibold">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                name="end-date"
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              />
              <label htmlFor="activate-time" className="text-sm font-semibold">
                Activate Time
              </label>
              <input
                type="time"
                id="activate-time"
                name="activate-time"
                //value="07:00"
                //onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              />
              <label htmlFor="activate-time" className="text-sm font-semibold">
                Select Line Name
              </label>
              <div
                id={"allLinePanel-" + data.jobTemplateID}
                className="relative"
              >
                {/* ปุ่มที่แสดงสำหรับคลิกเปิดเมนู */}
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="border border-gray-300 rounded-md p-2 w-full text-left"
                >
                  {selectedLineName.length > 0
                    ? `${selectedLineName.length} item selected`
                    : "Select Line Name"}
                </button>

                {/* เมนูที่สามารถเปิด/ปิดได้ */}
                {isOpen && (
                  <div className="absolute left-0 bottom-full -translate-y-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  {/* ช่องค้นหาหรือกรอง */}
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-b p-2 w-full"
                  />
                  <div className="max-h-60 overflow-auto">
                    {/* แสดงรายการ checkbox */}
                    {[...new Set(allLineName)] // ลบค่าซ้ำ
                      .filter((lineName) =>
                        lineName.toLowerCase().includes(searchTerm.toLowerCase())
                      ) // ฟิลเตอร์ตามคำค้นหา
                      .map((lineName) => (
                        <label
                          key={lineName} // ใช้ lineName เป็น key เพราะตอนนี้ไม่ซ้ำแล้ว
                          className="flex items-center gap-2 p-2"
                        >
                          <input
                            type="checkbox"
                            value={lineName}
                            checked={selectedLineName.includes(lineName)} // ตรวจสอบการเลือก
                            onChange={() => handleLineNameChange(lineName)} // อัปเดตค่าเมื่อเลือก
                            className="rounded-md"
                          />
                          {lineName}
                        </label>
                      ))}
                  </div>
                </div>
                )}
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
          className="bg-blue-700 text-white font-bold py-2 px-4 self-end hover:bg-blue-800 shadow-lg rounded-sm"
        >
          Save
        </button>
       


      </form>
    </div>
  );
};

export default JobPlan;
