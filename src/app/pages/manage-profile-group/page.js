"use client";

import Layout from "@/components/Layout.js";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import NextPlanIcon from "@mui/icons-material/NextPlan";
import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "../../../config/config.js";
import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";
import useFetchUser from "@/lib/hooks/useFetchUser";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";

const lineNameHeader = ["ID", "Line Name", "Created At", "Action"];
const Page = () => {
  const router = useRouter();
  const [currentUser, setcurrentUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersWorkgroup, setUsersWorkgroup] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchProfile, setSearchProfile] = useState("");

  const [isLoading, setIsLoading] = useState(false); 
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const [profileGroups, setProfileGroups] = useState([]); // ✅ ต้องมีบรรทัดนี้


  
    const filteredUsers = (usersWorkgroup ?? []).filter(u => {
      const text = (u.name || u.username || u.USER_NAME || "").toLowerCase();
      const email = (u.email || u.USER_EMAIL || "").toLowerCase();
      const q = searchUser.toLowerCase().trim();
      return q === "" || text.includes(q) || email.includes(q);
    })

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

    const fetchProfileInWorkgroup = async (workgroupId) => {
      
        try {
        const res = await fetch("/api/profile-group/get-profile-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            workgroup_id : workgroupId
          }),
        });
        
        const data = await res.json();
        const list = Array.isArray(data?.profileGroup) ? data.profileGroup : [];
        //console.log('list',list);
        setProfileGroups(list); // ✅ ใช้งานได้แล้ว
        //console.log('data.profileGroup',data.profileGroup);  
        //setProfileGroups(data.profileGroup);
        //console.log('data from handleCreateProfile',data.profileGroup);
      } catch (error) {
        console.error(error);
      }
    };


  useEffect(() => {
    //console.log(" use fetch");
    if (user && user.workgroup_id) {
        //console.log("current user   ",user);
        fetchUsersWorkgroup(user.workgroup_id);
        fetchProfileInWorkgroup(user.workgroup_id);
      //setSelectedWorkgroup(user.workgroup_id);
      //setRefresh(!refresh);
    }
  }, [user.workgroup_id]);


const handleEditProfile = async (profile) => {
    // ทำงานอื่นๆ เช่น บันทึกข้อมูลหรือเช็คสิทธิ์
    const qs = new URLSearchParams({
      profile_id: String(profile?._id ?? ""),
      profile_name: String(profile?.PROFILE_NAME ?? ""),
    }).toString();               // <- สำคัญ!
     router.push(`/pages/manage-user-in-profile-group?${qs}`);
}




  
const handleDeleteProfile = async (profile) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will delete the profile permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
  });

  if (!confirm.isConfirmed) return;
       
          try{
            const res = await fetch(`/api/profile-group/delete-profile-group`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({      
                _id: profile._id
              }),
            });
            const data = await res.json();
            console.log('handleDeleteProfile data',data);
            if(data.status===200){
                    //console.log('delete is ok');
                    fetchProfileInWorkgroup(user.workgroup_id);
                    return;
            }
            alert(data.message);
          }catch(err){
                console.log(err);
          }
};


