"use client";
import { login } from "@/lib/utils/utils.js";
import Link from "next/link";
import { useFormState } from "react-dom";
import { useState } from "react"; // Import useState hook
import KeyIcon from "@mui/icons-material/Key";
import Image from "next/image";

export default function LoginForm() {
  const [state, formAction] = useFormState(login, undefined);
  const [showPassword, setShowPassword] = useState(false); // State to manage password visibility

  const togglePasswordVisibility = () => {
    console.log("use togglePasswordVisibility");
    setShowPassword(!showPassword); // Toggle password visibility
  };

  return (
    <div
      className="h-screen w-screen flex justify-center items-center flex-col"
      style={{
        background: "rgb(2,0,36)",
        background:
          "linear-gradient(13deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 0%, rgba(0,212,255,1) 100%)",
      }}
    >
      <div className="w-full absolute top-0 text-white flex items-start p-3 flex flex-col">
        <Image
          src="/assets/images/wd-logo-white.jpg"
          alt="wd logo"
          width={250}
          height={250}
          className=""
        />
      </div>

      <div
        className="flex flex-col items-center justify-center container font-sans shadow-2xl drop-shadow-2xl w-11/12 sm:w-8/12 md:w-6/12 lg:w-4/12 rounded-xl shadow-lg"
        style={{
          boxShadow:
            "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        }}
      >
        <h1 className="text-4xl font-bold text-center w-full p-4 rounded-t-lg bg-[#1e40af] text-white">
          e - PM System
        </h1>
        <div className="flex flex-col items-center gap-10 bg-white p-10 w-full relative pb-24 rounded-b-lg">
          <Image
            src="/assets/images/login-logo.png"
            alt="person"
            width={100}
            height={100}
          />
          <form
            className="flex flex-col items-center gap-5 w-full"
            action={formAction}
          >
            <div className="flex w-full max-w-xs">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                </svg>
              </span>
              <input
                type="text"
                id="website-admin"
                className="w-full rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="username"
                placeholder="Username"
              />
            </div>
            <div className="flex w-full max-w-xs">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                <KeyIcon className="text-gray-500 w-6 h-6" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="password"
                placeholder="Password"
              />
            </div>
            <div className="flex items-center self-start -translate-y-1">
              <input
                type="checkbox"
                id="showPassword"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={showPassword}
                onChange={togglePasswordVisibility}
              />
              <label
                htmlFor="showPassword"
                className="ml-2 text-sm text-gray-900 dark:text-gray-400"
              >
                Show Password
              </label>
            </div>
            <button className="bg-blue-600 text-white py-3 w-full rounded-md hover:bg-blue-500 font-bold mt-3 text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
              Login
            </button>
            {state?.message && <p className="text-red-500">{state.message}</p>}
          </form>
          <Link
            href="/pages/register"
            className="underline text-sm cursor-pointer hover:text-gray-400 absolute right-2 bottom-2"
          >
            Don't have an account?
          </Link>
          <Link
            href="/pages/forgot-password"
            className="underline text-sm cursor-pointer hover:text-gray-400 absolute left-2 bottom-2"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
