import { useState, useEffect } from "react";
import { config } from "@/config/config.js";
import { FadeLoader } from "react-spinners";

const useFetchReport1 = (refresh, start, end, workgroupSelect, enabled = false) => {
  const [report, setReport] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // ✅ เริ่มต้นเป็น false จะไม่โชว์โหลดตั้งแต่แรก

  useEffect(() => {
    if (!enabled) return;                 // ✅ สำคัญ: ยังไม่กด Pull ก็ไม่ทำงาน
    if (!workgroupSelect) return;         // ✅ กัน workgroup ว่าง

    const controller = new AbortController();

    console.log('workgroupSelect',workgroupSelect);  


    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/job/job-report1?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&workgroup=${encodeURIComponent(workgroupSelect)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 10 },
            signal: controller.signal,
          }
        );

        const data = await response.json();
        console.log('data',data);

        setReport(data);
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
    return () => controller.abort();
  }, [refresh, start, end, workgroupSelect, enabled]); // ✅ ต้องมีครบ

  return { report, isLoading };
};

export default useFetchReport1;