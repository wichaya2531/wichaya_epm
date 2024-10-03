// http://localhost:3000/api/job/get-job-events?workgroup_id=6629f7235c49892a9ddf6b6b
import { useState, useEffect } from "react";
import { config } from "@/config/config.js";


const useFetchJobEvents = (workgroup_id, refresh = null) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobEvents = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/job/get-job-events?workgroup_id=${workgroup_id}`, { next: { revalidate: 10 } });
                const data = await res.json();
               // console.log("data5 -> ", data);
                setEvents(data.events);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchJobEvents();
    }, [workgroup_id, refresh]);

    return { events, loading, error };
};

export default useFetchJobEvents;
