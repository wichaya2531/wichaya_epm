
import { useEffect, useState } from "react";
import { config } from "@/config/config.js";


const useFetchStatus = (refresh) => {
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/status/get-all-status`);
                if (!response.ok) {
                    throw new Error("Failed to fetch status");
                }
                const data = await response.json();
                setStatus(data.status);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };
        fetchStatus();
    }, [refresh]);

    return { status, loading, error };
};

export default useFetchStatus;