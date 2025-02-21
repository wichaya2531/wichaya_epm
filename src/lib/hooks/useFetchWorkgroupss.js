"use client";
import { useState, useEffect } from "react";

const useFetchWorkgroups = (refresh) => {
  const [workgroups, setWorkgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workgroup/get-workgroups`);
        if (!res.ok) throw new Error("Failed to fetch workgroups");

        const json = await res.json();
        console.log("Fetched Workgroups:", json); // ✅ Debugging

        if (json && json.workgroups) {
          // ✅ ปรับให้ใช้ WORKGROUP_NAME และ _id
          const formattedWorkgroups = json.workgroups.map((group) => ({
            id: group._id,
            name: group.WORKGROUP_NAME, // ✅ ใช้ WORKGROUP_NAME เป็นชื่อ
          }));

          setWorkgroups(formattedWorkgroups);
        } else {
          setWorkgroups([]);
        }
      } catch (err) {
        console.error("Error fetching workgroups:", err);
        setError(err.message);
        setWorkgroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refresh]);

  return { workgroups, loading, error };
};

export default useFetchWorkgroups;
