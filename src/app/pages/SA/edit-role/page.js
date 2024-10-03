// 'use client'
// import React, { useState, useEffect } from "react";
// import SALayout from "@/components/SALayout";
// import Link from "next/link";
// import Listbox from "@/components/Listbox.js";
// import { config } from "@/config/config.js";
// import Swal from "sweetalert2";

// const Page = ({ searchParams }) => {
//   const role_id = searchParams.role_id;

//   const [dataRole, setDataRole] = useState({});
//   const [roleActions, setRoleActions] = useState([]);
//   const [actionList, setActionList] = useState([]);
//   const [selectedRoleActions, setSelectedRoleActions] = useState([]);
//   const [refresh, setRefresh] = useState(false);

//   useEffect(() => {
//     fetchRole();
//     fetchActions();
//     fetchRoleActions();
//   }, [refresh]);

//   const fetchRole = async () => {
//     try {
//       const response = await fetch(
//         `/api/role/get-role/${role_id}`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch roles");
//       }
//       const res = await response.json();
//       setDataRole(res);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const fetchActions = async () => {
//     try {
//       const response = await fetch(
//         `/api/action/get-actions`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch actions");
//       }
//       const res = await response.json();
//       setActionList(res.actions);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const fetchRoleActions = async () => {
//     try {
//       const response = await fetch(
//         `/api/role/get-action-from-role/${role_id}`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch role actions");
//       }
//       const res = await response.json();
//       setRoleActions(res.role_actions);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   function handleSelectedList(selectedItems) {
//     setSelectedRoleActions(() => selectedItems);
//   }

//   const handdleAddToRole = async () => {
//     try {
//       const response = await fetch(
//         `/api/role/add-action-to-role`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             role_id: role_id,
//             actions_id: selectedRoleActions,
//           }),
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to add actions to role");
//       }

//       const addedCount = selectedRoleActions.length;
//       Swal.fire({
//         icon: 'success',
//         title: 'Actions Added',
//         text: `${addedCount} action(s) added to ${dataRole.name}'s role`,
//       });

//       setRefresh(!refresh);
//     } catch (error) {
//       console.error(error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Oops...',
//         text: 'Failed to add actions to role',
//       });
//     }
//   };


//   const handdleRemoveFromRole = async () => {
//     try {
//       const response = await fetch(
//         `/api/role/remove-action-from-role`,
//         {
//           method: "DELETE",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             role_id: role_id,
//             actions_id: selectedRoleActions,
//           }),
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to remove actions from role");
//       }

//       setRefresh(!refresh);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <SALayout className="flex flex-col items-center gap-9 p-12 ">
//       <h1 className="text-2xl font-bold">Role {dataRole.name}</h1>
//       <div className="flex gap-20 container mx-auto left-0 right-0 justify-center p-6 items-center">
//         <div className="flex flex-col">
//           <p>This {dataRole.name}'s actions ({roleActions.length})</p>
//           <Listbox
//             data={roleActions}
//             handleSelectedList={handleSelectedList}
//           />
//         </div>
//         <div className="flex flex-col gap-4">
//           <button
//             className="bg-green-500 px-5 py-2 rounded-md hover:bg-green-600 text-white font-sans font-semibold"
//             onClick={handdleAddToRole}
//           >
//             Add to role
//           </button>
//           <button
//             className="bg-red-500 px-5 py-2 rounded-md hover:bg-red-600 text-white font-sans font-semibold"
//             onClick={handdleRemoveFromRole}
//           >
//             Remove from role
//           </button>
//         </div>
//         <div className="flex flex-col">
//           <p>All Actions ({actionList.length})</p>
//           <Listbox
//             data={actionList}
//             handleSelectedList={handleSelectedList}
//           />
//         </div>
//       </div>
//       <Link
//         href="/pages/SA/create-role"
//         className="absolute right-5 bottom-2 bg-yellow-400 px-5 py-2 rounded-md hover:bg-yellow-500"
//       >
//         Back to Manage Role
//       </Link>
//     </SALayout>
//   );
// };

// export default Page;

"use client";
import SALayout from "@/components/SALayout";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Listbox from "@/components/Listbox.js";
import { useState, useEffect } from "react";
import { config } from "../../../../config/config.js";

const Page = () => {
  const searchParams = useSearchParams();
  const role_id = searchParams.get("role_id");

  const [dataRole, setDataRole] = useState([]);
  const [roleActions, setRoleActions] = useState([]);
  const [actionList, setActionList] = useState([]);
  const [selectedRoleActions, setSelectedRoleActions] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    fetchRole();
    fetchActions();
    fetchRoleActions();
  }, [refresh]);

  const fetchRole = async () => {
    try {
      const response = await fetch(
        `/api/role/get-role/${role_id}`, { next: { revalidate: 10 } }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const res = await response.json();
      setDataRole(res);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await fetch(
        `/api/action/get-actions`, { next: { revalidate: 10 } }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const res = await response.json();

      setActionList(res.actions);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRoleActions = async () => {
    try {
      const response = await fetch(
        `/api/role/get-action-from-role/${role_id}`, { next: { revalidate: 10 } }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const res = await response.json();
      setRoleActions(res.role_actions);
    } catch (error) {
      console.error(error);
    }
  };

  function handleSelectedList(selectedItems) {
    setSelectedRoleActions(() => selectedItems);
  }

  const handdleAddToRole = async () => {
    try {
      const response = await fetch(
        `/api/role/add-action-to-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: role_id,
            actions_id: selectedRoleActions,
          }),
          next: { revalidate: 10 },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      setRefresh(!refresh);
    } catch (error) {
      console.error(error);
    }

  };

  const handdleRemoveFromRole = async () => {
    console.log("remove from role ")
    console.log(selectedRoleActions)
    try {
      const response = await fetch(
        `/api/role/remove-action-from-role`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: role_id,
            actions_id: selectedRoleActions,
          }),
          next: { revalidate: 10 },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      setRefresh(!refresh);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <SALayout className="flex flex-col items-center gap-9 p-12 ">
      <h1 className="text-2xl font-bold">Role {dataRole.name}</h1>
      <div className="flex gap-20 container mx-auto left-0 right-0 justify-center p-6 items-center">
        <div className="flex flex-col">
          <p>This {dataRole.name}'s actions ({roleActions.length})</p>
          <Listbox
            data={roleActions}
            handleSelectedList={handleSelectedList}
          />
        </div>
        <div className="flex flex-col gap-4">
          <button
            className="bg-green-500 px-5 py-2 rounded-md hover:bg-green-600 text-white font-sans font-semibold"
            onClick={handdleAddToRole}
          >
            Add to role
          </button>
          <button className="bg-red-500 px-5 py-2 rounded-md hover:bg-red-600 text-white font-sans font-semibold" onClick={handdleRemoveFromRole}>
            Remove from role

          </button>
        </div>
        <div className="flex flex-col">
          <p>All Actions ({actionList.length})</p>
          <Listbox
            data={actionList}
            handleSelectedList={handleSelectedList}
          />
        </div>
      </div>
      <Link
        href="/pages/SA/create-role"
        className="absolute right-5 bottom-2 bg-yellow-400 px-5 py-2 rounded-md hover:bg-yellow-500"
      >
        Back to Manage Role
      </Link>
    </SALayout>
  );
};

export default Page;
