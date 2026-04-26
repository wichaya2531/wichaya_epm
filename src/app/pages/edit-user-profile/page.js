"use client";
import { useState } from "react";
import Layout from "@/components/Layout";
import useFetchUser from "@/lib/hooks/useFetchUser";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";

// ── Reusable Section Header ────────────────────────────────────────────────────
const SectionHeader = ({ title, isOpen, onToggle }) => (
  <h2
    className="text-2xl font-bold text-primary flex items-center cursor-pointer select-none"
    onClick={onToggle}
  >
    {title}
    {isOpen ? (
      <ArrowDropUpIcon style={{ fontSize: "3rem" }} />
    ) : (
      <ArrowDropDownIcon style={{ fontSize: "3rem" }} />
    )}
  </h2>
);

// ── Reusable Field ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block mb-1.5 text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const inputCls =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 block w-full p-2.5 outline-none transition";

// ── Page ───────────────────────────────────────────────────────────────────────
const Page = () => {
  const { user, isLoading } = useFetchUser();

  const [selectedFile, setSelectedFile]     = useState(null);
  const [isShowUserImage, setIsShowUserImage] = useState(true);
  const [isShowUserInfo, setIsShowUserInfo]   = useState(true);
  const [isShowPassword, setIsShowPassword]   = useState(false);

  // Password section state
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Loading states for each submit
  const [savingInfo, setSavingInfo]           = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);

  // ── Dropzone ─────────────────────────────────────────────────────────────────
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length > 0) setSelectedFile(acceptedFiles[0]);
  };
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  // ── Submit: Information + Profile Picture ─────────────────────────────────────
  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);

    const payload = new FormData();
    payload.append("user_id",    user._id);
    payload.append("mode",       "info");
    payload.append("emp_number", e.target.emp_number.value);
    payload.append("emp_name",   e.target.full_name.value);
    payload.append("email",      e.target.email.value);
    payload.append("team",       e.target.work_team.value);
    payload.append("username",   e.target.username.value);
    if (selectedFile) payload.append("file", selectedFile);

    try {
      const res  = await fetch("/api/auth/edit-user", { method: "PUT", body: payload });
      const data = await res.json();

      if (data.status === 200) {
        await Swal.fire({ icon: "success", title: "Saved", text: "Information updated successfully." });
        window.location.reload();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.error || "An error occurred." });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Network error. Please try again." });
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Submit: Password ──────────────────────────────────────────────────────────
  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (!password) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter a new password." });
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Error", text: "Passwords do not match." });
      return;
    }

    setSavingPassword(true);

    const payload = new FormData();
    payload.append("user_id",  user._id);
    payload.append("mode",     "password");
    payload.append("password", password);

    try {
      const res  = await fetch("/api/auth/edit-user", { method: "PUT", body: payload });
      const data = await res.json();

      if (data.status === 200) {
        await Swal.fire({ icon: "success", title: "Saved", text: "Password changed successfully." });
        window.location.reload();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.error || "An error occurred." });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Network error. Please try again." });
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64 text-gray-400 text-lg animate-pulse">
          Loading...
        </div>
      </Layout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">

      {/* Page Header */}
      <div className="flex flex-col items-start gap-3 mb-4 p-4 bg-white rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon className="text-gray-600 hover:text-primary transition" />
          </Link>
          <Image src="/assets/card-logo/profile.png" alt="profile" width={46} height={46} />
          <h1 className="text-3xl font-bold text-slate-900">Edit User Profile</h1>
        </div>
        <p className="text-sm text-secondary font-medium">
          Edit user information and profile picture, or change your password separately.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FORM 1 — Profile Picture + Information
      ════════════════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSubmitInfo}
        className="mb-4 p-6 bg-white rounded-xl shadow-sm flex flex-col gap-6"
      >
        {/* Section: Profile Picture */}
        <div>
          <SectionHeader
            title="Profile Picture"
            isOpen={isShowUserImage}
            onToggle={() => setIsShowUserImage((p) => !p)}
          />

          {isShowUserImage && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div
                {...getRootProps()}
                className="h-56 w-56 rounded-full border-2 border-dashed border-gray-300 flex justify-center items-center overflow-hidden cursor-pointer hover:border-blue-400 transition"
              >
                <input {...getInputProps()} id="fileInput" />
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : user?.image ? (
                  <img
                    src={user.image}
                    alt="profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">Click or drop image</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("fileInput").click()}
                  className="bg-[#347EC2] text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#4398E7] transition"
                >
                  + Choose Picture
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="border border-red-400 text-red-500 text-sm px-4 py-2 rounded-md hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Section: Information */}
        <div>
          <SectionHeader
            title="Information"
            isOpen={isShowUserInfo}
            onToggle={() => setIsShowUserInfo((p) => !p)}
          />

          {isShowUserInfo && (
            <div className="mt-4 flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Employee Number">
                  <input
                    type="text"
                    name="emp_number"
                    defaultValue={user?.emp_number ?? ""}
                    className={inputCls}
                    placeholder="123456"
                    required
                  />
                </Field>

                <Field label="Full Name">
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={user?.name ?? ""}
                    className={inputCls}
                    placeholder="John Doe"
                    required
                  />
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    name="email"
                    defaultValue={user?.email ?? ""}
                    className={inputCls}
                    placeholder="john.doe@company.com"
                    required
                  />
                </Field>

                <Field label="Work Team">
                  <select
                    name="work_team"
                    defaultValue={user?.team ?? ""}
                    className={inputCls}
                    required
                  >
                    <option value="" disabled>— Select team —</option>
                    <option value="Team A">Team A</option>
                    <option value="Team B">Team B</option>
                    <option value="Team C">Team C</option>
                    <option value="Office">Office</option>
                  </select>
                </Field>
              </div>

              <Field label="Username">
                <input
                  type="text"
                  name="username"
                  value={user?.username ?? ""}
                  readOnly
                  className={`${inputCls} bg-gray-100 text-gray-400 cursor-not-allowed`}
                />
              </Field>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Submit Info */}
        <div>
          <button
            type="submit"
            disabled={savingInfo}
            className="border border-[#347EC2] text-[#347EC2] text-sm px-6 py-2 rounded-md font-semibold
                       hover:bg-[#347EC2] hover:text-white transition duration-200 shadow-sm hover:shadow-md
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingInfo ? "Saving..." : "Save Information"}
          </button>
        </div>
      </form>

      {/* ════════════════════════════════════════════════════════════════
          FORM 2 — Password
      ════════════════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSubmitPassword}
        className="mb-4 p-6 bg-white rounded-xl shadow-sm flex flex-col gap-6"
      >
        <SectionHeader
          title="Change Password"
          isOpen={isShowPassword}
          onToggle={() => setIsShowPassword((p) => !p)}
        />

        {isShowPassword && (
          <div className="flex flex-col gap-4">
            <Field label="New Password">
              <input
                autoComplete="new-password"
                type={showPasswordText ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="•••••••••"
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                autoComplete="new-password"
                type={showPasswordText ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputCls} ${
                  confirmPassword && password !== confirmPassword
                    ? "border-red-400 focus:ring-red-300"
                    : ""
                }`}
                placeholder="•••••••••"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </Field>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={showPasswordText}
                onChange={() => setShowPasswordText((p) => !p)}
                className="w-4 h-4 accent-blue-500"
              />
              Show passwords
            </label>

            <div>
              <button
                type="submit"
                disabled={savingPassword}
                className="border border-red-500 text-red-500 text-sm px-6 py-2 rounded-md font-semibold
                           hover:bg-red-500 hover:text-white transition duration-200 shadow-sm hover:shadow-md
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>
        )}
      </form>

    </Layout>
  );
};

export default Page;
