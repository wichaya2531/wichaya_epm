import { useState, useEffect } from "react";
import { config } from "@/config/config.js";
import { FadeLoader } from "react-spinners";
const useFetchReport1 = (refresh,start, end,workgroupSelect) => {
  //console.log('workgroupSelect in useFetchReport',workgroupSelect);
  //console.log('User',user);

  const [report, setReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {      
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/job/job-report1?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&workgroup=${encodeURIComponent(workgroupSelect)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 10 },
        });
        const data = await response.json();
        //console.log("data from useFetchReport1 ",data);
        setReport(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    //console.log('workgroupSelect in useFetchReport1',workgroupSelect);
   // if(workgroupSelect!==undefined){
      fetchReport();

    //}else{
      //setIsLoading(false);
   // }
       
     //console.log('isLoading',isLoading)
    
  
  }, [refresh]);
  return { report, isLoading };
};
export default useFetchReport1;
