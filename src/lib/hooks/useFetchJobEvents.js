import { useState, useEffect, useMemo } from "react";
import moment from "moment";

function getFixedMonthGrid(year, month, weekStartsOn = 0) {
  const first = new Date(year, month - 1, 1);
  const day = first.getDay();
  const diffToStart = (day - weekStartsOn + 7) % 7;

  const start = new Date(first);
  start.setHours(0, 0, 0, 0);
  start.setDate(first.getDate() - diffToStart);

  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getCurrentMonthGrid(weekStartsOn = 0) {
  const now = new Date();
  return getFixedMonthGrid(now.getFullYear(), now.getMonth() + 1, weekStartsOn);
}

const useFetchJobEvents = (
  workgroup_id,
  selectedType,
  selectedPlanType,
  refresh = null,
  date = null,
  currentMonth
) => {
  //console.log("currentMonth in hook", currentMonth);

  // ✅ ใช้ useMemo คำนวณช่วงเวลาใหม่ทุกครั้งที่เดือนเปลี่ยน
  const range = useMemo(() => {
    let start, end;

    if (currentMonth) {
      if (typeof currentMonth === "string") {
        const [y, m] = currentMonth.split("-").map(Number);
        ({ start, end } = getFixedMonthGrid(y, m, 0));
      } else if (moment.isMoment(currentMonth)) {
        const y = currentMonth.year();
        const m = currentMonth.month() + 1;
        ({ start, end } = getFixedMonthGrid(y, m, 0));
      } else if (currentMonth instanceof Date) {
        const y = currentMonth.getFullYear();
        const m = currentMonth.getMonth() + 1;
        ({ start, end } = getFixedMonthGrid(y, m, 0));
      }
    } else {
      ({ start, end } = getCurrentMonthGrid(0));
    }

    const startISO = moment(start).startOf("day").toISOString();
    const endISO = moment(end).endOf("day").toISOString();

    //console.log("📅 Range:", moment(start).format("YYYY-MM-DD"), "→", moment(end).format("YYYY-MM-DD"));
    return { startISO, endISO };
  }, [currentMonth]);

  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ ใช้ range.startISO / range.endISO แทน start / end เก่า
  useEffect(() => {
    const fetchStream = async () => {
      setEventLoading(true);
      setError(null);
      setEvents([]);
      
      //console.log("Fetching events for range:", range.startISO, "to", range.endISO);
      
      try {
        const res = await fetch(
          `/api/job/get-job-events?workgroup_id=${workgroup_id}&type=${selectedType}&plantype=${selectedPlanType}&start=${range.startISO}&end=${range.endISO}`
        );

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        if (!reader) throw new Error("ไม่สามารถอ่าน stream ได้");

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let boundary;
          while ((boundary = buffer.indexOf("\n")) >= 0) {
            const chunk = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);

            if (chunk) {
              try {
                const data = JSON.parse(chunk);
                if (Array.isArray(data)) {
                  setEvents((prev) => [...prev, ...data]);
                }
              } catch (err) {
                // console.warn("❌ parse error:", chunk);
              }
            }
          }
        }

        setEventLoading(false);
        //console.log("✅ Final events:", events);
      } catch (error) {
        console.error("โหลด stream ล้มเหลว", error);
        setError(error);
        setEventLoading(false);
      }
    };

    if (workgroup_id) {
      fetchStream();
    }
  }, [workgroup_id, selectedType, selectedPlanType, refresh, range.startISO, range.endISO]);

  return { events, eventLoading, error };
};

export default useFetchJobEvents;
