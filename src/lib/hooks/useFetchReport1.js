import { useState, useEffect } from "react";
import { config } from "@/config/config.js";
const useFetchReport1 = (refresh) => {
  const [report, setReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/job/job-report1`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 10 },
        });
        const data = await response.json();
        console.log("data from useFetchReport1 ",data);
        setReport(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [refresh]);
  return { report, isLoading };
};
export default useFetchReport1;
