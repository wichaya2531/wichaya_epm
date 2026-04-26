"use client";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import useFetchUsers from "@/lib/hooks/useFetchUsers";
import useFetchCards from "@/lib/hooks/useFetchCards.js";
import useFetchJobs from "@/lib/hooks/useFetchJobs.js";
import JobsTable from "@/components/JobsTable";
import DashboardSummary from "@/components/DashboardSummary";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { login } from "@/lib/utils/utils.js";
import { FaTimes } from "react-icons/fa";


import Cookies from "js-cookie";

const Page = () => {
  //console.log('flush from Page dashboard');
  const [viewMode,setviewMode]=useState(false);
  const [showCards, setShowCards] = useState(true);

  const [refresh, setRefresh] = useState(false);
  const { user, isLoading: userloading } = useFetchUser(refresh);
  const { cards, isLoading: cardsLoading } = useFetchCards(refresh);
  //const { jobs, isLoading: jobsLoading } = useFetchJobs(refresh);
  //const [pageExpire,setPageExpire]=useState(false);

   try{
       localStorage.removeItem("machines"); 
   }catch(err){
       //console.error(err); 
   }



//  useEffect(() => {
//     // อ่าค่า Storage ทั้งหมด 

 
//       let saved = sessionStorage.getItem("machineIds");
//       //console.log("saved", saved);
//       if (saved!==null) {
//           console.log("machineIds foun : ไม่ต้องเสียเวลาโหลดใหม่ ");
//           // แปลงกลับเป็น object
//           const machineIds = JSON.parse(saved);
//           console.log("machineIds", machineIds);

//       } else {
//           console.log("machineIds not found :: โหลดใหม่");
          
//           const dataSimple = { name: "jack" };
//           sessionStorage.setItem("machineIds", JSON.stringify(dataSimple));
//       }

//     // for (let i = 0; i < sessionStorage.length; i++) {
//     //   const key = sessionStorage.key(i);
//     //   const value = sessionStorage.getItem(key);
//     //   console.log(key, "=", value);
//     // }
//   }, []);


  //console.log("refresh",refresh);
//  useEffect(() => {
//    setInterval(() => {
//              //var timerOnPage=document.getElementById('timeout-monitor').innerHTML;
//              //console.log("Dashboard Page Timeout Monitor:",timerOnPage);
//              var _pageExpire=document.getElementById('page-expire').innerHTML;
//              console.log("Dashboard Page Expire Monitor:",_pageExpire);


//    }, 5000);

//  }, []);

// ----------------Cookie ---------------------
useEffect(() => {
  const v = Cookies.get("dashboardPage_summaryView"); // "true" | "false" | undefined
  setviewMode(v === "true");

  const c = Cookies.get("dashboardPage_showCards");
  setShowCards(c !== "false");           // default = true
}, []);

const handleClickViewMode = (checked) => {
  setviewMode(checked);
  Cookies.set("dashboardPage_summaryView", String(checked), { expires: 365 });
};

const handleClickShowCards = (checked) => {
  setShowCards(checked);
  Cookies.set("dashboardPage_showCards", String(checked), { expires: 365 });
};
// -------------------------------------------

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-3">
      <div className="z-50">
        {/* Header section */}
        <div className="flex justify-center items-center flex-col gap-4 bg-white rounded-xl p-4">
          <div className="flex gap-4">
            <img
              src="/assets/card-logo/dashboard.png"
              alt="wd logo"
              width={50}
              height={50}
            />
            <h1 className="text-3xl font-bold text-slate-900 ">
              {" "}
              WorkGroup: <span className="text-primary">{user.workgroup}</span>
            </h1>
          </div>
          {/* <h1 className="text-sm font-bold text-secondary flex items-center">
            Welcome to the e - PM System
          </h1> */}
        </div>

          {/* Show Cards switch */}
          <div
            className="inline-flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border mt-4"
            style={{ width: "15em" }}
          >
            <label
              htmlFor="showCardToggle"
              className="text-gray-700 text-lg font-semibold cursor-pointer"
            >
              Cards Menu
            </label>

            <div
              className={`relative inline-flex items-center h-7 rounded-full w-14 cursor-pointer transition-all duration-300 ${
                showCards ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={() => handleClickShowCards(!showCards)}
            >
              <span
                className={`inline-block w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  showCards ? "translate-x-7" : "translate-x-1"
                }`}
              ></span>
            </div>
          </div>


        {/* Cards section */}

          {showCards && (
            <div className="flex flex-wrap mt-9 gap-8 justify-center">
              {cards &&
                cards.map((card, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        title={card.TITLE}
                        detail={card.DETAIL}
                        link={card.LINK}
                        logo_path={card.LOGO_PATH}
                      />
                    </motion.div>
                  );
                })}
            </div>
          )}
{/* 
        <div className="flex flex-wrap mt-9 gap-8 justify-center">
          {cards &&
            cards.map((card, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }} // กำหนดให้แสดงทีละการ์ดโดยหน่วงเวลาตาม index
                >
                  <Card
                    title={card.TITLE}
                    detail={card.DETAIL}
                    link={card.LINK}
                    logo_path={card.LOGO_PATH}
                  />
                </motion.div>


              );
            })}
        </div> */}
        <div
          className="inline-flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border"
          style={{ width: "15em" }}
        >
          <label
            htmlFor="summaryView"
            className="text-gray-700 text-lg font-semibold cursor-pointer"
          >
            Graph
          </label>

          <div
            className={`relative inline-flex items-center h-7 rounded-full w-14 cursor-pointer transition-all duration-300 ${
              viewMode ? "bg-green-500" : "bg-gray-300"
            }`}
            onClick={() => handleClickViewMode(!viewMode)}
          >
            <span
              className={`inline-block w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ${
                viewMode ? "translate-x-7" : "translate-x-1"
              }`}
            ></span>
          </div>
        </div>




        {/* Jobs table section */}

      {viewMode===true ? (
        <div className="flex flex-col gap-5 w-full text-sm font-thin bg-white rounded-xl p-4">
          <DashboardSummary  />
        </div>
      ) : (
        <div className="flex flex-col gap-5 w-full text-sm font-thin bg-white rounded-xl p-4">
          <JobsTable   />
        </div>
      )}                       


      </div>
    </Layout>
  );
};

export default Page;
