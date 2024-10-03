"use client";
import { useState } from "react";
import Layout from "@/components/Layout";
import useFetchUser from "@/lib/hooks/useFetchUser";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

const Page = () => {
  const { user } = useFetchUser();
  const [formData, setFormData] = useState({
    emp_number: "",
    full_name: "",
    email: "",
    work_team: "",
    username: "",
    password: "",
    confirm_password: "",
    remember: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // State to manage password visibility
  const [isShowUserInfo, setIsShowUserInfo] = useState(false); // State to manage password visibility
  const [isShowUserImage, setIsShowUserImage] = useState(true);
  const [isShowPassword, setIsShowPassword] = useState(false);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleClearImage = () => {
    setSelectedFile(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const emp_number = e.target.emp_number.value;
    const emp_name = e.target.full_name.value;
    const email = e.target.email.value;
    const team = e.target.work_team.value;
    const username = e.target.username.value;
    const password = e.target.password.value || null;
    const confirm_password = e.target.confirm_password.value || null;
    const file = selectedFile || null;
    if (password !== confirm_password) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match",
        confirmButtonText: "OK",
      });
      return;
    }

    formData.append("user_id", user._id);
    formData.append("emp_number", emp_number);
    formData.append("emp_name", emp_name);
    formData.append("email", email);
    formData.append("team", team);
    formData.append("username", username);
    formData.append("password", password);
    formData.append("file", file);

    const res = await fetch("/api/auth/edit-user", {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();
    if (data.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "User updated successfully",
        confirmButtonText: "OK",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.error,
        confirmButtonText: "OK",
      });
    }
  };

  const toggleUserInfo = () => {
    setIsShowUserInfo((prev) => !prev);
  };

  const toggleUserImage = () => {
    setIsShowUserImage((prev) => !prev);
  };

  const togglePassword = () => {
    setIsShowPassword((prev) => !prev);
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white ">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/card-logo/profile.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            Edit User Profile
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Edit user information, adding profile image.
        </h1>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Profile Picture Dropzone */}
        <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
          Edit Profile Picture
          {isShowUserImage ? (
            <ArrowDropUpIcon
              style={{ fontSize: "5rem" }}
              onClick={toggleUserImage}
            />
          ) : (
            <ArrowDropDownIcon
              style={{ fontSize: "5rem" }}
              onClick={toggleUserImage}
            />
          )}
        </h1>

        <div
          className={`flex flex-col gap-4 justify-center items-center mb-10 ${
            isShowUserImage ? "" : "hidden"
          }`}
        >
          <div
            {...getRootProps()}
            id="fileInputDropzone"
            className="h-64 w-64 bg-white rounded-full border-2 border-black flex justify-center items-center overflow-hidden"
          >
            <input {...getInputProps()} id="fileInput" />

            <div className="flex flex-col justify-center items-center w-full h-full">
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="selected"
                  width={300}
                  height={300}
                  className="rounded-full object-cover"
                  style={{ width: "300px", height: "300px" }}
                />
              ) : user && user.image ? (
                <img
                  src={user.image}
                  alt="selected"
                  width={300}
                  height={300}
                  className="rounded-full object-cover"
                  style={{ width: "300px", height: "300px" }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-20 w-20 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="flex gap-4 mb-6">
            <button
              className="bg-[#347EC2] text-white text-sm px-4 py-2 rounded-sm  hover:bg-[#4398E7] hover:text-white"
              type="button"
              onClick={() => document.getElementById("fileInput").click()}
            >
              <div className="flex justify-center items-center gap-2 font-bold">
                <p>+ Add profile picture</p>
              </div>
            </button>
          </div>
        </div>
        <hr className="border-gray-300 dark:border-gray-600" />

        <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
          Edit Information
          {isShowUserInfo ? (
            <ArrowDropUpIcon
              style={{ fontSize: "5rem" }}
              onClick={toggleUserInfo}
            />
          ) : (
            <ArrowDropDownIcon
              style={{ fontSize: "5rem" }}
              onClick={toggleUserInfo}
            />
          )}
        </h1>
        <div className={`${isShowUserInfo ? "" : "hidden"}`}>
          {/* Grid for Form Inputs */}
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            {/* Employee Number */}
            <div>
              <label
                htmlFor="emp_num"
                className="block mb-2 text-sm font-medium text-black"
              >
                Employee Number
              </label>
              <input
                type="text"
                name="emp_number"
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="123456"
                defaultValue={user.emp_number}
                required
              />
            </div>
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block mb-2 text-sm font-medium text-black"
              >
                Name
              </label>
              <input
                type="text"
                name="full_name"
                defaultValue={user.name}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-black"
              >
                Email address
              </label>
              <input
                type="email"
                name="email"
                defaultValue={user.email}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="john.doe@company.com"
                required
              />
            </div>
            {/* Work Team */}
            <div>
              <label
                htmlFor="work_team"
                className="block mb-2 text-sm font-medium text-black"
              >
                Work team
              </label>
              <select
                name="work_team"
                value={formData.work_team}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              >
                <option value={user.team} selected>
                  {user.team}
                </option>
                <option value="Team A">Team A</option>
                <option value="Team B">Team B</option>
                <option value="Team C">Team C</option>
                <option value="Office">Office</option>
              </select>
            </div>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-black"
            >
              Username
            </label>
            <input
              autoComplete="off"
              type="text"
              name="username"
              value={user.username}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="john"
              required
            />
          </div>
        </div>
        <hr className="border-gray-300 dark:border-gray-600" />
        <h1 className="text-3xl font-bold text-primary flex items-center cursor-pointer">
          Edit Password
          {isShowPassword ? (
            <ArrowDropUpIcon
              style={{ fontSize: "5rem" }}
              onClick={togglePassword}
            />
          ) : (
            <ArrowDropDownIcon
              style={{ fontSize: "5rem" }}
              onClick={togglePassword}
            />
          )}
        </h1>
        {/* Password and Confirm Password */}
        <div
          className={`mb-6 grid grid-rows-2 ${isShowPassword ? "" : "hidden"}`}
        >
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-black"
            >
              Password
            </label>
            <input
              autoComplete="off"
              type={showPassword ? "text" : "password"}
              name="password"
              value=""
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="•••••••••"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="block mb-2 text-sm font-medium text-black"
            >
              Confirm password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="•••••••••"
            />
          </div>
          <div className="-translate-y-2">
            <input
              type="checkbox"
              id="togglePassword"
              name="togglePassword"
              checked={showPassword}
              onChange={handleTogglePasswordVisibility}
              className="mr-2"
            />
            <label
              htmlFor="togglePassword"
              className="text-sm text-gray-900 dark:text-white"
            >
              Show passwords
            </label>
          </div>
        </div>
        <hr className="border-gray-300 dark:border-gray-600" />

        <button
          type="submit"
          className="mt-10 bg-[#347EC2] text-white text-sm px-4 py-2 rounded-sm  hover:bg-[#4398E7] hover:text-white shadow-lg"
        >
          <div className="flex justify-center items-center gap-2 font-bold">
            <p>Save Changes</p>
          </div>
        </button>
      </form>
    </Layout>
  );
};

export default Page;
