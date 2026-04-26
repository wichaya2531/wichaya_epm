"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Image from "next/image";
import useFetchCards from "@/lib/hooks/useFetchCards";
import { usePathname } from "next/navigation";
import Denied from "./Denied";
import LoadingComponent from "./LoadingComponent";



//------------------ ENV / CONFIG ----------------->>
const PAGE_TIMEOUT = Number(process.env.NEXT_PUBLIC_PAGE_TIMEOUT) || 60; // วินาที


const Layout = ({ children, className = "" }) => {
  const [refresh, setRefresh] = useState(false);
  const [menus, setMenus] = useState([]);
  const { cards, isLoading: cardsLoading } = useFetchCards(refresh);
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(true);

  // ✅ ใช้ Number() เพื่อให้เป็นตัวเลขแน่ๆ
  const [timeLeft, setTimeLeft] = useState(PAGE_TIMEOUT);
  const [pageExpire, setPageExpire] = useState(false);
  


  // ✅ ฟังก์ชันรีเซ็ตตัวนับให้เป็นค่าสูงสุดเสมอ
  const resetTimer = useCallback(() => {
    setTimeLeft(PAGE_TIMEOUT);
  }, []);

  // ✅ ตัวจับเวลานับถอยหลัง + แจ้งเตือนหมดเวลา
  useEffect(() => {
    console.log("⏳ Page timeout set to", PAGE_TIMEOUT, "seconds");
    let alive = true;
    const timer = setInterval(() => {
      if (!alive) return;

      setTimeLeft((prev) => {
        const newTime = prev - 1;
        //console.log("⏳ Time left:", newTime, "seconds");
        if (newTime <= 0) {
          setPageExpire(true);
          clearInterval(timer);
          import("sweetalert2").then((Swal) => {
            Swal.default.fire({
              title: "Session Timeout!",
              text: "Please refresh the webpage to continue.",
              icon: "warning",
              showCancelButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false,
              confirmButtonText: "รีเฟรช",
            }).then(() => window.location.reload());
          });
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // ✅ ดัก event ผู้ใช้ → รีเซ็ตตัวนับเป็นค่า maximum เสมอ (มี debounce)
  useEffect(() => {
    const last = { t: 0 };
    const handler = () => {
      if (pageExpire==true) return;
      const now = Date.now();
      if (now - last.t < 250) return; // debounce 250ms กัน spam event เช่น mousemove
      last.t = now;
      resetTimer();
    };

    // Event ที่ถือว่าเป็น activity
    window.addEventListener("mousemove", handler, { passive: true });
    window.addEventListener("keydown", handler);
    window.addEventListener("click", handler, { passive: true });
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("touchstart", handler, { passive: true });

    // กลับมาโฟกัสแท็บ/หน้าต่าง → รีเซ็ตด้วย
    const onVis = () => { if (!document.hidden) resetTimer(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("click", handler);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("touchstart", handler);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [resetTimer]);

  // ---------- ด้านล่างโค้ดของคุณคงเดิม ---------- //
  useEffect(() => {
    const updatedMenus = [
      {
        name: (
          <div className="flex justify-start items-center gap-2">
            <img src="/assets/card-logo/dashboard.png" alt="Home Icon" className="w-5 h-5" />
            <p className="text-xl">Home</p>
          </div>
        ),
        path: "/pages/dashboard",
      },
    ];

    if (Array.isArray(cards) && cards.length > 0) {
      updatedMenus.push(
        ...cards.map((card) => ({
          name: (
            <div className="flex justify-start items-center gap-3">
              <Image src={card.LOGO_PATH} width={24} height={24} alt="path-logo" />
              <p className="text-xl">{card.TITLE}</p>
            </div>
          ),
          path: card.LINK?.[0],
        }))
      );
    }

    setMenus(updatedMenus);
  }, [cards]);

  useEffect(() => {
    let isAuthorized = false;
    for (let card of cards || []) {
      if (card.LINK?.includes(pathname)) { isAuthorized = true; break; }
    }

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
    if (cards && cards.length > 0) setAuthCheckComplete(true);
  }, [cards, pathname]);

  if (cardsLoading || !cards || !pathname || !authCheckComplete) {
    return <LoadingComponent />;
  }

  if (!authorized) {
    return <Denied />;
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#f5f5f7" }}>
      {/* monitor ค่า (debug) */}
      {/* <div className="fixed top-24 right-4 text-xs text-gray-500">⏳ {timeLeft}s</div> */}
      {<div id="timeout-monitor" className="fixed top-24 right-4 text-xs text-gray-500 hidden">{timeLeft}</div>}
      {<div id="page-expire" className="fixed top-24 right-4 text-xs text-gray-500 hidden">{pageExpire?"true":"false"}</div>}
      
      <Navbar menu={menus} mqttStatus={mqttConnected} />
      <div className={`flex-1 ${className} pt-24 pb-36`}>{children}</div>
      <Footer />
    </div>
  );
}

export default Layout;
