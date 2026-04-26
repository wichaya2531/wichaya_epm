"use client";

import Layout from "@/components/Layout.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import useFetchUser from "@/lib/hooks/useFetchUser";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useRouter, useSearchParams } from "next/navigation";

const Page = () => {
  const sp = useSearchParams();

  // ✅ รับค่าจาก query string
  const email_group_id = sp.get("email_group_id") ?? "";
  const email_group_name = sp.get("email_group_name") ?? "";

  const router = useRouter();

  const { user, isLoading: userLoading, error: userError } = useFetchUser();

  const [usersWorkgroup, setUsersWorkgroup] = useState([]);
  const [usersEmailGroup, setUsersEmailGroup] = useState([]);

  const [searchUser, setSearchUser] = useState("");
  const [searchUserEmailGroup, setSearchUserEmailGroup] = useState("");

  // ---------------------------
  // Filters
  // ---------------------------
  const filteredUsersEmailGroup = (usersEmailGroup ?? []).filter((u) => {
    const text = (u.name || u.username || u.USERNAME || u.EMP_NAME || "").toLowerCase();
    const email = (u.email || u.EMAIL || u.USER_EMAIL || "").toLowerCase();
    const q = searchUserEmailGroup.toLowerCase().trim();
    return q === "" || text.includes(q) || email.includes(q);
  });

  // ตัดคนที่ซ้ำกับ filteredUsersEmailGroup ออกจาก usersWorkgroup
  const filteredUsersWorkgroup = (usersWorkgroup ?? [])
    .filter((u) => {
      const text = (u.name || u.username || u.USER_NAME || u.EMP_NAME || "").toLowerCase();
      const email = (u.email || u.EMAIL || u.USER_EMAIL || "").toLowerCase();
      const q = searchUser.toLowerCase().trim();
      return q === "" || text.includes(q) || email.includes(q);
    })
    .filter((u) => !filteredUsersEmailGroup.some((p) => String(p._id) === String(u._id)));

  // ---------------------------
  // Fetch: users in workgroup
  // ---------------------------
  const fetchUsersWorkgroup = async (workgroupId) => {
    try {
      const response = await fetch(`/api/workgroup/get-users-from-workgroup/${workgroupId}`);
      if (!response.ok) throw new Error("Failed to fetch users from workgroup");
      const { users } = await response.json();
      setUsersWorkgroup(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------------------
  // Fetch: users in email group
  // ต้องมี API: GET /api/email-group/get-users-in-email-group/:email_group_id
  // response ควรเป็น: { status:200, emailGroup:{ USER_LIST:[...] } }
  // ---------------------------
    const fetchUsersInEmailGroup = async (groupId) => {
      //console.log("fetchUsersInEmailGroup ***********", groupId);

      try {
        const response = await fetch("/api/email-group/get-users-in-email-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email_group_id: groupId,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch users in email group");

        const data = await response.json().catch(() => ({}));
        setUsersEmailGroup(data?.emailGroup?.USER_LIST || []);
      } catch (error) {
        console.error(error);
      }
    };

  // ---------------------------
  // Refresh both lists
  // ---------------------------
  const refreshLists = async () => {
    if (!user?.workgroup_id || !email_group_id) return;
    await Promise.all([
      fetchUsersWorkgroup(user.workgroup_id),
      fetchUsersInEmailGroup(email_group_id),
    ]);
  };

  // initial load
  useEffect(() => {
    if (user?.workgroup_id && email_group_id) {
      fetchUsersWorkgroup(user.workgroup_id);
      fetchUsersInEmailGroup(email_group_id);
    }
  }, [user?.workgroup_id, email_group_id]);

  // ---------------------------
  // Actions: remove user from email group
  // ต้องมี API: POST /api/email-group/delete-user-in-email-group
  // body: { user_id, email_group_id }
  // ---------------------------
  const handleDeleteUserInEmailGroup = async (u) => {
    const confirm = await Swal.fire({
      title: "ลบผู้ใช้ออกจาก Email Group?",
      text: `${u.name || u.username || u.EMP_NAME || ""} จะถูกลบออกจากกลุ่มนี้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/email-group/delete-user-in-email-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: u._id,
          email_group_id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === 200) {
        await refreshLists();
      } else {
        Swal.fire({
          icon: "error",
          title: "ลบไม่สำเร็จ",
          text: data.message || data.error || "Unknown error",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  // ---------------------------
  // Actions: add user to email group
  // ต้องมี API: POST /api/email-group/add-user-in-email-group
  // body: { user_id, email_group_id }
  // ---------------------------
  const handleAddUserToEmailGroup = async (u) => {
    try {
      const res = await fetch("/api/email-group/add-user-in-email-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: u._id,
          email_group_id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === 200) {
        await refreshLists();
      } else {
        Swal.fire({
          icon: "error",
          title: "เพิ่มไม่สำเร็จ",
          text: data.message || data.error || "Unknown error",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          {/* ✅ แนะนำอย่าใส่ /pages ใน URL */}
          <Link href="/pages/manage-email-group">
            <ArrowBackIosNewIcon />
          </Link>

          <Image
            src="/assets/card-logo/manageLineName.png"
            alt="wd logo"
            width={50}
            height={50}
          />

          <h1 className="text-3xl font-bold text-primary">
            Manage Users in Email Group : {email_group_name}
          </h1>
        </div>

        <h1 className="text-sm font-bold text-secondary flex items-center">
          insert update delete users in email group
        </h1>
      </div>

      <div className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl" style={{ width: "100%" }}>
        <div
          id="body-panel"
          className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
          style={{ width: "100%" }}
        >
          <div className="flex gap-4">
            {/* กล่องซ้าย: Users in email group */}
            <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
              <div className="p-2">
                <h3 className="font-semibold mb-2">Users in email group</h3>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUserEmailGroup}
                  onChange={(e) => setSearchUserEmailGroup(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="my-3 border-gray-300" />

              {filteredUsersEmailGroup.length > 0 ? (
                <ul className="divide-y divide-gray-200 max-h-80 overflow-auto">
                  {filteredUsersEmailGroup.map((u) => (
                    <li
                      key={u._id || u.id || (u.email ?? Math.random())}
                      className="py-2 px-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {u.name || u.username || u.EMP_NAME || "Unnamed"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.email || u.EMAIL || u.USER_EMAIL || ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        onClick={() => handleDeleteUserInEmailGroup(u)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 px-2">No users found.</p>
              )}
            </div>

            {/* กล่องขวา: Users in workgroup */}
            <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
              <div className="p-2">
                <h3 className="font-semibold mb-2">Users in workgroup</h3>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="my-3 border-gray-300" />

              {filteredUsersWorkgroup.length > 0 ? (
                <ul className="divide-y divide-gray-200 max-h-80 overflow-auto">
                  {filteredUsersWorkgroup.map((u) => (
                    <li
                      key={u._id || u.id || (u.email ?? Math.random())}
                      className="py-2 px-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {u.name || u.username || u.USER_NAME || u.EMP_NAME || "Unnamed"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.email || u.EMAIL || u.USER_EMAIL || ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={() => handleAddUserToEmailGroup(u)}
                      >
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 px-2">No users found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Page;
