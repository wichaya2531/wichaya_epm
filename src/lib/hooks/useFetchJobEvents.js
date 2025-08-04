// http://localhost:3000/api/job/get-job-events?workgroup_id=6629f7235c49892a9ddf6b6b
import { useState, useEffect } from "react";
import { config } from "@/config/config.js";


const useFetchJobEvents = (workgroup_id,selectedType,selectedPlanType,refresh = null) => {
    const [events, setEvents] = useState([]);
    const [eventLoading, setEventLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {

    //                 const fetchJobEvents = async () => {
    //                     setEventLoading(true);
    //                     setError(null);
    //                     try {
    //                         const res = await fetch(`/api/job/get-job-events?workgroup_id=${workgroup_id}&type=${selectedType}&plantype=${selectedPlanType}`, { next: { revalidate: 10 } });
    //                         const data = await res.json();
    //                         console.log("data5 -> ", data);                            
    //                         setEvents(data.events);
    //                         setEventLoading(false);
    //                     } catch (error) {
    //                         setError(error);
    //                         setEventLoading(false);
    //                     }
    //                 };
    //     if(workgroup_id){
    //         setEventLoading(true);
    //         fetchJobEvents();
    //     }                
                   

    // }, [workgroup_id,selectedType, refresh]);


                useEffect(() => {
                const fetchStream = async () => {
                    setEventLoading(true);
                    setError(null);
                    setEvents([]); // เคลียร์ก่อนโหลดใหม่

                    try {
                    const res = await fetch(`/api/job/get-job-events?workgroup_id=${workgroup_id}&type=${selectedType}&plantype=${selectedPlanType}`);
                    const reader = res.body?.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    if (!reader) throw new Error("ไม่สามารถอ่าน stream ได้");

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        let boundary;
                        while ((boundary = buffer.indexOf('\n')) >= 0) {
                        const chunk = buffer.slice(0, boundary).trim();
                        buffer = buffer.slice(boundary + 1);

                        if (chunk) {
                            try {
                            const data = JSON.parse(chunk);
                           // console.log('data.',data);
                            if (Array.isArray(data)) {
                                setEvents(prev => [...prev, ...data]); // เพิ่มทีละก้อน
                            }
                            } catch (err) {
                                 //console.warn("❌ ไม่สามารถ parse JSON ได้:", chunk);
                            }
                        }
                        }
                    }

                    setEventLoading(false);
                    } catch (error) {
                    console.error("โหลด stream ล้มเหลว", error);
                    setError(error);
                    setEventLoading(false);
                    }
                };

                if (workgroup_id) {
                    fetchStream();
                }
                }, [workgroup_id, selectedType, selectedPlanType, refresh]);



    return { events, eventLoading, error };
};

export default useFetchJobEvents;
