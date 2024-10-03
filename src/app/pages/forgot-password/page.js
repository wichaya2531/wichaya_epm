"use client";
import { sendResetEmail } from "@/lib/utils/utils";
import { useState } from "react";
import Swal from "sweetalert2";
import Link from "next/link";

export default function Page() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    //get reset link
    const res = await fetch(
      `http://10.171.134.51:3000/api/user/forget-password-email/${email}`
    );

    const data = await res.json();
    if (data.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.error,
        confirmButtonText: "OK",
      });
      return;
    }

    const sendingEmail = await sendResetEmail(data.account_found);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Please check your email for the reset link",
      confirmButtonText: "OK",
    });

    //change text button to be sending reset link
    const sendReset = document.getElementById("sendReset");
    sendReset.innerHTML = "Sending Reset Link...";
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-100">
      <div className="border-2 border-gray-300 px-10 pb-5 bg-white rounded-md shadow-md flex justify-center items-start">
        <form
          className="mt-10 flex flex-col justify-center items-center gap-5"
          onSubmit={handleSubmit}
        >
          <h1 className="font-bold text-2xl "> Forgot Your password ?</h1>
          <p className="text-gray-500">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
          <div className="w-full">
            <label
              htmlFor="input-group-1"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Your Email
            </label>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 16"
                >
                  <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                  <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                </svg>
              </div>
              <input
                type="text"
                name="email"
                id="input-group-1"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@wdc.com"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
          </div>
          <button
            type="submit"
            id="sendReset"
            className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm w-full py-2.5 text-center me-2 mb-2"
          >
            Send Reset Link
          </button>
          <p>
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
