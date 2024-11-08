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
        setLineNames(data.LINE_NAMES || []); // ตั้งค่า lineNames
        setWorkgroupNames(data.WORKGROUP_NAMES || []); // ตั้งค่า workgroupNames
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
