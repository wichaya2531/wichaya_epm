
import { useEffect, useState } from "react";

const useFetchJobValue = (job_id, refresh=null) => {
    const [jobData, setJobData] = useState([]);
    const [jobItems, setJobItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobValue = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/job/get-job-value?job_id=${job_id}`, { next: { revalidate: 10 } });
                const data = await response.json();
                if (data.status === 200) {
                    setJobData(data.jobData);
                    setJobItems(data.jobItemData);
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobValue();
    }, [job_id, refresh]);

    return { jobData, jobItems, isLoading, error };
}

export default useFetchJobValue;
