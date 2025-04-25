"use client";
import { useEffect, useState } from "react";
import { config } from "@/config/config.js";
import useFetchUser from "./useFetchUser";
import { useRef } from "react";

const useFetchJobs = (refresh = null) => {
  //console.log("*****call useFetch job****");
  const hasRun = useRef(false); // ใช้กันรันซ้ำ

  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  useEffect(() => {
    const fetchJobs = async (workgroup_id) => {
      //console.log("use fetch job.");
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/job/get-jobs-from-workgroup/${workgroup_id}`,
          { next: { revalidate: 10 } }
        );
        const data = await response.json();
        console.log("/api/job/get-jobs-from-workgroup",data);
        //console.log("Data from await..");
        if (data.status === 200) {
          setJobs(data.jobs);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchJobs(user.workgroup_id);
    }
  }, [user, refresh]);

*/


useEffect(() => {


  const fetchStream = async (workgroup_id) => {
    const res = await fetch(`/api/job/get-jobs-from-workgroup/${workgroup_id}`);
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) return;

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
           // console.log('📦 ได้ข้อมูล:', data.length);

            if (Array.isArray(data)) {
              setJobs(prev => [...prev, ...data]);
            }

          } catch (err) {
            //console.error('❌ JSON parse error:', err, chunk);
          }
        }
      }
    }
  };


  if (user?.workgroup_id && !hasRun.current) {
    hasRun.current = true;
    //console.log("✅ เรียก fetchStream ครั้งเดียว ด้วย workgroup_id =", user.workgroup_id);
    fetchStream(user.workgroup_id);
  }
}, [user]);
  

  return { jobs, setJobs, isLoading, error };
};

export default useFetchJobs;
