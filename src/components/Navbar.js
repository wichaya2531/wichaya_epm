import { IconButton } from "@mui/material";
import { ExitToApp } from "@mui/icons-material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/utils/utils";
import { config } from "../config/config.js";
import Image from "next/image";

const Navbar = ({ menu }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const userData = await getSession();
    await fetchUser(userData.user_id);
  };

  const fetchUser = async (user_id) => {
    try {
      const response = await fetch(`/api/user/get-user/${user_id}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="w-full h-16 p-4 bg-blue-700 flex justify-between items-center text-white font-bold font-sans z-[100] fixed">
      <div className="flex items-center gap-4">
        <div
          className="flex flex-col gap-2 cursor-pointer"
          onClick={toggleMenu}
        >
          <div
            className={`bg-white w-7 h-0.5 ${showMenu ? "rotate-45" : ""}`}
          ></div>
          <div
            className={`bg-white w-7 h-0.5 ${showMenu ? "opacity-0" : ""}`}
          ></div>
          <div
            className={`bg-white w-7 h-0.5 ${showMenu ? "-rotate-45" : ""}`}
          ></div>
        </div>
        <Link href="/pages/dashboard" className="text-white">
          <Image
            src="/assets/images/wd-logo-white.jpg"
            alt="wd logo"
            width={200}
            height={200}
            className=""
          />
        </Link>
      </div>

      {/* เมนูที่สามารถเลื่อนขึ้นลงได้เมื่อรายการเยอะ */}
      <div
        className={`bg-blue-800 h-screen left-0 top-0 fixed lg:w-1/3 w-3/4 shadow-lg transition-transform duration-300 ${
          showMenu ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <button className="absolute top-4 right-4 z-[300]" onClick={closeMenu}>
          <span className="sr-only">Close</span>
          <svg
            className="h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="h-16 w-full flex justify-center items-center shadow-lg drop-shadow-xl">
          <h1 className="text-2xl text-white">e - PM System</h1>
        </div>

        <ul className="text-white font-semibold ml-2 space-y-4 p-4">
          {menu.map((item, index) => (
            <li key={index}>
              <Link
                href={item.path}
                className="block px-4 py-2 hover:bg-blue-600 hover:text-white rounded-md transition-all"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 items-center text-white cursor-default">
        <Link
          href="/pages/edit-user-profile"
          className="flex gap-2 items-center"
        >
          <div className="hidden lg:block">
            <p className="text-md font-bold">{user.name}</p>
            <p className="text-sm text-right">{user.role}</p>
          </div>
          <div>
            <img
              src={user.image || "/user-profile/default-user.png"}
              alt="user"
              className="w-10 h-10 rounded-full border-2 border-black"
            />
          </div>
        </Link>
        <IconButton color="inherit">
          <Link href="/pages/login" onClick={handleLogout}>
            <ExitToApp className="size-8" />
          </Link>
        </IconButton>
      </div>
    </nav>
  );
};

export default Navbar;
