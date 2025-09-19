"use client";
import Layout from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchJobEvents from "@/lib/hooks/useFetchJobEvents";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import ShowmoreData from "@/app/pages/job-calendar/ShowmoreData";
import useFetchWorkgroups from "@/lib/hooks/useFetchWorkgroups";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationImportantSharpIcon from '@mui/icons-material/NotificationImportantSharp';
import { Alert } from "@mui/material";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);
const Page = () => {
  //console.log("job calandar");
  const router = useRouter();
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [refresh, setRefresh] = useState(false);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState("");
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const {
    workgroups,
    isLoading: workgroupLoading,
    error: workgroupError,
  } = useFetchWorkgroups();

  
  const { events, eventLoading, error } = useFetchJobEvents(
    selectedWorkgroup,
    selectedType,
    selectedPlanType,
    refresh
  );

  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState({});

  useEffect(() => {
    //console.log(" use fetch");
    if (user && user.workgroup_id) {
      //console.log(" use A");
      setSelectedWorkgroup(user.workgroup_id);
      setRefresh(!refresh);
    }
  }, [user.workgroup_id]);

  const handleViewChange = (newView) => {
    //console.log(" use handleViewChange ");
    setView(newView);
  };



const handleDeleteEventFromShowMoreData = async (events) => {
  close();
  //console.log("handleDeleteEventFromShowMoreData", events);
  try {
    const response = await fetch("/api/events/deletes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }), // ส่ง events array ไป
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire("Deleted!", `${events.length} item(s) removed`, "success");
      setRefresh(!refresh);
    } else {
      Swal.fire("Error!", result.message || "Failed to delete", "error");
    }
  } catch (error) {
    console.error("Delete error:", error);
    Swal.fire("Error!", "Network error or server issue", "error");
  }
};




const handleshowOptionAfterClickEvent = async (b) => { 
        //setDate(newDate);
            let data_lv1;
            try {
              const res = await fetch('/api/job/get-job-event-infomation?job_id='+b.job_id+'&user_id='+user._id+'&user_workgroup_id='+user.workgroup_id); // ✅ รอ fetch ให้เสร็จ
              data_lv1 = await res.json(); // ✅ รอ parse JSON
              //console.log('data fetch', data);
              // setJobInfo(data); // ถ้ามี state
            } catch (error) {
              console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
            }

        close();
            
            //console.log('data',data);    

            let htmlBtn=``;
              if(data_lv1.menu.includes('Get')){
                     htmlBtn+=`<button id="btn-get"   class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Get</button>`;
              }
              if(data_lv1.menu.includes('Edit')){
                     htmlBtn+=`<button id="btn-edit" class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Edit</button>`;
              }
              if(data_lv1.menu.includes('View')){
                     htmlBtn+=`<button id="btn-view" class="swal2-cancel swal2-styled" style="background-color:#2196F3;">View</button>`;
              }
              if(data_lv1.menu.includes('Approve')){
                     htmlBtn+=`<button id="btn-approve" class="swal2-cancel swal2-styled" style="background-color:#FF9800;">Approve</button>`;
              }
              if(data_lv1.menu.includes('Move')){
                     htmlBtn+=`<button id="btn-move" class="swal2-cancel swal2-styled" style="background-color:rgb(143, 138, 138);">Move</button>`;
              }

              if(data_lv1.menu.includes('Trigger')){
                     htmlBtn+=`<button id="btn-trigger" class="swal2-cancel swal2-styled" style="background-color:rgba(9, 180, 40, 1);">Trigger</button>`;
              }
              if(data_lv1.menu.includes('Delete')){
                     htmlBtn+=`<button id="btn-delete" class="swal2-cancel swal2-styled" style="background-color: #f44336;">Delete</button>`;
              }

              htmlBtn+=`
                <button id="btn-cancel" class="swal2-cancel swal2-styled">Cancel</button>
              `;



            Swal.fire({
            title: b.title,
            text: '',
            icon: 'info',
            showConfirmButton: false,
            html: htmlBtn,
            didOpen: () => {
              const popup = Swal.getPopup();

              popup.querySelector('#btn-get')?.addEventListener('click', () => {
                  sessionStorage.setItem("viewMode", false);
                  window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
                Swal.close();
                //console.log('➡️ GET action called for', b);
              });

              popup.querySelector('#btn-edit')?.addEventListener('click', () => {
                  sessionStorage.setItem("viewMode", false);
                  window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
                  Swal.close();
                //console.log('✏️ EDIT action called for', b);
              });

              popup.querySelector('#btn-view')?.addEventListener('click', () => {
                  sessionStorage.setItem("viewMode", true);
                  window.open("/pages/view-jobs?job_id=" + b.job_id, "_blank");
                  Swal.close();
               // console.log('👁 VIEW action called for', b);
              });
              popup.querySelector('#btn-approve')?.addEventListener('click', () => {
                 window.open("/pages/job-review?job_id=" + b.job_id, "_blank");
                 sessionStorage.setItem("approveMode", true);
                 Swal.close();
               // console.log('👁 VIEW action called for', b);
              });


               popup.querySelector('#btn-trigger')?.addEventListener('click', async () => {
                Swal.close(); // ปิด popup เดิมก่อน
                 // console.log('manual trigger ไปที่  schedual_id ',b);  
                      try{
                      //src/app/api/schedual/remove-schedual
                          const response = await fetch(`/api/schedual/schedual-manual-trigger`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              _id: [b.event_id],
                              //datetime:datetime
                              }), // ✅ ส่งเป็น array เสมอ
                          });                    
                          const data = await response.json();
                         // console.log('schedual-manual-trigger',data); 
                          if (data.status === 200) {
                                  //  setTimeout(function(){
                                  //     setRefresh(!refresh);
                                  //  },500);
                                    location.reload();
                                    // ลบสำเร็จ
                                    return;
                          }
                          alert(data.message);
                          //console.log('data',data);
                    }catch(err){
                            console.error("Error update job:", err); 
                    }
                 

               });


              popup.querySelector('#btn-move')?.addEventListener('click', () => {
                Swal.close(); // ปิด popup เดิมก่อน
                
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD ของวันนี้
                
                        Swal.fire({
                        title: ""+b.title,
                        html: `
                          <label for="swal-date">DateTime:</label><br/>
                          <input type="date" id="swal-date" class="swal2-input" min="${today}">
                          <input type="time" id="swal-time" class="swal2-input">
                        `,
                        showCancelButton: true,
                        confirmButtonText: "Submit",
                        preConfirm: () => {
                          const date = document.getElementById("swal-date").value;
                          const time = document.getElementById("swal-time").value;

                          if (!date) {
                            Swal.showValidationMessage("กรุณาเลือกวันที่");
                          }

                          if (!time) {
                            Swal.showValidationMessage("กรุณาเลือกเวลา");
                          }

                          return `${date} ${time}`;
                        }
                      }).then( async (result) => {
                        //console.log('result',result);

                        if (result.isConfirmed) {
                            //console.log('result isConfirmed',result.isConfirmed);
                              const datetime = result.value; 
                              try{
                                //src/app/api/schedual/remove-schedual
                                    const response = await fetch(`/api/schedual/edit-schedual`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                         _id: [b.event_id],
                                         datetime:datetime
                                        }), // ✅ ส่งเป็น array เสมอ
                                    });                    
                                    const data = await response.json();
                                    //console.log('data',data);
                                    if (data.status === 200) {
                                              setRefresh(!refresh);
                                              // ลบสำเร็จ
                                              return;
                                    }
                                    alert(data.message);
                                    //console.log('data',data);
                              }catch(err){
                                      console.error("Error update job:", err); 
                              }


                        }
                      });
              });

              popup.querySelector('#btn-delete')?.addEventListener('click', () => {
                Swal.close();
                //console.log('b',b);
                Swal.fire({
                  title: "Are you sure?",
                  text: "to delete \" "+b.title+"\"",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Yes, delete it!",
                  cancelButtonText: "No, cancel!",
                  reverseButtons: true,
                }).then(async (result) => {
                        if (result.isConfirmed) {
                          if(data_lv1.info.STATUS==='plan'){
                              try{
                                    const response = await fetch(`/api/schedual/remove-schedual`, {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ _id: [b.event_id]}), // ✅ ส่งเป็น array เสมอ
                                    });                    
                                    const data = await response.json();
                                    if (data.status === 200) {
                                              setRefresh(!refresh);
                                              return;
                                    }
                                    alert(data.message);
                              }catch(err){
                                      console.error("Error deleting job:", error); 
                              }
                          }else{
                              try{
                                    const response = await fetch(`/api/job/remove-job`, {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ job_ids: [b.job_id]}), // ✅ ส่งเป็น array เสมอ
                                    });                    
                                    const data = await response.json();
                                    if (data.status === 200) {
                                              setRefresh(!refresh);
                                              // ลบสำเร็จ
                                    }
                                    //console.log('data',data);
                              }catch(err){
                                      console.error("Error deleting job:", error); 
                              }
                          }
                          

                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                          console.log("ยกเลิกการลบ");
                          
                        }
                      });
               // console.log('👁 VIEW action called for', b);
              });
              popup.querySelector('#btn-cancel')?.addEventListener('click', () => {
                Swal.close();
                //console.log('❌ Cancelled');
              });
            }
          });




};


  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setDate(newDate);
  };

  // Define the eventPropGetter function
  const eventPropGetter = (event, start, end, isSelected) => {
       // const isMonthView = view === 'month';
       // const sameDay = start.toDateString() === end.toDateString();

       //console.log('event',event);

        // ถ้าอยู่ใน month view และ event ข้ามวัน ให้เปลี่ยน end เป็นวันเดียวกับ start
       // if (isMonthView && !sameDay) {
        //  event.end = new Date(start);
       //   event.end.setHours(start.getHours() + 1); // ให้สิ้นสุดในชั่วโมงเดียวกัน
       // }

    return {
      style: {
        fontSize: "0.8em", // กำหนดขนาดตัวอักษรที่ต้องการ
        backgroundColor: event.color || "#3174ad",
      },
    };
  };

  // Define the dayPropGetter function
  const dayPropGetter = (date) => {
    const isCurrentDate = moment(date).isSame(new Date(), "day");
    return {
      style: {
        border: isCurrentDate ? "2px solid #bebebe" : undefined,
        backgroundColor: isCurrentDate ? "white" : undefined,
        boxShadow: isCurrentDate ? "0px 4px 8px rgba(0, 0, 0, 0.2)" : undefined,
        padding: "2em",
      },
    };
  };

  // Define the onSelectEvent function
  const handleSelectEvent = (event) => {
    //console.log('use handleSelectEvent event',event);
    handleshowOptionAfterClickEvent(event);

    return ;  

    if (router) {
      let viewMode = "";
      if (event.status_name === "plan") {
        Swal.fire({
          title: "Checklist is in plan status",
          text: "You cannot view the Checklist in plan status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (event.status_name === "complete") {
        viewMode = "true";
      } else if (event.status_name === "overdue") {
        Swal.fire({
          title: "Checklist is overdue",
          text: "You cannot view the Checklist in overdue status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }/* else if (event.status_name === "waiting for approval") {
        Swal.fire({
          title: "Checklist is waiting for approval",
          text: "You cannot view the Checklist in waiting for approval status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }*/ else if (
        event.status_name === "new" ||
        event.status_name === "ongoing" ||
        event.status_name === "renew"
      ) {
        viewMode = "false";
      }
      sessionStorage.setItem("viewMode", viewMode);
      
    //  router.push(`/pages/view-jobs?job_id=${event.job_id}`);
    const url = `/pages/view-jobs?job_id=${event.job_id}`;
    window.open(url, "_blank"); // เปิดหน้าใหม่ในแท็บใหม่

    }
  };
  const handleShowmore = (events, date) => {
    setEventData({ events, date: date.toString() });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
  };

  const handleChangeWorkgroup = (e) => {
    setSelectedWorkgroup(e);
    setRefresh(!refresh);
  };


  const handleChangeType = (selectedType) => {
      //console.log("selectedType",selectedType);
      try{
            if(selectedType==="plan"){
                    document.getElementById('plan-type-panel').style.display='block';
            }else{
                    document.getElementById('plan-type-panel').style.display='none';
            }
      }catch(err){
              console.log(err);
      }


      setSelectedType(selectedType);
      setRefresh(!refresh);
    /* if (selectedType === "all") {
      setEvents(allEvents);
    } else {
      const filtered = allEvents.filter(
        (event) => event.status_name.toLowerCase() === selectedType.toLowerCase()
      );
      setEvents(filtered);
    }*/
  };


  const handleChangePlanType = (selectedPlanType) => {
      //console.log("setEvents");
      setSelectedPlanType(selectedPlanType);
      setRefresh(!refresh);
    /* if (selectedType === "all") {
      setEvents(allEvents);
    } else {
      const filtered = allEvents.filter(
        (event) => event.status_name.toLowerCase() === selectedType.toLowerCase()
      );
      setEvents(filtered);
    }*/
  };


  const CustomEvent = ({ event }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
        {event.title}
      </span>
      {
        event.abnormal_item===1&&(
          <NotificationImportantSharpIcon style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }} />
        )
      }
      {event.sticker_verify === true && (
        <VerifiedIcon style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }} />
      )}
    </div>
  );
};


  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Link href="/pages/dashboard">
            <ArrowBackIosNewIcon />
          </Link>
          <Image
            src="/assets/card-logo/calendar.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Calendar
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Details on activation dates for all checklists.
        </h1>
      </div>
      <div className="bg-white rounded-xl p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 mt-4">
          <div className="flex flex-col md:flex-row">
            <label className="mb-2 md:mb-0">
              Date:
              <input
                type="date"
                className="text-sm border border-gray-300 rounded-md p-1 ml-2 "
                value={moment(date).format("YYYY-MM-DD")}
                onChange={handleDateChange}
                disabled={eventLoading}
              />
            </label>
            <label className="md:ml-4">
              Workgroup:
              <select
                className={`text-sm border border-gray-300 rounded-md p-1 ml-2 ${eventLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                onChange={(e) => handleChangeWorkgroup(e.target.value)}
                disabled={eventLoading}
              >
                <option value="" disabled>
                  Select workgroups
                </option>
                <option value="all">All</option>
                {workgroups.map((workgroup) => (
                  <option
                    key={workgroup._id}
                    value={workgroup._id}
                    selected={user.workgroup_id === workgroup._id}
                  >
                    {workgroup.WORKGROUP_NAME}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:ml-4">
              Type :
              { <select
                className={`text-sm border border-gray-300 rounded-md p-1 ml-2 ${eventLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                onChange={(e) => handleChangeType(e.target.value)}
                disabled={eventLoading}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="ongoing">ongoing</option>
                <option value="plan">Plan</option>
                <option value="overdue">Overdue</option>
                <option value="waiting for approval">Waiting for approval</option>
                <option value="complete">Complete</option>
                <option value="renew">Renew</option>
                {/* {workgroups.map((workgroup) => (
                  <option
                    key={workgroup._id}
                    value={workgroup._id}
                    selected={user.workgroup_id === workgroup._id}
                  >
                    {workgroup.WORKGROUP_NAME}
                  </option>
                ))} */}
              </select> }
            </label>
            <label id='plan-type-panel' style={{display:'none'}} className="md:ml-4">
                  Plan Type:
                  { <select
                className={`text-sm border border-gray-300 rounded-md p-1 ml-2 ${eventLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                onChange={(e) => handleChangePlanType(e.target.value)}
                disabled={eventLoading}
              >
                <option value="" enabled>
                  All
                </option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="2monthly">2Monthly</option>
                <option value="3monthly">3Monthly</option>
                <option value="6monthly">6Monthly</option>
                <option value="yearly">Yearly</option>           
              </select> }  
            </label>


          </div>
        </div>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {/* Status indicators */}
            <div
              className="flex items-center"
              title="New: The checklist that has just activated, and no one hasn't edited yet."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#0081ff" }}
              ></span>
              <span className="text-sm">New</span>
            </div>
            <div
              className="flex items-center"
              title="Ongoing: The checklist is being edited by some checker."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#E76E03" }}
              ></span>
              <span className="text-sm">Ongoing</span>
            </div>
            <div
              className="flex items-center"
              title="Plan: The checklist hasn't been activated, but it will activate at the time it's set."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#D5DBDB" }}
              ></span>
              <span className="text-sm">Plan</span>
            </div>
            <div
              className="flex items-center"
              title="Waiting for approval: The checklist has been submitted and is waiting for approval."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#FFBB61" }}
              ></span>
              <span className="text-sm">Waiting for approval</span>
            </div>
            <div
              className="flex items-center"
              title="Complete: The checklist has been approved."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#3cb371" }}
              ></span>
              <span className="text-sm">Complete</span>
            </div>
            <div
              className="flex items-center"
              title="Renew: The checklist has been rejected and needs to be retaken."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#FFD700" }}
              ></span>
              <span className="text-sm">Renew</span>
            </div>
            <div
              className="flex items-center"
              title="Overdue: The checklist has exceeded the timeout."
            >
              <span
                className="w-4 h-4 inline-block mr-2 rounded-full"
                style={{ backgroundColor: "#ff0000" }}
              ></span>
              <span className="text-sm">Overdue</span>
            </div>
          </div>
        </div>
        <div style={{ height: 800 }} className="overflow-auto">
          <Calendar
            localizer={localizer}
            events={[...(events || [])]}
            step={60}
            views={["month"]}
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            onShowMore={(events, date) => handleShowmore(events, date)}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            onSelectEvent={handleSelectEvent}
             components={{
              event: CustomEvent,
            }}
          />
        </div>
      </div>

      <Modal open={open} onClose={close}>
        <Box
          className="absolute top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/2  max-w-3xl w-full max-h-90vh overflow-y-auto p-4 rounded-lg "
          sx={{ outline: "none" }}
        >
          <ShowmoreData 
          data={eventData} close={close}  
          showOptionAfterClickEvent={handleshowOptionAfterClickEvent}
           handleDeleteEventFromShowMoreData={handleDeleteEventFromShowMoreData}
           loginUser={user}
           selectedWorkgroup={selectedWorkgroup}
           workgroups={workgroups}
           />
        </Box>
      </Modal>
    </Layout>
  );
};

export default Page;
