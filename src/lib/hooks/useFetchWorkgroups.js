'use client';
import { useState, useEffect } from 'react';
import { config } from '@/config/config';


const useFetchWorkgroups = (refresh) => {
    const [workgroups, setWorkgroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/workgroup/get-workgroups`, { next: { revalidate: 10 } });
                const json = await res.json();
                setWorkgroups(json.workgroups);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refresh]);

    return { workgroups, loading, error };
}

export default useFetchWorkgroups;