const handleRenameProfile = async (profile) => {
  //console.log('profile',profile);
  //return null;
  const { value: newName } = await Swal.fire({
    title: "Rename profile",
    input: "text",
    inputLabel: "New profile name",
    inputValue: profile.PROFILE_NAME || "",
    inputPlaceholder: "Type new profile name...",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    inputValidator: (value) => {
      if (!value || !value.trim()) return "Please enter a profile name";
      if (value.trim() === profile.PROFILE_NAME) return "Name is unchanged";
      return null;
    },
    // ทำคำขอใน preConfirm เพื่อให้ Swal แสดงสถานะ/กันคลิกซ้ำ
    
    preConfirm: async (value) => {
       console.log("preConfirm profile",profile);
          try{
            const res = await fetch(`/api/profile-group/update-profile-group`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({      
                _id: profile._id,     
                PROFILE_NAME: value.trim(), 
                workgroup_id: profile.workgroup_id 
              }),
            });
            const data = await res.json();
            console.log('data',data);
          }catch(err){

          }
      // try {
      //   const res = await fetch(`/api/profile-group/update-profile-group`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({      
      //       id: profile._id,     
      //       PROFILE_NAME: value.trim(), 
      //       workgroup_id: profile.workgroup_id 
      //     }),
      //   });

      //   const data = await res.json().catch(() => ({}));

      //   if (!res.ok) {
      //     // ถ้า backend ส่ง 409 คือชื่อซ้ำ
      //     if (res.status === 409) {
      //       Swal.showValidationMessage(data.message || "Duplicate profile name in this workgroup");
      //     } else {
      //       Swal.showValidationMessage(data.message || `Update failed (${res.status})`);
      //     }
      //     return false;
      //   }
      //   return value.trim(); // ส่งค่ากลับให้ then ด้านล่าง
      // } catch (err) {
      //   Swal.showValidationMessage(err.message || "Network error");
      //   return false;
      // }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  // ถ้ากดยืนยันและอัปเดตสำเร็จ จะได้ newName กลับมา
  if (newName) {
    // อัปเดต state ในฝั่ง client แบบ optimistic
    setProfileGroups((prev) =>
      (prev || []).map((pg) =>
        pg._id === profile._id ? { ...pg, PROFILE_NAME: newName } : pg
      )
    );

    Swal.fire({
      icon: "success",
      title: "Updated",
      text: `Profile renamed to "${newName}"`,
      timer: 1400,
      showConfirmButton: false,
    });
  }
};



  const handleCreateProfile = async () => {
    
    
    const { value: profileWorkgroup_name } = await Swal.fire({
    title: "Enter profile name",
    input: "text",
    inputPlaceholder: "Type profile name...",
    showCancelButton: true,
    confirmButtonText: "Create",
    inputValidator: (value) => {
      if (!value.trim()) {
        return "Please enter a profile name";
      }
      return null;
    },
  });

  if (!profileWorkgroup_name) {
    // ผู้ใช้กด Cancel หรือไม่ได้กรอก
    return;
  }

    //console.log("Profile Name:", profileWorkgroup_name);
   
    //alert(profileWorkgroup_name);
     try {
        const res = await fetch("/api/profile-group/add-profile-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            PROFILE_NAME: profileWorkgroup_name ,
            workgroup_id : user.workgroup_id
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Create profile failed");
        }
        const data = await res.json();
        fetchProfileInWorkgroup(user.workgroup_id);
      } catch (error) {
        console.error(error);
      }
  };

  // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
  const getCurrentUser = async () => {
    const session = await getSession();
    console.log('session',session);
    if (session) {
      setcurrentUser(session);
      //fetchLineNames(session);
    } else {
      console.error("Failed to get session.");
    }
  };

 

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/manageLineName.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-primary">Manage group profile</h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Manage sub workgroup and user in sub workgroup 
        </h1>
      </div>
      <div
        className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
        style={{ width: "100%" }}
      >
        <h2 className="text-primary text-xl font-bold mb-4">
          Create Sub Workgroup
        </h2>
        <div className="mb-4 max-w-[250px] inline-block">
          <label htmlFor="profileWorkgroup" className="block text-sm font-medium mb-1">
            workgroup name :
          </label>
          {/* <input
            type="text"
            id="profileWorkgroup"
            className="w-full border border-gray-300 rounded p-2 max-w-[200px]"
            //value={selectLineName}
            //onChange={(e) => setSelectLineName(e.target.value)}
            placeholder="Enter sub workgrou names"
          /> */}
        </div>{" "}
       
        &nbsp;
        <div className="mb-4 max-w-[100px] inline-block">
          <button
            className="bg-blue-600 text-white rounded-lg px-2 py-1 disabled:opacity-50 flex items-center justify-center transition-all duration-300 hover:bg-blue-700"
            onClick={handleCreateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 animate-spin">
                  <FaPlus /> {/* เพิ่มไอคอนวงกลมหมุน */}
                </div>
                Creating...
              </>
            ) : (
              <>
                <FaPlus className="mr-2" /> {/* เพิ่มไอคอนบวก */}
                Create
              </>
            )}
          </button>
        </div>
         <hr></hr>
            <div
              id='body-panel'
              className="max-w-[98vw] mx-auto my-4 p-4 bg-white rounded-xl"
              style={{ width: "100%" }}
            >
              <div className="flex gap-4">
                    {/* กล่องซ้าย */}
                    <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
                      <div className="p-2">
                        <h3 className="font-semibold mb-2">Profile group</h3>
                        
                           {/* Search */}
                           <input
                              type="text"
                              placeholder="Search profilename..."
                              value={searchProfile}
                              onChange={(e) => setSearchProfile(e.target.value)}
                              style={{ width: "300px" }}
                              className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                      </div>
                      <hr className="my-3 border-gray-300" />
                      {/* รายการ profile groups */}
                            <ul className="divide-y divide-gray-200">
                                {Array.isArray(profileGroups) && profileGroups.length > 0 ? (
                                  profileGroups
                                    .filter((pg) =>
                                      (pg.PROFILE_NAME || "")
                                        .toLowerCase()
                                        .includes(searchProfile.toLowerCase())
                                    )
                                    .map((pg) => (
                                      <li
                                        key={pg._id}
                                        className="py-2 px-2 flex items-center justify-between hover:bg-gray-200"
                                      >
                                        {/* ชื่อโปรไฟล์ */}
                                        <span>{pg.PROFILE_NAME}</span>

                                        {/* ปุ่ม Action */}
                                        <div className="flex gap-2">
                                          {<button
                                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            onClick={() => handleEditProfile(pg)}
                                          >
                                            Edit/Add
                                          </button>}

                                          <button
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            onClick={() => handleRenameProfile(pg)}
                                          >
                                            Rename
                                          </button>
                                          <button
                                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            onClick={() => handleDeleteProfile(pg)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </li>
                                    ))
                                ) : (
                                  <li className="py-2 px-2 text-gray-500">No profiles found</li>
                                )}
                              </ul>

                    </div>

                    {/* กล่องขวา */}
                    {/* <div className="flex-1 bg-gray-100 rounded p-3 min-h-[200px]">
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
                    </div> */}
                    {/*-------------------------------*/}
                  </div>

            </div>

      </div>
      

    </Layout>
  );
};

export default Page;
