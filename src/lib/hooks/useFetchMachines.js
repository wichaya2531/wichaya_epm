import { useState, useEffect, useRef } from "react";

const useFetchMachines = (user) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.workgroup_id) return;

    let aborted = false;
    const controller = new AbortController();

    const fetchStream = async () => {
      setMachines([]);
      setLoading(true);
      setError(null);

      try {
        const url = `/api/machine/get-machines?workgroup_id=${encodeURIComponent(
          user.workgroup_id
        )}&filter=${encodeURIComponent(user?.job_id ?? "")}&stream=1`;

        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/x-ndjson",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // ถ้า server คืน JSON ปกติ (ไม่ได้เข้าโหมดสตรีม) ก็รองรับไว้ด้วย
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/x-ndjson")) {
          const data = await res.json();
          if (!aborted) {
            setMachines(data?.machines ?? []);
          }
          return;
        }

        // ----- อ่าน NDJSON ทีละ chunk -----
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const obj = JSON.parse(trimmed);

              // ข้าม record ประเภท error/meta ถ้าไม่ใช้
              if (obj?.type === "error") {
                if (!aborted) setError(new Error(obj.message || "stream error"));
                continue;
              }
              if (!aborted) {
                setMachines((prev) => [...prev, obj]);
              }
            } catch (e) {
              // บรรทัดเสียรูปแบบ — ข้าม
            }
          }
        }

        // เหลือเศษท้ายบัฟเฟอร์ (ไม่มี \n) — พยายาม parse ครั้งสุดท้าย
        const last = buffer.trim();
        if (last) {
          try {
            const obj = JSON.parse(last);
            if (obj?.type !== "error" && !aborted) {
              setMachines((prev) => [...prev, obj]);
            }
          } catch {}
        }
      } catch (e) {
        if (!aborted) setError(e);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchStream();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [user?.workgroup_id, user?.job_id]);

  return { machines, loading, error, setMachines };
};

export default useFetchMachines;
