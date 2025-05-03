import { config } from "@/config/config.js";
import { useState, useEffect } from "react";

const useFetchMachines = (user) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {

    //console.log('user in useFetchMachines',user.workgroup_id);
    const fetchMachines = async () => {
      try {
        const res = await fetch(`/api/machine/get-machines?workgroup_id=${user.workgroup_id}`, {
          next: { revalidate: 10 },
        });
        const data = await res.json();
        setMachines(data.machines);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    if(user.workgroup_id){
      fetchMachines();
    }
      
  
  }, [user]);

  return { machines, loading, error, setMachines };
};

export default useFetchMachines;
