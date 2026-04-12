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

  const abortRef = useRef(null);

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

  const fetchNormal = useCallback(
    async ({
      workgroup_id,
      startTime,
      endTime,
      status,
      profileSelected,
      user_id,
    }) => {
      // trim + normalize อีกชั้น
      workgroup_id = normalize(workgroup_id)?.toString().trim();
      startTime = normalize(startTime)?.toString().trim();
      endTime = normalize(endTime)?.toString().trim();
      status = normalize(status);
      profileSelected = normalize(profileSelected);
      user_id = normalize(user_id)?.toString().trim();

      if (!workgroup_id || !startTime || !endTime) {
        console.warn("[useFetchJobs] ❗️skip: missing params");
        return;
      }

      cleanup();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setJobs([]);

      try {
        const q = new URLSearchParams({
          starttime: startTime,
          endtime: endTime,
          ...(profileSelected ? { profile: profileSelected } : {}),
          ...(status && status !== "All" ? { status } : {}),
          ...(user_id ? { user_id } : {}),
        });

        const url = `/api/job/get-jobs-from-workgroup/${encodeURIComponent(
          workgroup_id
        )}?${q.toString()}&t=${Date.now()}`;

        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (abortRef.current !== controller) {
          console.warn("[useFetchJobs] response arrived but already superseded");
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (abortRef.current !== controller) {
          console.warn("[useFetchJobs] json arrived but already superseded");
          return;
        }

        if (data?.status !== 200) {
          throw new Error(data?.error || "Failed to fetch jobs");
        }

        const items = Array.isArray(data?.jobs) ? data.jobs : [];

       // console.log("ALL JOBS:", items);
       // console.log("TOTAL JOBS:", items.length);

        setJobs(items);
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
    [cleanup]
  );

  // 👉 จุดสำคัญ: ทำคีย์ dependency จาก "ทุกค่าที่ควรกระตุ้นการโหลดใหม่"
  const depsKey = useMemo(() => {
    return JSON.stringify({
      startTime,
      endTime,
      status,
      profileSelected,
      others,
      workgroup_id: user?.workgroup_id ?? null,
      user_id: user?._id ?? null,
    });
  }, [
    startTime,
    endTime,
    status,
    profileSelected,
    others,
    user?.workgroup_id,
    user?._id,
  ]);

  // auto-fetch เมื่อ ready หรือเมื่อค่าใน depsKey เปลี่ยน
  useEffect(() => {
    const wg = normalize(user?.workgroup_id);
    const st = normalize(startTime);
    const et = normalize(endTime);
    const uid = normalize(user?._id);

    if (wg && st && et) {
      fetchNormal({
        workgroup_id: wg,
        startTime: st,
        endTime: et,
        status,
        profileSelected,
        user_id: uid,
      });
    }

    return () => {
      cleanup();
    };
  }, [depsKey, fetchNormal, cleanup]);

  // ฟังก์ชันสาธารณะ re-fetch แบบสั่งเอง
  const fetchJobs = useCallback(
    (override = {}) => {
      const st = normalize(override.startTime) ?? normalize(startTime);
      const et = normalize(override.endTime) ?? normalize(endTime);
      const stt = normalize(override.status) ?? normalize(status);
      const prof =
        normalize(override.profileSelected) ?? normalize(profileSelected);
      const wg =
        normalize(override.workgroup_id) ?? normalize(user?.workgroup_id);
      const uid = normalize(override.user_id) ?? normalize(user?._id);

      return fetchNormal({
        workgroup_id: wg,
        startTime: st,
        endTime: et,
        status: stt,
        profileSelected: prof,
        user_id: uid,
      });
    },
    [
      startTime,
      endTime,
      status,
      profileSelected,
      user?.workgroup_id,
      user?._id,
      fetchNormal,
    ]
  );

  return { jobs, setJobs, isLoading, error, fetchJobs };
};

export default useFetchJobs;