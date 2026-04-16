"use client";

import Layout from "@/components/Layout.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchCards from "@/lib/hooks/useFetchCards";
import { usePathname } from "next/navigation";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";

// ❌ ไม่ควร import model มาใช้ใน client component (ลบออก)
// import { EmailGroup } from "@/lib/models/EmailGroup.js";

const Page = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(false);

  const [usersWorkgroup, setUsersWorkgroup] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  // ✅ EmailGroup states
  const [emailGroups, setEmailGroups] = useState([]);
  const [searchEmailGroup, setSearchEmailGroup] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const { cards } = useFetchCards(false);
  const pathname = usePathname();
  const pageCard = (cards || []).find((c) => Array.isArray(c.LINK) && c.LINK.includes(pathname));
  const logoPath = pageCard?.LOGO_PATH || "/assets/card-logo/manageLineName.png";

  // ---------------------------
  // Helpers
  // ---------------------------
  const filteredUsers = (usersWorkgroup ?? []).filter((u) => {
    const text = (u.name || u.username || u.USER_NAME || "").toLowerCase();
    const email = (u.email || u.USER_EMAIL || "").toLowerCase();
    const q = searchUser.toLowerCase().trim();
    return q === "" || text.includes(q) || email.includes(q);
  });

  const getCurrentUser = async () => {
    const session = await getSession();
    // console.log("session", session);
    if (session) {
      setCurrentUser(session);
    } else {
      console.error("Failed to get session.");
    }
  };

  // ---------------------------
  // Fetch: users in workgroup
  // ---------------------------
  const fetchUsersWorkgroup = async (workgroupId) => {
    try {
      const response = await fetch(
        `/api/workgroup/get-users-from-workgroup/${workgroupId}`
      );
      if (!response.ok) throw new Error("Failed to fetch users");
      const { users } = await response.json();
      setUsersWorkgroup(users || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------------------
  // Fetch: email groups in workgroup
  // ---------------------------
  const fetchEmailGroupsInWorkgroup = async (workgroupId) => {
    try {
      // ✅ เปลี่ยน endpoint ให้ตรงกับ backend ของคุณ ถ้ายังใช้ profile-group อยู่
      const res = await fetch("/api/email-group/get-email-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workgroup_id: workgroupId }),
      });

      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data?.emailGroups) ? data.emailGroups : [];
      setEmailGroups(list);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------------------
  // Actions: create / rename / delete / edit
  // ---------------------------
  const handleCreateEmailGroup = async () => {
    if (!user?.workgroup_id) return;

    const { value: emailGroupName } = await Swal.fire({
      title: "Enter email group name",
      input: "text",
      inputPlaceholder: "Type email group name...",
      showCancelButton: true,
      confirmButtonText: "Create",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Please enter a name";
        return null;
      },
    });

    if (!emailGroupName) return;

    try {
      setIsLoading(true);

      const res = await fetch("/api/email-group/add-email-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          EMAIL_GROUP_NAME: emailGroupName.trim(),
          workgroup_id: user.workgroup_id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== 200) {
        throw new Error(data.message || "Create email group failed");
      }

      await fetchEmailGroupsInWorkgroup(user.workgroup_id);
    } catch (error) {
      console.error(error);
      Swal.fire("Oops...", error.message || "Create failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameEmailGroup = async (emailGroup) => {
    const oldName =
      (emailGroup?.EMAIL_GROUP_NAME || emailGroup?.NAME || "").trim();

    const { value: newName } = await Swal.fire({
      title: "Rename Email Group",
      input: "text",
      inputLabel: "New email group name",
      inputValue: oldName,
      inputPlaceholder: "Type new email group name...",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Please enter a name";
        if (value.trim() === oldName) return "Name is unchanged";
        return null;
      },
      preConfirm: async (value) => {
        try {
          const res = await fetch(`/api/email-group/update-email-group`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _id: emailGroup._id,
              EMAIL_GROUP_NAME: value.trim(),
              workgroup_id: emailGroup.workgroup_id,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.status !== 200) {
            Swal.showValidationMessage(data.message || "Update failed");
            return false;
          }

          return value.trim(); // ✅ return to Swal
        } catch (err) {
          Swal.showValidationMessage(err.message || "Network error");
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (newName) {
      // optimistic update
      setEmailGroups((prev) =>
        (prev || []).map((g) =>
          g._id === emailGroup._id ? { ...g, EMAIL_GROUP_NAME: newName } : g
        )
      );

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Email group renamed to "${newName}"`,
        timer: 1400,
        showConfirmButton: false,
      });
    }
  };

  const handleDeleteEmailGroup = async (emailGroup) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the email group permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/email-group/delete-email-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: emailGroup._id }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.status === 200) {
        await fetchEmailGroupsInWorkgroup(user.workgroup_id);
        return;
      }

      Swal.fire("Oops...", data.message || "Delete failed", "error");
    } catch (err) {
      console.log("Error Code : 128");
      console.error("📄 Stack trace:\n", err.stack);
      Swal.fire("Oops...", err.message || "Delete failed", "error");
    }
  };

  const handleEditEmailGroup = async (emailGroup) => {
    const qs = new URLSearchParams({
      email_group_id: String(emailGroup?._id ?? ""),
      email_group_name: String(
        emailGroup?.EMAIL_GROUP_NAME ?? emailGroup?.NAME ?? ""
      ),
    }).toString();

    router.push(`/pages/manage-user-in-email-group?${qs}`);
  };

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.workgroup_id) {
      fetchUsersWorkgroup(user.workgroup_id);
      fetchEmailGroupsInWorkgroup(user.workgroup_id);
    }
  }, [user?.workgroup_id]);

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src={logoPath}
            alt="page logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-primary">Manage Email Group</h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex items-center">
          Manage Email Group
        </h1>
      </div>

      <div
        className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
        style={{ width: "100%" }}
      >
        <h2 className="text-primary text-xl font-bold mb-4">
          Create Email Group
        </h2>

        <div className="mb-4 max-w-[250px] inline-block">
          <label
            htmlFor="emailGroupName"
            className="block text-sm font-medium mb-1"
          >
            Email Group name :
          </label>
        </div>{" "}
        &nbsp;
        <div className="mb-4 max-w-[100px] inline-block">
          <button
            className="bg-blue-600 text-white rounded-lg px-2 py-1 disabled:opacity-50 flex items-center justify-center transition-all duration-300 hover:bg-blue-700"
            onClick={handleCreateEmailGroup}
            disabled={isLoading || userLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 animate-spin">
                  <FaPlus />
                </div>
                Creating...
              </>
            ) : (
              <>
                <FaPlus className="mr-2" />
                Create
              </>
            )}
          </button>
        </div>

        <hr />

        <div
          id="body-panel"
          className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
          style={{ width: "100%" }}
        >
          <div className="flex gap-4">
            {/* Left panel */}
            <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
              <div className="p-2">
                <h3 className="font-semibold mb-2">Email group</h3>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search email group..."
                  value={searchEmailGroup}
                  onChange={(e) => setSearchEmailGroup(e.target.value)}
                  style={{ width: "300px" }}
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="my-3 border-gray-300" />

              {/* Email groups list */}
              <ul className="divide-y divide-gray-200">
                {Array.isArray(emailGroups) && emailGroups.length > 0 ? (
                  emailGroups
                    .filter((g) =>
                      (g.EMAIL_GROUP_NAME || "")
                        .toLowerCase()
                        .includes(searchEmailGroup.toLowerCase())
                    )
                    .map((g) => (
                      <li
                        key={g._id}
                        className="py-2 px-2 flex items-center justify-between hover:bg-gray-200"
                      >
                        <span>{g.EMAIL_GROUP_NAME}</span>

                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => handleEditEmailGroup(g)}
                          >
                            Edit/Add
                          </button>

                          <button
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() => handleRenameEmailGroup(g)}
                          >
                            Rename
                          </button>

                          <button
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDeleteEmailGroup(g)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))
                ) : (
                  <li className="py-2 px-2 text-gray-500">
                    No email groups found
                  </li>
                )}
              </ul>
            </div>

            {/* Right panel (Users) - if you want, uncomment and adapt */}
            {/*
            <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
              <div className="p-2">
                <h3 className="font-semibold mb-2">Users</h3>

                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="my-3 border-gray-300" />

              {filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-200 max-h-80 overflow-auto">
                  {filteredUsers.map((u) => (
                    <li
                      key={u._id || u.id || (u.email ?? Math.random())}
                      className="py-2 px-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {u.name || u.username || u.USER_NAME || "Unnamed"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.email || u.USER_EMAIL || ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={() => console.log("select user", u)}
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
            */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Page;
