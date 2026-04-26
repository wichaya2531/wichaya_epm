import { useState, useEffect } from "react";

const useFetchReport2 = (refresh, start, end, workgroupSelect, enabled = false) => {
  const [report, setReport]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (!workgroupSelect) return;

    const controller = new AbortController();

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const url = `/api/job/job-report-type-2?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&workgroup=${encodeURIComponent(workgroupSelect)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Fetched report data:", data);
        setReport(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") console.error("useFetchReport2 error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
    return () => controller.abort();
  }, [refresh, start, end, workgroupSelect, enabled]);

  return { report, isLoading };
};

export default useFetchReport2;
