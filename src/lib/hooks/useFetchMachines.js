import { config } from "@/config/config.js";
import { useState, useEffect } from "react";

const useFetchMachines = (user) => {
  
  //console.log("*****useFetchMachines****",user);
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
   //console.log('user in useFetchMachines ',user);

  useEffect(() => {

    //console.log('user in useFetchMachines',user);
    const fetchMachines = async () => {
      try {
          const res = await fetch(`/api/machine/get-machines?workgroup_id=${user.workgroup_id}&filter=${user.job_id}`, {
          //const res = await fetch(`/api/machine/get-machines?workgroup_id=${user.workgroup_id}`, {
          next: { revalidate: 10 },
        });
        const data = await res.json();

        //console.log("data from usefetch machine",data);
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
      
  
  }, []);

  return { machines, loading, error, setMachines };
};

export default useFetchMachines;
