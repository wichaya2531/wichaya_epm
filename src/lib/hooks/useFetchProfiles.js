'use client'
import { config } from "@/config/config.js";
import { useEffect, useState } from "react";

const useFetchProfiles = (workgroup_id) => {

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await fetch("/api/profile-group/get-profile-group", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        workgroup_id : workgroup_id
                    }),
                    });
                const data = await res.json();
                //console.log("data.profileGroup", data.profileGroup);
                //console.log("แสดงจำนวนผู้ใช้งานทั้งหมดในระบบ users:",data);
                setProfiles(data.profileGroup || []);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };
        fetchProfiles();
    }, [workgroup_id]);

    return { profiles, loading, error };
};

export default useFetchProfiles;