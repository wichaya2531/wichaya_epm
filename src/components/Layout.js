"use client";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import HomeIcon from "@mui/icons-material/Home";
import Image from "next/image";
import useFetchCards from "@/lib/hooks/useFetchCards";
import { usePathname } from "next/navigation";
import Denied from "./Denied";
import LoadingComponent from "./LoadingComponent";

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

const Layout = ({ children, className = "" }) => {
  const [refresh, setRefresh] = useState(false);
  const [menus, setMenus] = useState([]);
  const { cards, isLoading: cardsLoading } = useFetchCards(refresh);
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const [mqttConnected, setMqttConnected] = useState(false);
 


//-----------MQTT----------------------------------------->>
const mqttClient = useRef(null);
useEffect(() => {
  const client = mqtt.connect(connectUrl, options);
  mqttClient.current = client;

  const onConnect = () => {
    console.log("✅ MQTT Connected");
    setMqttConnected(true);   
  };
  client.on("connect", onConnect);
  client.on("error", (err) => console.error("❌ MQTT Error:", err));
  client.on("close", () => console.warn("⚠️ MQTT Disconnected"));
  client.on("message", (t, m) => {
    console.log("📩", t, m.toString());
    setRefresh(true);
  });

  return () => {
    client.end(true);
    mqttClient.current = null;
  };
}, []);

//------------------------------------------------------->>

  // useEffect(() => {
  //   const updateMenus = () => {
  //     const updatedMenus = [
  //       {
  //         name: (
  //           <div className="flex justify-start items-center gap-2">
  //             <HomeIcon className="size-6" />
  //             <p className="text-xl">Home</p>
  //           </div>
  //         ),
  //         path: "/pages/dashboard"
  //       }
  //     ];

  //     updatedMenus.push(
  //       ...cards.map((card) => ({
  //         name: (
  //           <div className="flex justify-start items-center gap-3">
  //             <Image
  //               src={card.LOGO_PATH}
  //               width={24}
  //               height={24}
  //               style={{ filter: "invert(100%)" }}
  //             />
  //             <p className="text-xl">{card.TITLE}</p>
  //           </div>
  //         ),
  //         path: card.LINK[0] // Assuming LINK is an array and taking the first item for simplicity
  //       }))
  //     );

  //     setMenus(updatedMenus);
  //   };

  //   updateMenus();
  // }, [cards]);

  useEffect(() => {
    const updateMenus = () => {
      const updatedMenus = [
        {
          name: (
            <div className="flex justify-start items-center gap-2">
              <img
                src="/assets/card-logo/dashboard.png"
                alt="Home Icon"
                className="w-5 h-5"
              />
              <p className="text-xl">Home</p>
            </div>
          ),
          path: "/pages/dashboard",
        },
      ];
     
      // ตรวจสอบว่ามี cards และเป็น array ก่อนใช้ .map()
      if (Array.isArray(cards) && cards.length > 0) {
        updatedMenus.push(
          ...cards.map((card) => ({
            name: (
              <div className="flex justify-start items-center gap-3">
                <Image
                  src={card.LOGO_PATH}
                  width={24}
                  height={24}
                  alt="path-logo"
                />
                <p className="text-xl">{card.TITLE}</p>
              </div>
            ),
            path: card.LINK[0], // Assuming LINK is an array and taking the first item for simplicity
          }))
        );
      }

      setMenus(updatedMenus);
    };

    updateMenus();
  }, [cards]);

  useEffect(() => {
    // Check if the current pathname is authorized
    let isAuthorized = false;

    for (let card of cards) {
      if (card.LINK.includes(pathname)) {
        isAuthorized = true;
        break;
      }
    }

    // Allow access to specific pages regardless
    if (
      pathname === "/pages/dashboard" ||
      pathname.startsWith("/pages/view-jobs") ||
      pathname.startsWith("/pages/job-renew") ||
      pathname.startsWith("/pages/job-review") ||
      pathname.startsWith("/pages/report/dynamic")
    ) {
      isAuthorized = true;
    }

    setAuthorized(isAuthorized);

    if (cards && cards.length > 0) {
      setAuthCheckComplete(true);
    }
  }, [cards]);

  if (cardsLoading || !cards || !pathname || !authCheckComplete) {
    return <LoadingComponent />;
  }

  if (!authorized) {
    return <Denied />;
  }

  // Render layout if authorized
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#f5f5f7" }}
    >
      <Navbar menu={menus} mqttStatus={mqttConnected} />
      { <div className={`flex-1 ${className} pt-24 pb-36`}>{children}</div>}
      <Footer />
    </div>
  );
};

export default Layout;
