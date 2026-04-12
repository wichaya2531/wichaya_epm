
import { useEffect, useState } from "react";

const useFetchJobValue = (job_id, refresh=null,view=null) => {
    //console.time("useFetchJobValue");
    //console.log('job_id',job_id);
    const [jobData, setJobData] = useState([]);
    const [jobItems, setJobItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    //const [view, setView] = useState(true);


    useEffect(() => {
        const fetchJobValue = async () => {
            //setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/job/get-job-value?job_id=${job_id}`, { next: { revalidate: 10 } });
                const data = await response.json();
                console.log("jobItemData...=>",data);
                console.log('data.jobData',data.jobData);
                //console.timeEnd("useFetchJobValue");
                if (data.status === 200) {
                    setJobData(data.jobData);
                    setJobItems(data.jobItemData);
                    setIsLoading(false);
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
       // if(view){
            fetchJobValue();
        //}
       
    }, [job_id, refresh,view]);

    return { jobData, jobItems, isLoading, error };
}

export default useFetchJobValue;
