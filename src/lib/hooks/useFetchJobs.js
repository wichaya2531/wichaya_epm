// src/lib/hooks/useFetchJobs.js
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import useFetchUser from "./useFetchUser";

const useFetchJobs = (params = null) => {
  // รองรับเรียกแบบ useFetchJobs() หรือส่ง object
  const { startTime, endTime, status } =
    typeof params === "object" && params !== null
      ? params
      : { startTime: null, endTime: null, status: null };

  const { user } = useFetchUser();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // เก็บตัวควบคุมสตรีม/รีเควสล่าสุด เพื่อยกเลิกได้
  const abortRef = useRef(null);

  // ใช้เก็บ id กันซ้ำ (ถ้าสตรีมส่งมาเป็น batch หลายก้อน)
  const seenIdsRef = useRef(new Set());

  const cleanup = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const fetchStream = useCallback(
    async ({ workgroup_id, startTime, endTime, status }) => {
      if (!workgroup_id || !startTime || !endTime) return;

      cleanup(); // ยกเลิกของเดิมก่อน
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setJobs([]); // เคลียร์ของเก่าเวลา re-fetch
      seenIdsRef.current.clear();
       let sizeOfPack=0;   
      try {
        const q = new URLSearchParams({
          starttime: startTime,
          endtime: endTime,
          ...(status && status !== "All" ? { status } : {}),
        });

        const res = await fetch(
          `/api/job/get-jobs-from-workgroup/${workgroup_id}?${q.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl;
         
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);

            if (!line) continue;
            try {
              const data = JSON.parse(line);
              // รองรับทั้ง array และ object เดี่ยว
              sizeOfPack+=line.length;
              const items = Array.isArray(data) ? data : [data];
              //console.log("รับข้อมูลชุดใหม่", items);  
              setJobs((prev) => {
                const next = [...prev];
                for (const item of items) {
                  const key = item._id ?? item.id ?? JSON.stringify(item);
                  if (!seenIdsRef.current.has(key)) {
                    seenIdsRef.current.add(key);
                    next.push(item);
                  }
                }
                return next;
              });
            } catch (e) {
              // ข้ามบรรทัดที่ parse ไม่ได้
            }
          }
        }
        
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e);
        }
      } finally {
        console.log("ขนาดข้อมูลที่รับมา sizeOfPack="+sizeOfPack);
        setIsLoading(false);
        cleanup();
      }
    },
    []
  );

  // ฟังก์ชันสาธารณะให้ component ภายนอกเรียก re-fetch ได้ตลอดเวลา
  const fetchJobs = useCallback(
    (override = {}) => {
      const st = override.startTime ?? startTime;
      const et = override.endTime ?? endTime;
      const stt = override.status ?? status;
      const wg = override.workgroup_id ?? user?.workgroup_id;
      fetchStream({ workgroup_id: wg, startTime: st, endTime: et, status: stt });
    },
    [startTime, endTime, status, user?.workgroup_id, fetchStream]
  );

  // auto-fetch เมื่อ ready หรือเมื่อพารามิเตอร์เปลี่ยน
  useEffect(() => {
    if (user?.workgroup_id && startTime && endTime) {
      fetchStream({
        workgroup_id: user.workgroup_id,
        startTime,
        endTime,
        status,
      });
    }
    return cleanup; // ยกเลิกเมื่อ unmount หรือก่อนรอบใหม่
  }, [user?.workgroup_id, startTime, endTime, status, fetchStream]);

  return { jobs, setJobs, isLoading, error, fetchJobs };
};

export default useFetchJobs;
