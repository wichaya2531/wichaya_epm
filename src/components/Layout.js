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

const Layout = ({ children, className = "" }) => {
  const [refresh, setRefresh] = useState(false);
  const [menus, setMenus] = useState([]);
  const { cards, isLoading: cardsLoading } = useFetchCards(refresh);
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

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
              <HomeIcon className="size-6" />
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
                  style={{ filter: "invert(100%)" }}
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
      pathname.startsWith("/pages/job-review")
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
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <Navbar menu={menus} />
      <div className={`flex-1 ${className} pt-24 pb-36`}>{children}</div>
      <Footer />
    </div>
  );
};

export default Layout;
