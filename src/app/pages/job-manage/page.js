"use client";
import Layout from "@/components/Layout.js";
import { useState } from "react";
import Link from "next/link.js";
import KeyboardTabIcon from "@mui/icons-material/KeyboardTab";
import JobsTableQuickView from "@/components/JobsTable_quickview";
import useFetchUser from "@/lib/hooks/useFetchUser";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import Cookies from "js-cookie";

{
  /* <div className="flex items-center gap-4 mb-4 p-4 bg-white ">
                    <Image src="/assets/card-logo/template.png" alt="wd logo" width={50} height={50} className="rounded-full" />
                    <h1 className="text-3xl font-bold text-slate-900">Create Checklist Template</h1>
                </div> */
}
// app/pages/job-manage/page.js

//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
  username: process.env.NEXT_PUBLIC_MQT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
}
//---------------------------------------------->>
export default function Page() {

 useEffect(() => {
      Cookies.set("history_page", window.location.href, { expires: 1 }); // ตั้งค่า cookie ให้หมดอายุใน 1 วัน
      //const prevHistory = Cookies.get("history_page");
      //console.log("history_page:", prevHistory);       
  }, []);


  const params = useSearchParams();
  const [jobIds, setJobIds] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const { user, isLoading: usersloading } = useFetchUser();


  //-----------MQTT----------------------------------------->>
  const mqttClient = mqtt.connect(connectUrl, options);
  mqttClient.on("connect", () => {});
  mqttClient.on("error", (err) => {
    mqttClient.end();
  });
   mqttClient.on('message', (topic, message) => {
       console.log("่page/job-manage ข้อมูลขาเข้า "+topic+" : "+message);
       setRefresh(true);
       //setTimeout(() => {
             //setRefresh(false);
       //}, 3000);
  });
    const handleEventToMqtt = async () => {
        try{
            mqttClient.publish(user?.workgroup_id, "refresh");
        }catch(err){
              console.err(err);
        }                
              //alert('handleEventToMqtt');    
    }
           
  

useEffect(() => {
  if (user?.workgroup_id){
          //console.log(' user.workgroup_id', user.workgroup_id);
            mqttClient.subscribe(user.workgroup_id, (err) => {
            if (!err) {
            } else {
              console.error("Subscription error: ", err);
            }
          });
  } 
}, [user]);

  //------------------------------------------------------->>

  useEffect(() => {
    // รันครั้งเดียวตอน mount เท่านั้น
    const encoded = params.get("jobs") ?? "";
    try {
      const decoded = JSON.parse(atob(encoded));
      setJobIds(decoded);
      //console.log("jobIds", decoded);
    } catch {
      console.warn("ไม่สามารถ decode jobs ได้");
      setJobIds([]);
    }
  }, []); // 👈 ใส่ [] เพื่อให้รันครั้งเดียว




  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex items-center justify-between w-full flex-wrap">
        <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl w-full sm:w-auto">
          <div className="flex items-center">
            <div className="flex items-center gap-4">
              <Link href="/pages/dashboard">
                <ArrowBackIosNewIcon />
              </Link>
              <Image
                src="/assets/card-logo/management.png"
                alt="wd logo"
                width={50}
                height={50}
              />
              <h1 className="text-3xl font-bold text-slate-900">
                Checklist management
              </h1>
            </div>
          </div>
          {/* <h1 className="text-sm font-bold text-secondary flex items-center">
            Acitvate Checklist, plan Checklist, and remove Checklist
          </h1> */}
        </div>
        {/* <Link
          className="rounded-full bg-blue-600 text-white shadow-lg h-12 sm:w-96 flex flex-row gap-4 items-center font-sans text-md px-8 hover:drop-shadow-2xl hover:shadow-2xl mb-4"
          href="/pages/activate-remove-job"
        >
          Activate or Remove The Checklists.
          <KeyboardTabIcon />
        </Link> */}
      </div>

      <div className="flex flex-col gap-5 w-full text-sm font-thin mb-4 p-4 bg-white rounded-xl">
        <div className="min-w-full">
          <JobsTableQuickView 
              refresh={refresh}
              jobIds={jobIds}
              handleEventToMqtt={handleEventToMqtt}
          />
        </div>
      </div>
    </Layout>
  );
};

//export default Page;
