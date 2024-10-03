"use client";
import { useState } from "react";
import Link from "next/link";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Swal from "sweetalert2";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config/config";
import Image from "next/image";

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empNumber = e.target.employeeNumber.value;
    const empName = e.target.employeeName.value;
    const email = e.target.email.value;
    const team = e.target.team.value;
    const username = e.target.username.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirm_password.value;

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match",
        confirmButtonText: "OK",
      });
      return;
    }

    const res = await fetch(`${config.host}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emp_number: empNumber,
        emp_name: empName,
        email: email,
        username: username,
        password: password,
        team: team,
      }),
    });

    const data = await res.json();

    if (data.status === 500) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.error,
        confirmButtonText: "OK",
      });
    }

    if (data.status === 400) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `${data.duplicateField} already exists`,
        confirmButtonText: "OK",
      });
    }

    if (data.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "User created successfully",
        confirmButtonText: "OK",
      }).then(() => {
        router.push("/pages/login");
      });
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="lg:pt-[500px] lg:pb-[100px] w-screen h-screen flex justify-center items-center bg-[#0061ffb5] lg:overflow-scroll xl:overflow-hidden xl:pt-0 xl:pb-0">
      <div className="w-full absolute top-0 text-white flex items-start p-3 flex flex-col">
        <Image
          src="/assets/images/wd-logo-white.jpg"
          alt="wd logo"
          width={200}
          height={200}
        />
      </div>
      <div className="flex flex-col shadow-lg pb-5 rounded-3xl bg-white w-11/12 sm:w-10/12 md:w-8/12 lg:w-5/12 xl:w-4/12 mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center bg-blue-700 p-4 text-gray-100 rounded-t-3xl w-full">
          e - PM System
        </h1>
        <h2 className="text-2xl font-bold text-center py-4">
          <HowToRegIcon className="text-gray-500 size-20" />
        </h2>

        <form className="px-4 sm:px-6 md:px-8" onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="emp_num"
                className="block mb-1 text-sm font-medium text-black"
              >
                Employee Number
              </label>
              <input
                type="text"
                name="employeeNumber"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="123456"
                required
              />
            </div>

            <div>
              <label
                htmlFor="work_team"
                className="block mb-1 text-sm font-medium text-black"
              >
                Work team
              </label>
              <select
                name="team"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                required
              >
                <option value="" disabled>
                  Select team
                </option>
                <option value="Team A">Team A</option>
                <option value="Team B">Team B</option>
                <option value="Team C">Team C</option>
                <option value="Office">Office</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="full_name"
              className="block mb-1 text-sm font-medium text-black"
            >
              Full Name
            </label>
            <input
              type="text"
              name="employeeName"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="John Doe"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-black"
            >
              Email address
            </label>
            <input
              type="email"
              name="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="john.doe@wdc.com"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block mb-1 text-sm font-medium text-black"
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="john"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium text-black"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                placeholder="•••••••••"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirm_password"
              className="block mb-1 text-sm font-medium text-black"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirm_password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                placeholder="•••••••••"
                required
              />
            </div>
            <div className="cursor-pointer translate-y-5">
              <input
                type="checkbox"
                onChange={togglePasswordVisibility}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Show Password</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm py-3 text-center"
          >
            Submit
          </button>
          <p className="mt-4 text-center">
            Go to{" "}
            <Link href="/pages/login" className="text-blue-500 hover:underline">
              Login
            </Link>{" "}
            Page
          </p>
        </form>
      </div>
    </div>
  );
}
