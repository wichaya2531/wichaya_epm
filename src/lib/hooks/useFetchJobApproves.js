import { useState, useEffect } from "react";
import { config } from "@/config/config.js";

const useFetchJobApproves = (user_id, refresh=null) => {
    const [jobApproves, setjobApproves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/approval/get-await-job-approving?user_id=${user_id}`, { next: { revalidate: 10 } });
                const json = await res.json();
                setjobApproves(json.data);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user_id, refresh]);

    return { jobApproves, loading, error };
}

export default useFetchJobApproves;
