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

import {  useRef, useCallback } from "react";
//------------------สำหรับการ เชื่อมต่อ MQTT ------->>
import mqtt from "mqtt";
const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
  username: process.env.NEXT_PUBLIC_MQT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
  reconnectPeriod: 2000,
};
//---------------------------------------------->>
export default function Page() {
  const [jobIds, setJobIds] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const { user, isLoading: usersloading } = useFetchUser();

  const [refreshSkip, setRefreshSkip] = useState(false);
 

  useEffect(() => {
    const stored = sessionStorage.getItem("jobIds");
    if (stored) {
      try {
        setJobIds(JSON.parse(stored));
      } catch {
        console.error("Invalid JSON in sessionStorage");
      }
    }
  }, []);

//-----------MQTT----------------------------------------->>
const mqttClient = useRef(null);
useEffect(() => {
  const client = mqtt.connect(connectUrl, options);
  mqttClient.current = client;

  const onConnect = () => {
    console.log("✅ MQTT Connected on Page Job Manage");
    if (user?.workgroup_id) client.subscribe(user.workgroup_id);
  };
  client.on("connect", onConnect);
  client.on("error", (err) => console.error("❌ MQTT Error:", err));
  client.on("close", () => console.warn("⚠️ MQTT Disconnected"));
  client.on("message", (t, m) => {
        try {
          if (document.getElementById('page-expire').innerHTML==='true'){ 
                      console.log('Block by page expire!!');
                      return;
          }
        } catch (error) {
                console.error("Error Code: 120\n", error?.stack ?? error);
        }     
    console.log("📩", t, m.toString());
    setRefresh((prev) => !prev);
    //if(!refreshSkip){
         //setRefresh(true);  
   // }
    
  });

  return () => {
    client.end(true);
    mqttClient.current = null;
  };
}, []);

// ถ้า user เปลี่ยน ค่อย subscribe เพิ่ม
useEffect(() => {
  if (user?.workgroup_id && mqttClient.current?.connected) {
    mqttClient.current.subscribe(user.workgroup_id, (err) =>
      err ? console.error("Subscription error:", err)
          : console.log("📡 Subscribed:", user.workgroup_id)
    );
  }
}, [user?.workgroup_id]);

// ใช้เรียกตอนกดปุ่ม/เหตุการณ์เท่านั้น (อย่าเรียกตรง ๆ ระหว่าง render)
const handleEventToMqtt = useCallback(() => {
 // setRefreshSkip(true); 
 // setTimeout(() => {
  //         setRefreshSkip(false); 
 // }, 3000);

  const c = mqttClient.current;
  if (!c || c.disconnected) {
    console.warn("MQTT not connected");
    return;
  }
  if (!user?.workgroup_id) {
    console.warn("No topic");
    return;
  }
  try {
    c.publish(user.workgroup_id, "refresh");
  } catch (err) {
    console.error("Error Code: 121\n", err?.stack ?? err);
  }
}, [user?.workgroup_id]);
//------------------------------------------------------->>

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
