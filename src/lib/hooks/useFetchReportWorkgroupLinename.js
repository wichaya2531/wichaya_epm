import { useState, useEffect } from "react";

const useFetchReportWorkgroupLinename = (refresh) => {
  const [lineNames, setLineNames] = useState([]);
  const [workgroupNames, setWorkgroupNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/job/job-reportWorkgroupLinename`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 10 },
        });
        const data = await response.json();

        // ตั้งค่า lineNames ให้รวม WORKGROUP_NAME ด้วย
        setLineNames(
          data.map((item) => ({
            name: item.LINE_NAME,
            workgroup: item.WORKGROUP_NAME,
          }))
        );
        setWorkgroupNames([
          ...new Set(data.map((item) => item.WORKGROUP_NAME)),
        ]); // ดึงชื่อ workgroup ที่ไม่ซ้ำกัน
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [refresh]);

  return { lineNames, workgroupNames, isLoading };
};

export default useFetchReportWorkgroupLinename;
