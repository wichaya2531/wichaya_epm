// http://localhost:3000/api/job/get-job-events?workgroup_id=6629f7235c49892a9ddf6b6b
import { useState, useEffect } from "react";
import { config } from "@/config/config.js";


const useFetchJobEvents = (workgroup_id,selectedType,refresh = null) => {
    const [events, setEvents] = useState([]);
    const [eventLoading, setEventLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

                    const fetchJobEvents = async () => {
                        setEventLoading(true);
                        setError(null);
                        try {
                            const res = await fetch(`/api/job/get-job-events?workgroup_id=${workgroup_id}&type=${selectedType}`, { next: { revalidate: 10 } });
                            const data = await res.json();
                            //console.log("data5 -> ", data);                            
                            setEvents(data.events);
                            setEventLoading(false);
                        } catch (error) {
                            setError(error);
                            setEventLoading(false);
                        }
                    };
        if(workgroup_id){
            setEventLoading(true);
            fetchJobEvents();
        }                
                   

    }, [workgroup_id,selectedType, refresh]);

    return { events, eventLoading, error };
};

export default useFetchJobEvents;
