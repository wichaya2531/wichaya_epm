// src/lib/hooks/useFetchJobs.js
"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useFetchUser from "./useFetchUser";

const useFetchJobs = (params = null) => {
  // รองรับเรียกแบบ useFetchJobs() หรือส่ง object
  const parsed =
    typeof params === "object" && params !== null
      ? params
      : { startTime: null, endTime: null, status: null, profileSelected: null };

  // ดึงเฉพาะคีย์หลักที่ API ใช้ และรวบรวม "คีย์อื่น ๆ" ที่อยากให้กระตุ้น re-fetch
  const { startTime, endTime, status, profileSelected, ...others } = parsed;

  const { user } = useFetchUser();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ควบคุมสตรีมล่าสุด เพื่อยกเลิก / ตรวจว่าใครเป็น "ตัวล่าสุด"
  const abortRef = useRef(null);
  // กันรายการซ้ำเมื่อสตรีมมาเป็น batch
  const seenIdsRef = useRef(new Set());

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
  }, []);

  // normalize: แปลง "" และ null/undefined → null
  const normalize = (v) => (v === "" || v == null ? null : v);

  // push items แบบกันซ้ำ และกัน race (เช็ค controller ล่าสุด)
  const pushItems = useCallback((items, controller) => {
    if (abortRef.current !== controller) return; // ถูกแซงแล้ว ไม่อัปเดต
    setJobs((prev) => {
      const next = [...prev];
      for (const item of items) {
        const key = item?._id ?? item?.id ?? JSON.stringify(item);
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key);
          next.push(item);
        }
      }
      return next;
    });
  }, []);

  const fetchStream = useCallback(
    async ({ workgroup_id, startTime, endTime, status, profileSelected,user_id }) => {
      // trim + normalize อีกชั้น
      workgroup_id = normalize(workgroup_id)?.toString().trim();
      startTime = normalize(startTime)?.toString().trim();
      endTime = normalize(endTime)?.toString().trim();

      status = normalize(status);
      profileSelected = normalize(profileSelected);

      if (!workgroup_id || !startTime || !endTime) {
        console.warn("[useFetchJobs] ❗️skip: missing params");
        return;
      }

      // ยกเลิกของเดิมก่อน แล้วตั้ง controller ใหม่
      cleanup();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setJobs([]); // เคลียร์ของเก่าเวลา re-fetch
      seenIdsRef.current.clear();

      let sizeOfPack = 0;

      try {
        // อย่าส่ง profile ถ้าไม่มีค่า
        const q = new URLSearchParams({
          starttime: startTime,
          endtime: endTime,
          ...(profileSelected ? { profile: profileSelected } : {}),
          ...(status && status !== "All" ? { status } : {}),
          ...(user_id ? { user_id } : {}),  // ✅ เพิ่มบรรทัดนี้
        });

        // กันแคช + รองรับสตรีม (NDJSON/SSE)
        const url = `/api/job/get-jobs-from-workgroup/${encodeURIComponent(
          workgroup_id
        )}?${q.toString()}&t=${Date.now()}`;

        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Accept: "application/x-ndjson, text/event-stream, application/json",
          },
          signal: controller.signal,
          keepalive: true,
        });

        if (abortRef.current !== controller) {
          console.warn("[useFetchJobs] response arrived but already superseded");
          return;
        }

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();

          if (abortRef.current !== controller) {
            console.warn("[useFetchJobs] reader loop aborted by newer call]");
            try {
              reader.cancel();
            } catch {}
            return;
          }

          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

          // process ตาม \n
          let nl;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const raw = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            const line = raw.trim();
            if (!line) continue;

            try {
              const data = JSON.parse(line);
              sizeOfPack += line.length;
              const items = Array.isArray(data) ? data : [data];
              pushItems(items, controller);
            } catch {
              // ถ้าเป็น SSE (event: ... \n data: {...})
              const idx = line.indexOf("data:");
              if (idx >= 0) {
                const payload = line.slice(idx + 5).trim();
                try {
                  const data = JSON.parse(payload);
                  sizeOfPack += payload.length;
                  const items = Array.isArray(data) ? data : [data];
                  pushItems(items, controller);
                } catch {}
              }
            }
          }

          if (done) {
            // flush ก้อนสุดท้าย (กรณีไม่มี \n ปิดท้าย)
            const last = buffer.trim();
            if (last) {
              try {
                const data = JSON.parse(last);
                sizeOfPack += last.length;
                const items = Array.isArray(data) ? data : [data];
                pushItems(items, controller);
              } catch {
                const idx = last.indexOf("data:");
                if (idx >= 0) {
                  const payload = last.slice(idx + 5).trim();
                  try {
                    const data = JSON.parse(payload);
                    sizeOfPack += payload.length;
                    const items = Array.isArray(data) ? data : [data];
                    pushItems(items, controller);
                  } catch {}
                }
              }
            }
            break;
          }
        }
      } catch (e) {
        if (e.name === "AbortError") {
          console.warn("[useFetchJobs] aborted");
          return;
        }
        console.error("[useFetchJobs] error:", e);
        if (abortRef.current === controller) setError(e);
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    [cleanup, pushItems]
  );

  // 👉 จุดสำคัญ: ทำคีย์ dependency จาก "ทุกค่าที่ควรกระตุ้นการโหลดใหม่"
  const depsKey = useMemo(() => {
    return JSON.stringify({
      startTime,
      endTime,
      status,
      profileSelected, // ✅ ใส่เพื่อให้เปลี่ยนแล้ว re-fetch
      others, // อาจมี refresh, reloadKey, อื่น ๆ
      workgroup_id: user?.workgroup_id ?? null,
      user_id:user?._id,
    });
  }, [startTime, endTime, status, profileSelected, others, user?.workgroup_id,user?._id]);

  // auto-fetch เมื่อ ready หรือเมื่อค่าใน depsKey เปลี่ยน (ครอบคลุม refresh/reloadKey ด้วย)
  useEffect(() => {
    const wg = normalize(user?.workgroup_id);
    const st = normalize(startTime);
    const et = normalize(endTime);
    const uid = normalize(user?._id);

    if (wg && st && et) {
      fetchStream({
        workgroup_id: wg,
        startTime: st,
        endTime: et,
        status,
        profileSelected,
        user_id:uid,
      });
    }

    return () => {
      cleanup();
    };
    // ใช้ depsKey เดียวพอ ครอบคลุมทุกค่า
  }, [depsKey, fetchStream, cleanup]);

  // ฟังก์ชันสาธารณะ re-fetch แบบสั่งเอง
  const fetchJobs = useCallback(
    (override = {}) => {
      const st = normalize(override.startTime) ?? normalize(startTime);
      const et = normalize(override.endTime) ?? normalize(endTime);
      const stt = normalize(override.status) ?? status;
      const prof =
        normalize(override.profileSelected) ?? normalize(profileSelected);
      const wg =
        normalize(override.workgroup_id) ?? normalize(user?.workgroup_id);


      return fetchStream({
        workgroup_id: wg,
        startTime: st,
        endTime: et,
        status: stt,
        profileSelected: prof, // ✅ ส่งต่อไป API
        user_id,
      });
    },
    [
      startTime,
      endTime,
      status,
      profileSelected,
      user?.workgroup_id,
      user?._id,
      fetchStream,
    ]
  );

  return { jobs, setJobs, isLoading, error, fetchJobs };
};

export default useFetchJobs;
