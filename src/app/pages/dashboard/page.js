"use client";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import useFetchUser from "@/lib/hooks/useFetchUser.js";
import useFetchUsers from "@/lib/hooks/useFetchUsers";
import useFetchCards from "@/lib/hooks/useFetchCards.js";
import useFetchJobs from "@/lib/hooks/useFetchJobs.js";
import JobsTable from "@/components/JobsTable";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { login } from "@/lib/utils/utils.js";
import { FaTimes } from "react-icons/fa";

const sendData = async () => {
  try {
    const response = await fetch(
      "http://10.171.134.51:3000/api/elasticsearch/push/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exec_time: "your_exec_time",
          name: "your_name",
          date: "your_date",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error sending data:", error);
  }
};

const Page = () => {
  const [refresh, setRefresh] = useState(false);
  const { user, isLoading: userloading } = useFetchUser(refresh);
  const { users, isLoading: usersloading } = useFetchUsers(refresh);
  const { cards, isLoading: cardsLoading } = useFetchCards(refresh);
  const { jobs, isLoading: jobsLoading } = useFetchJobs(refresh);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [state, formAction] = useFormState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const togglePasswordVisibility = () => {
    // console.log("use togglePasswordVisibility");
    setShowPassword(!showPassword);
  };
  const handleClcik = () => {
    // sendData();
  };

  // ตรวจสอบว่าอยู่ใน client หรือไม่
  useEffect(() => {
    setIsClient(true); // ตั้งค่า isClient เป็น true หลังจากที่ render ฝั่ง client เสร็จ
  }, []);

  // ใช้ useRouter เฉพาะเมื่อเป็นฝั่ง client
  const router = isClient ? useRouter() : null;

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

    // ค้นหาผู้ใช้ที่เลือกและเก็บไว้ใน selectedUser
    const selectedUser = users.find((u) => u._id === userId);
    setSelectedUser(selectedUser);
    setIsOpen(true);
  };

  useEffect(() => {
    if (selectedUserId) {
      const selected = filteredUsers.find((u) => u._id === selectedUserId);
      setUsername(selected ? selected.username : "");
    }
  }, [selectedUserId]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="z-50">
        {/* Header section */}
        <div className="flex flex-col gap-4 bg-white rounded-xl p-4">
          <div className="flex flex-col md:flex-row items-start lg:items-center gap-4">
            <img
              src="/assets/card-logo/dashboard.png"
              alt="wd logo"
              width={50}
              height={50}
            />
            <h1 className="text-3xl font-bold text-slate-900"> Home </h1>
            <h1 className="text-2xl lg:text-3xl font-bold text-primary flex items-center break-words">
              {">"} WorkGroup: {user.workgroup}
            </h1>
          </div>
          <h1 className="text-sm font-bold text-secondary flex items-center">
            Welcome to the e - PM System
          </h1>
          {filteredUsers.length > 1 && (
            <select
              className="font-sm p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              onChange={handleUserSelection}
              value={selectedUserId}
            >
              <option value="">Select User</option>
              {filteredUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} {user.workgroup}
                </option>
              ))}
            </select>
          )}

          {/* แสดงฟอร์มกรอกข้อมูลเฉพาะเมื่อเลือกผู้ใช้แล้ว */}
          {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
                <h2 className="text-xl font-bold mb-4 flex justify-center items-center">
                  User Login
                </h2>

                <form action={formAction} className="flex flex-col">
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

        {/* Cards section */}
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
        </div>

        <hr className="border-gray-300 my-10" />

        {/* Jobs table section */}
        <div className="flex flex-col gap-5 w-full text-sm font-thin bg-white rounded-xl p-4">
          <JobsTable refresh={refresh} />
        </div>
      </div>
    </Layout>
  );
};

export default Page;
