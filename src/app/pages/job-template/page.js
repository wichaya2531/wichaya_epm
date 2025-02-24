"use client";
import Layout from "@/components/Layout.js";
import Select from "react-select";
import TableComponent from "@/components/TableComponent.js";
import PageviewIcon from "@mui/icons-material/Pageview";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/utils/utils.js";
import Swal from "sweetalert2";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import useFetchWorkgroups from "@/lib/hooks/useFetchWorkgroups";

const enabledFunction = {
  "create-job-template": "6632f9e4eccb576a719dfa7a",
  "view-all-job-templates": "663845e3d81a314967236de6",
  "manage-line-name": "66fb9799dc63c132e138e292",
};

const approverHeader = ["ID", "Name", "Action"];
const notifyHeader = ["ID", "Name", "Action"];
const notifyOverdueHeader = ["ID", "Name", "Action"];

const Page = () => {
  const { workgroups, loading, error } = useFetchWorkgroups();
  const [selectLineNames, setSelectLineNames] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [notifies, setNotifies] = useState([]);
  const [notifiesOverdue, setNotifiesOverdue] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [selectedNotify, setSelectedNotify] = useState(null);
  const [selectedNotifyOverdue, setSelectedNotifyOverdue] = useState(null);
  const [users, setUsers] = useState([]);
  const [options, setOptions] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [user, setUser] = useState({});
  const [userEnableFunctions, setUserEnableFunctions] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  //const [showPopup, setShowPopup] = useState(false);
  //const togglePopup = () => setShowPopup(!showPopup);

  useEffect(() => {
    retreiveSession();
    calculateDueDate();
    fetchUsers();
    //fetchMachines();
    getCurrentUser();
  }, [refresh]);

  const getCurrentUser = async () => {
    const session = await getSession();
    if (session) {
      //console.log("session=>",session);
      fetchLineNames(session);
      //setcurrentUser(session);
      //fetchLineNames(session);
    } else {
      console.error("Failed to get session.");
    }
  };

  useEffect(() => {
    if (user && users && workgroups) {
      // หาค่าของ workgroup ที่ตรงกับ user.workgroup
      const currentWorkgroup = workgroups.find(
        (workgroup) => workgroup.WORKGROUP_NAME === user.workgroup
      );
      // กรอง users สำหรับ Add Approver และ Add Notify Active ตาม USER_LIST ของ workgroup
      if (currentWorkgroup) {
        const filteredUsers = users
          .filter((userItem) =>
            currentWorkgroup.USER_LIST.includes(userItem._id)
          )
          .map((userItem) => ({
            value: userItem._id,
            label: userItem.name,
          }));
        setFilteredOptions(filteredUsers);
      }
    }
  }, [approvers, notifies, users, workgroups, user]);

  useEffect(() => {
    // สำหรับ Add Notify Overdue ใช้ users ทั้งหมด
    const allUsers = users.map((userItem) => ({
      value: userItem._id,
      label: userItem.name,
    }));
    setAllOptions(allUsers); // อัปเดตตัวเลือกสำหรับ Add Notify Overdue
  }, [users]);

  const retreiveSession = async () => {
    try {
      const session = await getSession();
      await fetchUser(session.user_id);
    } catch (err) {
      console.log(err);
      //return { message: "Wrong credential Please try again" };
    }
  };

  const fetchUser = async (userId) => {
    try {
      const response = await fetch(`/api/user/get-user/${userId}`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setUser(() => data.user);
      setUserEnableFunctions(() => data.user.actions);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/user/get-users`, {
        next: { revalidate: 10 },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();

      setUsers(data.users);
      const userOptions = data.users.map((user) => ({
        value: user._id,
        label: user.name,
      }));
      setOptions(userOptions);
      //fetchLineNames(data.users);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchLineNames = async (userSession) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userSession.user_id);
      const response = await fetch(`/api/select-line-name/get-line-name`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === 200) {
        setSelectLineNames(data.selectLineNames);
      } else {
        console.error("Failed to fetch data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching line names:", error);
    }
  };

  const handleAddApprover = () => {
    if (!selectedApprover) {
      Swal.fire("Oops...", "Please select a Approver!", "error");
      return;
    }
    const newApprover = {
      user_id: selectedApprover.value,
      name: selectedApprover.label,
    };
    setApprovers((prevApprovers) => [...prevApprovers, newApprover]);
    setSelectedApprover(null);

    // Update options after adding approver
    const newOptions = options.filter(
      (option) => option.value !== selectedApprover.value
    );
    setOptions(newOptions);
  };

  const handleAddNotify = () => {
    if (!selectedNotify) {
      Swal.fire("Oops...", "Please select a Notify!", "error");
      return;
    }
    const newNotify = {
      user_id: selectedNotify.value,
      name: selectedNotify.label,
    };
    setNotifies((prevNotifies) => [...prevNotifies, newNotify]);
    setSelectedNotify(null);

    // Update options after adding notify
    const newOptions = options.filter(
      (option) => option.value !== selectedNotify.value
    );
    setOptions(newOptions);
  };

  const handleAddNotifyOverdue = () => {
    if (!selectedNotifyOverdue) {
      Swal.fire("Oops...", "Please select a Notify Overdue!", "error");
      return;
    }

    const newNotifyOverdue = {
      user_id: selectedNotifyOverdue.value,
      name: selectedNotifyOverdue.label,
    };

    // เพิ่ม Notify Overdue ใหม่ไปยัง state
    setNotifiesOverdue((prevNotifiesOverdue) => [
      ...prevNotifiesOverdue,
      newNotifyOverdue,
    ]);
    setSelectedNotifyOverdue(null);

    // Update options after adding notify overdue
    const newOptions = options.filter(
      (option) => option.value !== selectedNotifyOverdue.value
    );
    setOptions(newOptions);
  };


  const handleRemoveApprover = (userId) => {
    const removedApprover = users.find((user) => user._id === userId);
    setApprovers(approvers.filter((approver) => approver.user_id !== userId));

    // Add removed approver back to options
    const newOptions = [
      ...options,
      { value: removedApprover._id, label: removedApprover.name },
    ];
    setOptions(newOptions);
  };

  const handleRemoveNotify = (userId) => {
    const removedNotify = users.find((user) => user._id === userId);
    setNotifies(notifies.filter((Notify) => Notify.user_id !== userId));

    // Add removed notify back to options
    const newOptions = [
      ...options,
      { value: removedNotify._id, label: removedNotify.name },
    ];
    setOptions(newOptions);
  };

  const handleRemoveNotifyOverdue = (userId) => {
    const removedNotifyOverdue = users.find((user) => user._id === userId);

    // ลบ notify overdue จาก state
    setNotifiesOverdue(
      notifiesOverdue.filter(
        (notifyOverdue) => notifyOverdue.user_id !== userId
      )
    );

    // เพิ่ม notify overdue ที่ถูกลบกลับไปใน options
    const newOptions = [
      ...options,
      { value: removedNotifyOverdue._id, label: removedNotifyOverdue.name },
    ];
    setOptions(newOptions);
  };

  const dataApprover = approvers.map((approver, index) => {
    return {
      ID: index + 1,
      Name: approver.name,
      Action: (
        <button
          onClick={() => handleRemoveApprover(approver.user_id)}
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const dataNotify = notifies.map((notify, index) => {
    return {
      ID: index + 1,
      Name: notify.name,
      Action: (
        <button
          onClick={() => handleRemoveNotify(notify.user_id)}
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const dataNotifyOverdue = notifiesOverdue.map((notifyOverdue, index) => {
    return {
      ID: index + 1,
      Name: notifyOverdue.name,
      Action: (
        <button
          onClick={() => handleRemoveNotifyOverdue(notifyOverdue.user_id)}
          className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Remove
        </button>
      ),
    };
  });

  const handleSubmit = async (e) => {
    //console.log("submit to create ");
    e.preventDefault();

    const formData = new FormData(e.target);
    const AUTHOR_ID = user._id;
    const JOB_TEMPLATE_NAME = formData.get("job_template_name");
    const DOC_NUMBER = formData.get("doc_num");
    const LINE_NAME = formData.get("line_name");
    const DUE_DATE = formData.get("due_date");
    const CHECKLIST_VERSION = formData.get("checklist_ver");
    const TIMEOUT = formData.get("timeout");
    const WORKGROUP_ID = user.workgroup_id;
    const APPROVERS_ID = approvers.map((approver) => approver.user_id);
    const NOTIFIES_ID = notifies.map((notify) => notify.user_id);
    const NOTIFIES_OVERDUE_ID = notifiesOverdue.map(
      (notifyOverdue) => notifyOverdue.user_id
    );
    const PICTURE_EVEDENT_REQUIRE = document.getElementById('picture-evident-require').checked?true:false;
    const AGILE_SKIP_CHECK=document.getElementById('agile-skip-check').checked?true:false;
    
    //console.log("PICTURE_EVEDENT_REQUIRE",PICTURE_EVEDENT_REQUIRE);

    //console.log("APPROVERS_ID",APPROVERS_ID);  
    if (APPROVERS_ID.length==0) {
          const result = await Swal.fire({
            title: 'Notifty',
            text: "You have not specified the Approver List for this template. Do you want to confirm this action?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Continue',
            cancelButtonText: 'Back to Edit',
          });
        
          if (result.isConfirmed) {
            // หากกด Continue
            //console.log('ดำเนินการต่อ');
            // ทำงานที่ต้องการที่นี่ เช่น ส่งข้อมูลหรือไปยังหน้าถัดไป
          } else {
            // หากกด Cancel
            return; 
            //console.log('ยกเลิกการดำเนินการ');
          }
     }



   // return;

    const data = {
      AUTHOR_ID,
      JOB_TEMPLATE_NAME,
      DOC_NUMBER,
      LINE_NAME,
      DUE_DATE,
      CHECKLIST_VERSION,
      TIMEOUT,
      WORKGROUP_ID,
      APPROVERS_ID,
      NOTIFIES_ID,
      NOTIFIES_OVERDUE_ID,
      PICTURE_EVEDENT_REQUIRE,
      AGILE_SKIP_CHECK,
    };

    try {
      const res = await fetch(`/api/job-template/create-job-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        next: { revalidate: 10 },
      });
      const response = await res.json();
      if (response.status === 500) {
        console.error(response.error);
      } else {
        Swal.fire({
          title: "Done!",
          text: "You have successfully created a Checklist template!",
          icon: "success",
        });
        e.target.reset();
        setApprovers([]);
        setNotifies([]);
        setNotifiesOverdue([]);
        setDueDate("");
        //setSelectedMachine(null);
        setSelectedApprover(null);
        setOptions([]);
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      console.error("Error creating Checklist template:", error);
    }
  };

  const calculateDueDate = () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    setDueDate(formattedDate);
  };

  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-2">
        {/* Checklist Template Section */}
        <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl flex-grow">
          <div className="flex items-center">
            <Link href="/pages/dashboard">
              <ArrowBackIosNewIcon />
            </Link>
            <Image
              src="/assets/card-logo/template.png"
              alt="wd logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h1 className="text-3xl font-bold text-slate-900">
               <p>Create</p> 
               <hr></hr>
               <p>Checklist Template</p>               
            </h1>
          </div>
          <p className="text-sm font-bold text-secondary flex items-center">
            Manage Checklist Template and its items
          </p>
        </div>

        {/* View All Checklist Templates Button */}
        <Link
          href="/pages/job-item-template"
          className={`align-left text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center
      ${
        !userEnableFunctions.some(
          (action) => action._id === enabledFunction["view-all-job-templates"]
        ) && "opacity-50 cursor-not-allowed"
      }`}
        >
          <div className="flex gap-3 items-center ">
            <p>View all<hr></hr> Checklist Templates</p>
            {/* <PageviewIcon /> */}
          </div>
        </Link>
      </div>

      <div className="mb-4 p-4 bg-white rounded-xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-3">
            <div>
              <label
                for="author"
                className="block mb-2 text-sm font-medium text-black "
              >
                Author
              </label>
              <input
                type="text"
                id="author"
                className="max-w-[300px] bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={user.name}
                name="author"
                required
                disabled
              />
            </div>
            <div>
              <label
                for="workgroup"
                className="block mb-2 text-sm font-medium text-black "
              >
                Workgroup
              </label>
              <input
                type="text"
                id="workgroup"
                className="max-w-[300px] bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={user.workgroup}
                name="workgroup"
                required
                disabled
              />
            </div>

            <div>
              <label
                for="due_date"
                className="block mb-2 text-sm font-medium text-black "
              >
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="max-w-[300px] bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="due_date"
                required
              />
            </div>
            <div>
              <label
                for="job_template_name"
                className="block mb-2 text-sm font-medium text-black "
              >
                Checklist Template Name
              </label>
              <input
                type="text"
                id="job_template_name"
                className="max-w-[300px] bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Template Name"
                name="job_template_name"
                required
              />
            </div>
            <div>
              <label
                for="doc_num"
                className="block mb-2 text-sm font-medium text-black"
              >
                Document no.
              </label>
              <input
                type="text"
                id="doc_num"
                className="max-w-[300px] bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="2092-810000-000"
                name="doc_num"
                required
              />
            </div>
            <div>
              <label
                for="checklist_ver"
                className="block mb-2 text-sm font-medium text-black"
              >
                Checklist Version
              </label>
              <input
                type="text"
                id="checklist_ver"
                className="max-w-[300px] bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="AE,AF,07,08"
                name="checklist_ver"
                required
              />
            </div>

            <div className="z-50">
              <label
                for="timeout"
                className="block mb-2 text-sm font-medium text-black"
              >
                Line Name
              </label>
              <select
                id="line_name"
                className="max-w-[300px] p-x-10 bg-white border border-gray-300 text-gray-900 text-[1em] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="line_name"
              >
                <option value="">
                  &nbsp;&nbsp;&nbsp;Select&nbsp;&nbsp;&nbsp;
                </option>
                <option value="N/A">
                  &nbsp;&nbsp;&nbsp;N/A&nbsp;&nbsp;&nbsp;
                </option>
                {selectLineNames.map((lineName) => (
                  <option key={lineName._id} value={lineName.name}>
                    {lineName.name}
                  </option>
                ))}
              </select>

              {/* <input
                type="text"
                id="line_name"
                className="max-w-[300px] bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  placeholder-gray-400 text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="@line_name"
                name="line_name"
                required
              /> */}
            </div>
            <div className="z-50">
              <label
                for="timeout"
                className="block mb-2 text-sm font-medium text-black"
              >
                Timeout
              </label>
              <Select
                options={[
                  { value: "12 hrs", label: "12 hrs" },
                  { value: "1 days", label: "1 days" },
                  { value: "3 days", label: "3 days" },
                  { value: "7 days", label: "7 days" },
                  { value: "15 days", label: "15 days" },
                  { value: "30 days", label: "30 days" },
                  { value: "3 mounths", label: "3 months" },
                  { value: "6 months", label: "6 months" },
                  { value: "12 months", label: "12 months" },
                ]}
                isSearchable={true}
                name="timeout"
                className="z-50 max-w-[300px]"
              />
            </div>

            <div className="flex gap-5 ">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="visitors"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Approver
                </label>
                <Select
                  options={filteredOptions}
                  value={selectedApprover}
                  onChange={setSelectedApprover}
                  isSearchable={true}
                  className="z-40 max-w-[300px]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddApprover}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>
            <div className="flex gap-5 ">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="visitors"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Notify Active
                </label>
                <Select
                  options={filteredOptions}
                  value={selectedNotify}
                  onChange={setSelectedNotify}
                  isSearchable={true}
                  className="z-30 max-w-[300px]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNotify}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>
            <div className="flex gap-5">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="visitors"
                  className="block mb-2 text-sm font-medium text-black"
                >
                  Add Notify Overdue
                </label>
                <Select
                  options={allOptions}
                  value={selectedNotifyOverdue}
                  onChange={setSelectedNotifyOverdue}
                  isSearchable={true}
                  className="z-20 max-w-[300px]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNotifyOverdue}
                className="text-white translate-y-6 bg-green-700 hover:bg-green-800 focus:ring-4 font-bold focus:outline-none w-5 focus:ring-green-300 rounded-lg text-sm sm:w-auto px-5 py-1 h-10 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Add
              </button>
            </div>

            <div className="flex flex-col items-start space-y-2 border-red-300" style={{ height:'auto', padding: '10px'}}>
              <div id='1' style={{border:'1px solid none', padding: '5px'}}>
                <input
                  type="checkbox"
                  id="picture-evident-require"                    
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                />
                <label className="text-gray-800 pr-2 font-medium text-sm md:text-base">
                    &nbsp;&nbsp;&nbsp;Evident Picture Require
                </label>
              </div>
              <div id='2' style={{border:'1px solid none', padding: '5px'}}>
                <input
                    type="checkbox"
                    id="agile-skip-check"                    
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                  />
                <label className="text-gray-800 pr-2 font-medium text-sm md:text-base">
                    &nbsp;&nbsp;&nbsp;Agile Skip Check
                </label>
              </div>
            </div> 


          </div>
          {
            // check if user has permission to create Checklist template
            userEnableFunctions.some(
              (action) => action._id === enabledFunction["create-job-template"]
            ) ? (
              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                <p>Create</p>
                <hr></hr>
                <p>Checklist Template.</p>
               
              </button>
            ) : (
              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-not-allowed"
                disabled
              >
                <p>Create</p>
                <hr></hr>
                <p>Checklist Template.</p>
              </button>
            )
          }
        </form>
        <hr className="mt-5" />
        <TableComponent
          headers={approverHeader}
          datas={dataApprover}
          TableName="Approver List"
          searchColumn="Name"
        />
        <TableComponent
          headers={notifyHeader}
          datas={dataNotify}
          TableName="Notify Active List"
          searchColumn="Name"
        />
        <TableComponent
          headers={notifyOverdueHeader}
          datas={dataNotifyOverdue}
          TableName="Notify Overdue List"
          searchColumn="Name"
        />
      </div>
    </Layout>
  );
};

export default Page;
