"use client";
import { useEffect, useState } from "react";

const useFetchProfiles = (workgroup_id) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/profile-group/get-profile-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workgroup_id,
          }),
        });

        const data = await res.json();
        setProfiles(data.profileGroup || []);
      } catch (error) {
        setError(error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [workgroup_id]);

  return { profiles, loading, error };
};

export default useFetchProfiles;