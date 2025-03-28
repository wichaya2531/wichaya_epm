"use client";
import { IconButton } from "@mui/material";
import { ExitToApp } from "@mui/icons-material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/utils/utils";
import { config } from "../config/config.js";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import { logins } from "@/lib/utils/utils.js";
import { useFormState } from "react-dom";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import useFetchUsers from "@/lib/hooks/useFetchUsers";
import { useRouter } from "next/navigation";

const Navbar = ({ menu }) => {
  // console.log("*****************Navbar**************");

  const [refresh, setRefresh] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState("");
  const { users, isLoading: usersloading } = useFetchUsers(refresh);
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState(logins, undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen); // สลับสถานะเปิด/ปิด
  };

  const togglePasswordVisibility = () => {
    // console.log("use togglePasswordVisibility");
    setShowPassword(!showPassword);
  };

  // ตรวจสอบว่าอยู่ใน client หรือไม่
  useEffect(() => {
    setIsClient(true); // ตั้งค่า isClient เป็น true หลังจากที่ render ฝั่ง client เสร็จ
  }, []);

  // ใช้ useRouter เฉพาะเมื่อเป็นฝั่ง client
  const router = isClient ? useRouter() : null;

  if (state?.success) {
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  // เมื่อผู้ใช้หรือข้อมูลผู้ใช้ทั้งหมดถูกโหลดแล้ว
  useEffect(() => {
    if (user && users) {
      // กรองผู้ใช้ที่มี emp_number เหมือนกัน
      const matchedUsers = users.filter(
        (u) => u.emp_number === user.emp_number
      );
      setFilteredUsers(matchedUsers);
    }
  }, [user, users]);

  const handleUserSelection = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);

    const selectedUser = users.find((u) => u._id === userId);
    if (selectedUser) {
      setSelectedUser(selectedUser);
      setUsername(selectedUser.username);
      setPassword(selectedUser.password);
      // ทำการ submit ฟอร์มโดยอัตโนมัติ
      setTimeout(() => {
        document.getElementById("loginForm")?.requestSubmit();
      }, 100);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      const selected = filteredUsers.find((u) => u._id === selectedUserId);
      setUsername(selected ? selected.username : "");
    }
  }, [selectedUserId]);

  const handleUsernameChange = (e) => {
    //console.log("...handleUsernameChange");
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    //console.log("...handlePasswordChange");
    setPassword(e.target.value);
  };

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

      //console.log("response",response);

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      //console.log("data.user", data.user);

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

        <ul className="font-semibold ml-2 space-y-4 p-4">
          {menu.map((item, index) => (
            <li key={index}>
              <Link
                href={item.path}
                className="block px-4 py-2 hover:bg-white hover:text-blue-600 rounded-md transition-all"
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
          <div>
            <p className="text-md font-bold">{user.name}</p>
            <p className="text-sm text-right">{user.role}</p>
          </div>
        </Link>
        <div className="relative">
          {/* รูปโปรไฟล์ */}
          <div onClick={toggleDropdown} className="relative">
            <img
              src={
                process.env.NEXT_PUBLIC_HOST + user.image ||
                "/user-profile/default-user.png"
              }
              alt="user"
              className="w-10 h-10 rounded-full border-2 border-black cursor-pointer"
            />
          </div>
          {/* เมนู Dropdown */}
          {filteredUsers.length > 1 && isOpen && (
            <div className="text-primary fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
                <select
                  className="font-sm p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  onChange={handleUserSelection}
                  value={selectedUserId}
                >
                  <option value="">Select User</option>
                  {filteredUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}, {user.workgroup}, {user.role}
                    </option>
                  ))}
                </select>
                <h2 className="text-xl mb-4 flex justify-center items-center">
                  User Login
                </h2>
                <form
                  id="loginForm"
                  action={formAction}
                  className="flex flex-col"
                >
                  <input
                    type="text"
                    className="w-full p-3 rounded-md border mb-3"
                    name="username"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Username"
                    autoComplete="username"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 rounded-md border mb-3"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="showPassword"
                      checked={showPassword}
                      onChange={togglePasswordVisibility}
                      className="mr-2"
                    />
                    <label htmlFor="showPassword">Show Password</label>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-500"
                  >
                    Login
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
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
