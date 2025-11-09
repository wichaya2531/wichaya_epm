"use client";
import Layout from "@/components/Layout";
import TableComponent from "@/components/TableComponent";
import useFetchJobApproves from "@/lib/hooks/useFetchJobApproves";
import useFetchUser from "@/lib/hooks/useFetchUser";
import Link from "next/link";
import Image from "next/image";
import JobsTable from "@/components/JobsTable";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useState ,useEffect } from "react";
const jobApprovesHeader = [
  "ID",
  "Checklist Name",
  //"Document no.",
  "Line Name",
  "Status",
  "submittedAt",
  "Action",
];

// import {  useRef, useCallback } from "react";
// //------------------สำหรับการ เชื่อมต่อ MQTT ------->>
// import mqtt from "mqtt";
// import TableComponentAdmin from "@/components/TableComponentAdmin";
// const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
// const options = {
//   username: process.env.NEXT_PUBLIC_MQT_USERNAME,
//   password: process.env.NEXT_PUBLIC_MQT_PASSWORD,
//   reconnectPeriod: 2000,
// };
// //---------------------------------------------->>

//console.log("jobApprovesHeader_xxx.."
// );
const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshEvent, setRefreshEvent] = useState(false);
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const {
    jobApproves,
    loading: jobApprovesLoading,
    error: jobApprovesError,
    refetch ,
  } = useFetchJobApproves(user._id,refreshEvent);

//-----------MQTT----------------------------------------->>
// const mqttClient = useRef(null);
// useEffect(() => {
//   const client = mqtt.connect(connectUrl, options);
//   mqttClient.current = client;

//   const onConnect = () => {
//     console.log("✅ MQTT Connected on Page Job Approve");
//     if (user?.workgroup_id) client.subscribe(user.workgroup_id);
//   };
//     //-------ส่วนของการกำหนดค่า timeout การรับข้อความ -----    
//     let mqttClientReceiveTimeout = false; // ตัวแปรเก็บ timeout ของ การรับข้อความ
//     setTimeout(() => {
//          //mqttClient.current && mqttClient.current.end(true);
//          mqttClientReceiveTimeout = true;
//     }, process.env.NEXT_PUBLIC_MQTT_MESSAGE_TIMEOUT*60);
//     //-------------------------------------------->>  
//   client.on("connect", onConnect);
//   client.on("error", (err) => console.error("❌ MQTT Error:", err));
//   client.on("close", () => console.warn("⚠️ MQTT Disconnected"));
//   client.on("message", (t, m) => {
//     console.log("📩", t, m.toString());
//     if(mqttClientReceiveTimeout)return;
//           // ✅ โหลดตารางใหม่ทันที
//       //await refetch();

//       // (ถ้ายังอยากโชว์เอฟเฟกต์ refresh ให้คงไว้ได้)
//       setRefreshEvent(true);
//       setTimeout(() => setRefreshEvent(false), 3000);
//   });

//   return () => {
//     client.end(true);
//     mqttClient.current = null;
//   };
// }, []);

// // ถ้า user เปลี่ยน ค่อย subscribe เพิ่ม
// useEffect(() => {
//   if (user?.workgroup_id && mqttClient.current?.connected) {
//     mqttClient.current.subscribe(user.workgroup_id, (err) =>
//       err ? console.error("Subscription error:", err)
//           : console.log("📡 Subscribed:", user.workgroup_id)
//     );
//   }
// }, [user?.workgroup_id]);

// // ใช้เรียกตอนกดปุ่ม/เหตุการณ์เท่านั้น (อย่าเรียกตรง ๆ ระหว่าง render)
// const handleEventToMqtt = useCallback(() => {
//   const c = mqttClient.current;
//   if (!c || c.disconnected) {
//     console.warn("MQTT not connected");
//     return;
//   }
//   if (!user?.workgroup_id) {
//     console.warn("No topic");
//     return;
//   }
//   try {
//     c.publish(user.workgroup_id, "refresh");
//   } catch (err) {
//     console.error("Error Code: 121\n", err?.stack ?? err);
//   }
// }, [user?.workgroup_id]);
//------------------------------------------------------->>


const handleJobReviewByNavigate = (job_id) => {
    //console.log("Review job_id:", job_id);
    // You can use Next.js router to navigate programmatically if needed
    //return;
    window.open(`/pages/job-review?job_id=${job_id}`, '_blank');
}





  //console.log("jobApproves List => ", jobApproves);
  const jobApprovesBody =
    jobApproves &&
    jobApproves.map((jobApprove, index) => {
      //console.log("jobApprove => ", jobApprove);
      return {
        ID: index + 1,
        "Checklist Name": jobApprove.job_name,
        //"Document no.": jobApprove.job_doc_number,
        "Line Name": jobApprove.job_line_name,
        Status: (
          <div
            style={{ backgroundColor: jobApprove.job_status_color }}
            className="py-1 px-2 rounded-lg text-black font-bold shadow-xl text-[12px] ipadmini:text-sm"
          >
            {jobApprove.job_status ? jobApprove.job_status : "pending"}
          </div>
        ),
        submittedAt: new Date(jobApprove.job_submittedAt).toLocaleString(),
        Action: (
          <div>
            <button
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center"
              onClick={() => handleJobReview(jobApprove.job_id)}
            >
              View
            </button>
          </div>
        ),
      };
    });
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 ">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/approve.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Approval
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Approve/Disapprove Checklist.
        </h1>
      </div>
      <div className="mb-4 p-4 bg-white rounded-xl">
        {/* <h1 className="text-md font-bold text-secondary flex items-center">
          There are {Array.isArray(jobApproves) ? jobApproves.length : 0}{" "}
          submitted jobs, that you need to be reviewed.
        </h1> */}
        {/* <hr className="border-gray-300 mt-4" /> */}
        {/* <TableComponent
          headers={jobApprovesHeader}
          datas={jobApprovesBody}
          TableName=
          {
              <>
                Waiting Approve [{jobApprovesBody?.length}
                {jobApprovesLoading && <span className="animate-pulse ml-3">..... ⏳</span>}
                ]
              </>
          }          
          PageSize={5}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          refreshEvent={refreshEvent}
          isLoading={jobApprovesLoading}
        /> */}
        <JobsTable  
            jobFileterStatus={"waiting for approval"} 
            filterStatusDisable={true} 
            editBtnDisable={true} 
            approveByNavigate={true} 
            viewBtnDisable={true}
            handleJobReviewByNavigate={handleJobReviewByNavigate} />
      </div>
    </Layout>
  );
};

export default Page;
