
import { useEffect, useState } from "react";
import { config } from "@/config/config.js";

const useFetchJobItemTemplates = (jobTemplate_id, refresh = null) => {
    const [jobItemTemplates, setJobItemTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobItemTemplates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/job-item-template/get-job-item-template-from-jobtemplate/${jobTemplate_id}`, { next: { revalidate: 10 } });
                const data = await response.json();
                if (data.status === 200) {
                    setJobItemTemplates(data.jobItemTemplates);
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobItemTemplates();
    }, [jobTemplate_id, refresh]);

    return { jobItemTemplates, isLoading, error };
}

export default useFetchJobItemTemplates;