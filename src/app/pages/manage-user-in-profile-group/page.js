"use client";

import Layout from "@/components/Layout.js";
// import Select from "react-select";
// import TableComponent from "@/components/TableComponent.js";
// import NextPlanIcon from "@mui/icons-material/NextPlan";
import Link from "next/link";
import { useEffect, useState } from "react";
// import { config } from "../../../config/config.js";
// import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";
import useFetchUser from "@/lib/hooks/useFetchUser";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

const Page = ({ query }) => {
  const sp = useSearchParams();
  const profile_id = sp.get("profile_id") ?? "";
  const profile_name = sp.get("profile_name") ?? "";

  const router = useRouter();
  const [usersWorkgroup, setUsersWorkgroup] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchUserProfile, setSearchUserProfile] = useState("");
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const [usersProfile, setUsersProfile] = useState([]);

  const filteredUsersProfile = (usersProfile ?? []).filter(u => {
    const text = (u.name || u.username || u.USERNAME || "").toLowerCase();
    const email = (u.email || u.EMAIL || "").toLowerCase();
    const q = searchUserProfile.toLowerCase().trim();
    return q === "" || text.includes(q) || email.includes(q);
  });

// ตัดคนที่ซ้ำกับ filteredUsersProfile ออกจาก filteredUsersWorkgroup
const filteredUsersWorkgroup = (usersWorkgroup ?? [])
  .filter(u => {
    const text = (u.name || u.username || u.USER_NAME || "").toLowerCase();
    const email = (u.email || u.USER_EMAIL || "").toLowerCase();
    const q = searchUser.toLowerCase().trim();
    return q === "" || text.includes(q) || email.includes(q);
  })
  .filter(u => !filteredUsersProfile.some(p => String(p._id) === String(u._id)));





    const fetchUsersWorkgroup = async (workgroupId) => {
      try {
        const response = await fetch(`/api/workgroup/get-users-from-workgroup/${workgroupId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const { users } = await response.json();
        //console.log('fetchUsersWorkgroup users',users);   
        setUsersWorkgroup(users);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchUsersInProfile = async (profile_id) => {
      //console.log('profile_id....',profile_id);
     // return;
      try {
        const response = await fetch(`/api/profile-group/get-users-in-profile-group/${profile_id}`);
        //console.log('response',response);
        
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
          const data = await response.json();          // <- อ่าน body จริง
          //console.log("data.profileGroup.USER_LIST:", data.profileGroup.USER_LIST);
          setUsersProfile(data.profileGroup.USER_LIST);
          //console.log('fetchUsersInProfile',profile);   
        //setUsersWorkgroup(users);
      } catch (error) {
        console.error(error);
      }
    };


const refreshLists = async () => {
  if (!user?.workgroup_id || !profile_id) return;
  await Promise.all([
    fetchUsersWorkgroup(user.workgroup_id),
    fetchUsersInProfile(profile_id),
  ]);
};    

useEffect(() => {
  if (user?.workgroup_id && profile_id) {
    fetchUsersWorkgroup(user.workgroup_id);
    fetchUsersInProfile(profile_id);
  }
}, [user?.workgroup_id, profile_id]);  // <- ใส่ profile_id ด้วย



const handleDeleteUserInProfile = async (u) => {
  const confirm = await Swal.fire({
    title: "ลบผู้ใช้ออกจากโปรไฟล์?",
    text: (u.name || u.username || u.EMP_NAME || "") + " จะถูกลบออกจากโปรไฟล์นี้",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
  });
  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch("/api/profile-group/delete-user-in-profile-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: u._id,
        profile_id: profile_id,
      }),
    });

    const data = await res.json();

    if (res.ok && data.status === 200) {
      await refreshLists();  // <- รีเฟรชสองลิสต์
      //Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: data.message || data.error || "Unknown error" });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
  }
};


 const handleAddUserToProfile = async (user) => {
        //console.log('user',user);
               
        try {
        const res = await fetch("/api/profile-group/add-user-in-profile-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            user_id : user._id,
            profile_id : profile_id, 
          }),
        });
         const data = await res.json();
        if (res.ok && data.status === 200) {
          await refreshLists();  // <- รีเฟรชสองลิสต์
          //Swal.fire({ icon: "success", title: "เพิ่มสำเร็จ", timer: 500, showConfirmButton: false });
        } else {
          Swal.fire({ icon: "error", title: "เพิ่มไม่สำเร็จ", text: data.message || data.error || "Unknown error" });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }

 }

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/manage-profile-group">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/manageLineName.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-primary">Manage Users in profile :  { profile_name }</h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
                insert update  delete users in profile group
        </h1>
      </div>
      <div
        className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
        style={{ width: "100%" }}
      >
            <div
              id='body-panel'
              className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
              style={{ width: "100%" }}
            >
              <div className="flex gap-4">
                    {/* กล่องซ้าย */}
                    { <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
                      <div className="p-2">
                        <h3 className="font-semibold mb-2">Users in profile</h3>
                        
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchUserProfile}
                              onChange={(e) => setSearchUserProfile(e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                      </div>
                      <hr className="my-3 border-gray-300" />
                       
                              {filteredUsersProfile.length > 0 ? (
                                <ul className="divide-y divide-gray-200 max-h-80 overflow-auto">
                                  {filteredUsersProfile.map((u) => (
                                    <li
                                      key={u._id || u.id || (u.email ?? Math.random())}
                                      className="py-2 px-2 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {u.name || u.username || u.EMP_NAME || "Unnamed"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {u.email || u.EMAIL || ""}
                                        </div>
                                      </div>

                                      
                                      <button
                                        type="button"
                                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                        onClick={() => handleDeleteUserInProfile(u)} 
                                      >
                                        Delete
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 px-2">No users found.</p>
                              )}
                    </div> }                
                    {/* กล่องขวา */}
                    { <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
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
                                          {u.name || u.username || u.USER_NAME || "Unnamed"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {u.email || u.USER_EMAIL || ""}
                                        </div>
                                      </div>

                                      
                                      <button
                                        type="button"
                                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        onClick={() => handleAddUserToProfile(u)}              // <<-- ใช้งานตรงนี้
                                      >
                                        Select
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 px-2">No users found.</p>
                              )}
                    </div> }
                    
              </div>

            </div>

      </div>
      

    </Layout>
  );
};

export default Page;
