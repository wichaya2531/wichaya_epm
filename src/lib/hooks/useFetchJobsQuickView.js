// src/lib/hooks/useFetchJobs.js
"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useFetchUser from "./useFetchUser";

const useFetchJobsQuickView = (params = null) => {
  const parsed =
    typeof params === "object" && params !== null ? params : { jobIds: null };

  // รับเฉพาะ jobIds จากผู้ใช้ (อย่างเดียว)
  const { jobIds, ...others } = parsed;
  const { user } = useFetchUser();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const latestKeyRef = useRef("");

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
  }, []);

  // normalize รองรับ array
  const normalize = (v) => {
    if (v === "" || v == null) return null;
    if (Array.isArray(v)) {
      const trimmed = v.map((x) => (x == null ? "" : String(x).trim())).filter(Boolean);
      return trimmed.length ? trimmed : null;
    }
    return String(v).trim();
  };

  // กันซ้ำ + ป้องกัน race
  const pushItems = useCallback((items, controller) => {
    if (abortRef.current !== controller) return;
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

  // ===== สตรีมด้วย POST ไปยัง route เดิมที่มี [workgroup_id] และส่ง body แค่ { jobIds } =====
  const fetchStream = useCallback(
    async ({ workgroup_id, jobIds }) => {
      workgroup_id = normalize(workgroup_id);
      jobIds = normalize(jobIds);
      
      //console.log('OK ฉันทำงานแล้ว A' );  

      if (!workgroup_id) {
        console.warn("[useFetchJobs] ❗️skip: missing workgroup_id");
        return;
      }
      //console.log('OK ฉันทำงานแล้ว B');  

      // สร้างคีย์กันเรียกซ้ำ
      // const key = JSON.stringify({ workgroup_id, jobIds });
      // if (latestKeyRef.current === key) {
      //   // console.log("[fetchStream] same-key skip");
      //   return;
      // }
     // latestKeyRef.current = key;
     //  console.log('OK ฉันทำงานแล้ว C');  

      // เตรียมสตรีมใหม่
      cleanup();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setJobs([]);
      seenIdsRef.current.clear();

      let sizeOfPack = 0;

      try {
        //console.log('OK ฉันทำงานแล้ว try');  
        const url = `../api/job/get-jobs-from-workgroup-byIds`;

        const res = await fetch(url, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Accept: "application/x-ndjson, text/event-stream, application/json",
          },
          body: JSON.stringify({ jobIds }), // ✅ ส่งเฉพาะ jobIds
          signal: controller.signal,
          keepalive: true,
        });

        if (abortRef.current !== controller) {
          try {
            res.body?.cancel?.();
          } catch {}
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
            try {
              reader.cancel();
            } catch {}
            return;
          }

          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

          // NDJSON (หรือรองรับกรณี SSE: data: ...)
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
        if (e.name !== "AbortError") {
          console.error("[useFetchJobs] error:", e);
          if (abortRef.current === controller) setError(e);
        }
      } finally {
        if (abortRef.current === controller) {
          // console.log("[useFetchJobs] sizeOfPack:", sizeOfPack);
          setIsLoading(false);
        }
      }
    },
    [cleanup, pushItems]
  );

  // คีย์กระตุ้นโหลดใหม่: jobIds + workgroup_id (จาก user)
  const depsKey = useMemo(() => {
    const jobIdsKey = Array.isArray(jobIds) ? jobIds.join(",") : jobIds ?? null;
    return JSON.stringify({
      jobIds: jobIdsKey,
      others, // เผื่อคุณส่ง refresh/reloadKey
      workgroup_id: user?.workgroup_id ?? null,
    });
  }, [jobIds, others, user?.workgroup_id]);

  // auto-fetch เมื่อ ready
  useEffect(() => {
    const wg = normalize(user?.workgroup_id);

    if (wg) {
      Promise.resolve().then(() =>
        fetchStream({
          workgroup_id: wg,
          jobIds,
        })
      );
    }

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  // ฟังก์ชัน public สำหรับสั่งโหลดใหม่ (override เฉพาะที่จำเป็น)
  const fetchJobs = useCallback(
    (override = {}) => {
      const wg = normalize(override.workgroup_id) ?? normalize(user?.workgroup_id);
      const jids = normalize(override.jobIds) ?? normalize(jobIds);

      return fetchStream({
        workgroup_id: wg,
        jobIds: jids,
      });
    },
    [jobIds, user?.workgroup_id, fetchStream]
  );

  return { jobs, setJobs, isLoading, error, fetchJobs };
};

export default useFetchJobsQuickView;
