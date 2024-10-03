
import { useState, useEffect } from 'react';
import { config } from '@/config/config.js';

const useFetchJobItemTemplate = (jobItemTemplate_id, refresh = null) => {
    const [jobItemTemplate, setJobItemTemplate] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobItemTemplate = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/job-item-template/get-job-item-template/${jobItemTemplate_id}`, { next: { revalidate: 10 } });
                const data = await response.json();
                if (data.status === 200) {
                    setJobItemTemplate(data.jobItemTemplates);
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobItemTemplate();
    }, [jobItemTemplate_id, refresh]);

    return { jobItemTemplate, isLoading, error };
}

export default useFetchJobItemTemplate;
