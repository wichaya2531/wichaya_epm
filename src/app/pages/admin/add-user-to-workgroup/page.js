"use client";
import Layout from "@/components/Layout";
import TableComponent from "@/components/TableComponent";
import { getSession } from "@/lib/utils/utils";
import { useEffect, useState } from "react";
import { config } from "../../../../config/config.js";
import Swal from "sweetalert2";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link.js";
import classNames from "classnames";

const workgroupHeader = [
  "id",
  "EMP_number",
  "Email",
  "Name",
  "Role",
  "Change Role",
  "Action",
];
const userHeader = ["id", "EMP_number", "Email", "Name", "Role", "Action"];

const enabledFunctoon = {
  "add-user-to-workgroup": "66309730242be72e399d5a82",
  "remove-user-from-workgroup": "66309740242be72e399d5a84",
  "view-user-in-workgroup": "6632e932eccb576a719dfa75",
};

const Page = () => {
  const [usersWorkgroup, setUsersWorkgroup] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [session, setSession] = useState({});
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [userEnableFunctions, setUserEnableFunctions] = useState([]);

  useEffect(() => {
    fetchSession();
    fetchUsers();
    fetchRoles();
  }, [refresh]);

  const fetchSession = async () => {
    const session = await getSession();
    setSession(session);
    await fetchUser(session.user_id);
    await fetchUserEnabledFunction(session.user_id);
  };

  const fetchUser = async (user_id) => {
    try {
      const response = await fetch(`/api/user/get-user/${user_id}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUser(data.user);
      await fetchUsersWorkgroup(data.user.workgroup_id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsersWorkgroup = async (workgroup_id) => {
    try {
      const response = await fetch(
        `/api/workgroup/get-users-from-workgroup/${workgroup_id}`,
        { next: { revalidate: 10 } }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const usersWorkgroupData = await response.json();
      setUsersWorkgroup(usersWorkgroupData.users);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/user/get-users`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const usersData = await response.json();
      //don't show if user already has some role
      const filteredUsers = usersData.users.filter(
        (user) => user.role === "No role"
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/role/get-roles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 10 },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const responseData = await response.json();
      setRoles(responseData.roles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const RoleSelect = ({ user_id }) => {
    return (
      <select
        id={`roleSelect-${user_id}`}
        className="text-center"
        onChange={(event) => {
          const role_id = event.target.value;
          setSelectedRoles((prevState) => ({
            ...prevState,
            [user_id]: role_id,
          }));
        }}
        value={selectedRoles[user_id] || ""}
      >
        <option value="" disabled>
          Select Role
        </option>
        {roles.map((role) => {
          if (role.ROLE_NAME === "Admin Group" || role.ROLE_NAME === "SA")
            return;
          return (
            <option key={role._id} value={role._id}>
              {role.ROLE_NAME}
            </option>
          );
        })}
      </select>
    );
  };

  const fetchUserEnabledFunction = async (user_id) => {
    try {
      const response = await fetch(`/api/action/get-user-action/${user_id}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUserEnableFunctions(data.userActions);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (user_id, role_id) => {
    const workgroup_id = user.workgroup_id;

    try {
      // Update user role
      const resUpdate = await fetch(`/api/user/update-user/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ROLE: role_id,
        }),
        next: { revalidate: 10 },
      });

      if (!resUpdate.ok) {
        throw new Error("Failed to update user role");
      }

      // Add user to workgroup
      const resAdd = await fetch(`/api/workgroup/add-user-to-workgroup-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user_id,
          workgroup_id: workgroup_id,
        }),
        next: { revalidate: 10 },
      });

      if (!resAdd.ok) {
        throw new Error("Failed to add user to workgroup");
      }

      // รีเฟรชข้อมูล
      setRefresh(!refresh);
      return true; // เพิ่มผู้ใช้และอัปเดตสำเร็จ
    } catch (error) {
      console.error("Error:", error);
      return false; // เกิดข้อผิดพลาด
    }
  };

  const handleChangeRole = async (user_id, role_id) => {
    const workgroup_id = user.workgroup_id;
    try {
      // Update user role
      const resUpdate = await fetch(`/api/user/update-user/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ROLE: role_id,
        }),
        next: { revalidate: 10 },
      });
      if (!resUpdate.ok) {
        throw new Error("Failed to update user role");
      }
      // รีเฟรชข้อมูล
      setRefresh(!refresh);
      return true; // เพิ่มผู้ใช้และอัปเดตสำเร็จ
    } catch (error) {
      console.error("Error:", error);
      return false; // เกิดข้อผิดพลาด
    }
  };

  const handleRemove = async (user_id) => {
    const workgroup_id = user.workgroup_id;

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: true,
    });

    swalWithBootstrapButtons
      .fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          // Remove user from workgroup
          try {
            const response = await fetch(
              `/api/workgroup/remove-user-from-workgroup`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user_id: user_id,
                  workgroup_id: workgroup_id,
                }),
                next: { revalidate: 10 },
              }
            );

            if (response.ok) {
              swalWithBootstrapButtons.fire({
                title: "Removed!",
                text: "The user has been removed from the workgroup.",
                icon: "success",
              });
              setRefresh(!refresh);
            } else {
              throw new Error("Failed to remove user from workgroup");
            }
          } catch (error) {
            console.error("Error removing user from workgroup:", error);
            swalWithBootstrapButtons.fire({
              title: "Error!",
              text: "An error occurred while removing the user.",
              icon: "error",
            });
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "The removal action was cancelled.",
            icon: "error",
          });
        }
      });
  };

  const dataUsersWorkgroup = usersWorkgroup.map((user, index) => {
    let disableRemoveButton = false;
    disableRemoveButton = !userEnableFunctions.some(
      (action) => action._id === enabledFunctoon["remove-user-from-workgroup"]
    );
    return {
      id: index + 1,
      EMP_number: user.emp_number,
      Email: user.email,
      Name: user.name,
      Role: user.role,
      ChangRole:
        user.role !== "Admin Group"
          ? [<RoleSelect user_id={user._id} />]
          : [<span className="pl-4"> </span>],
      action:
        user.role !== "Admin Group"
          ? [
              <div className="flex items-center space-x-4">
                <button
                  onClick={async () => {
                    const role_id = selectedRoles[user._id];

                    if (role_id) {
                      const success = await handleChangeRole(user._id, role_id);
                      if (success) {
                        Swal.fire({
                          icon: "success",
                          title: "Change Role Successfully",
                          text: `${user.name} has been changed to the selected role.`,
                          confirmButtonText: "OK",
                        });

                        // ล้างค่า role ที่เลือก
                        setSelectedRoles((prev) => ({
                          ...prev,
                          [user._id]: "",
                        }));
                      } else {
                        Swal.fire({
                          icon: "error",
                          title: "Error",
                          text: "Failed to change role. Please try again.",
                          confirmButtonText: "OK",
                        });
                      }
                    } else {
                      Swal.fire({
                        icon: "warning",
                        title: "Select a Role",
                        text: "Please select a role before updating.",
                        confirmButtonText: "OK",
                      });
                    }
                  }}
                  disabled={!selectedRoles[user._id]} // ปิดการใช้งานถ้าไม่มี role
                  className={classNames(
                    "flex items-center justify-center font-semibold py-2 px-3 rounded-lg transition-all duration-300",
                    {
                      "bg-green-500 hover:bg-green-700 text-white":
                        selectedRoles[user._id], // ปุ่มสีเขียวเมื่อมี role
                      "bg-gray-200 text-gray-600 cursor-not-allowed":
                        !selectedRoles[user._id], // สีจางเมื่อไม่มี role
                    }
                  )}
                >
                  Update
                </button>
                <button
                  onClick={() => handleRemove(user._id)}
                  className={`flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300${
                    disableRemoveButton ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={disableRemoveButton}
                >
                  Remove
                </button>
              </div>,
            ]
          : [<span className="pl-4"> </span>],
    };
  });

  const dataUsers = users
    .filter((user) => !usersWorkgroup.some((u) => u._id === user._id))
    .map((user, index) => {
      let disableAddButton = false;
      disableAddButton = !userEnableFunctions.some(
        (action) => action._id === enabledFunctoon["add-user-to-workgroup"]
      );
      return {
        id: index + 1,
        EMP_number: user.emp_number,
        Email: user.email,
        Name: user.name,
        Role: <RoleSelect user_id={user._id} />,
        action: [
          <span className="pl-4 flex justify-center items-center" key={index}>
            <button
              onClick={async () => {
                const role_id = selectedRoles[user._id];
                if (role_id) {
                  const success = await handleAdd(user._id, role_id);
                  if (success) {
                    Swal.fire({
                      icon: "success",
                      title: "Added Successfully",
                      text: `${user.name} has been added to the workgroup.`,
                      confirmButtonText: "OK",
                    });
                  } else {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "Failed to add user. Please try again.",
                      confirmButtonText: "OK",
                    });
                  }
                } else {
                  Swal.fire({
                    icon: "warning",
                    title: "Select a Role",
                    text: "Please select a role before adding.",
                    confirmButtonText: "OK",
                  });
                }
              }}
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
                !selectedRoles[user._id] && "opacity-50 cursor-not-allowed"
              }`}
              disabled={!selectedRoles[user._id] || disableAddButton}
            >
              Add
            </button>
          </span>,
        ],
      };
    });

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto px-6 justify-start font-sans mt-2">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/workgroup.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Workgroup
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Manage workgroup information, and assign users to each workgroup.
        </h1>
      </div>

      <div className="w-full h-full bg-white container  rounded-lg flex flex-col gap-4 mb-4 p-4 bg-white rounded-xl">
        <h1 className="text-2xl font-bold text-primary flex  items-center ">
          Current Workgroup: {user.workgroup}{" "}
        </h1>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Please select a role for the user before adding them to the workgroup.
        </h1>
        <hr className="w-full" />
        <div className="">
          <TableComponent
            headers={workgroupHeader}
            datas={dataUsersWorkgroup}
            searchColumn={"Name"}
            TableName={"Members"}
            filterColumn="Role"
          />
        </div>
        <hr className="w-full" />
        <div className="">
          <TableComponent
            headers={userHeader}
            datas={dataUsers}
            searchColumn={"Name"}
            TableName={"All users"}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Page;
