import React from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationImportantSharpIcon from '@mui/icons-material/NotificationImportantSharp';
import DeleteIcon from "@mui/icons-material/Delete";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const ShowmoreData = ({ data, close,showOptionAfterClickEvent ,handleDeleteEventFromShowMoreData,loginUser,selectedWorkgroup,workgroups}) => {
  //console.log('ShowmoreData data',data);
  //console.log('loginUser=',loginUser);
  //console.log( "selectedWorkgroup=\""+selectedWorkgroup+"\"");
  var openOptionDeleteJob=false;
  var selectWorkgroupName="";
  workgroups.forEach(element => {
          if(element._id===selectedWorkgroup){
                selectWorkgroupName=element.WORKGROUP_NAME;
                //console.log(element);
          }
  });
//  console.log('selectWorkgroupName',selectWorkgroupName);
  if(loginUser.workgroup===selectWorkgroupName && loginUser.role==="Admin Group"){
       // console.log("อยู่ใน Workgroup ");
       openOptionDeleteJob=true;
  }

  //console.log('workgroups',workgroups);
  const router = useRouter();
  const { events, date } = data;
  const [showCheckbox, setShowCheckbox] = useState(false); // เริ่มต้นให้แสดง checkbox
  const formattedDate = new Date(date).toLocaleDateString();
  const [checkedIds, setCheckedIds] = useState([]);
  //console.log("data", data);

const [sortedEvents, setSortedEvents] = useState([]);
const [sortKey, setSortKey] = useState(""); // "line_name" | "job_name"

useEffect(() => {
  handleSort("line_name");
}, []);




const handleSort = (key) => {
  setSortKey(key);
  const sorted = [...data.events].sort((a, b) =>
    (a[key] || "").localeCompare(b[key] || "")
  );
  setSortedEvents(sorted);
};


  const handleSelectEvent = (event) => {
    //console.log('use handleSelectEvent click on event');
    
    if (router) {
      let viewMode = "";
      if (event.status_name === "plan") {
        close();
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
        close();
        Swal.fire({
          title: "Checklist is overdue",
          text: "You cannot view the Checklist in overdue status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (event.status_name === "waiting for approval") {
        close();
        Swal.fire({
          title: "Checklist is waiting for approval",
          text: "You cannot view the Checklist in waiting for approval status",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      } else if (
        event.status_name === "new" ||
        event.status_name === "ongoing" ||
        event.status_name === "renew"
      ) {
        viewMode = "false";
      }
      sessionStorage.setItem("viewMode", viewMode);
      // router.push(`/pages/view-jobs?job_id=${event.job_id}`);
       const url = `/pages/view-jobs?job_id=${event.job_id}`;
       window.open(url, "_blank"); // เปิดหน้าใหม่ในแท็บใหม่
    }
  };

  
const handleCheckboxChange = (eventId, isChecked) => {
  console.log('eventId',eventId);
  // setCheckedIds((prev) => {
  //   if (isChecked) {
  //     return [...prev, eventId];
  //   } else {
  //     return prev.filter((id) => id !== eventId);
  //   }
  // });
};

const handleDelete = () => {
  // ค้นหา checkbox ที่ติ๊กอยู่
  const checkedCheckboxes = document.querySelectorAll(
    '.checkable-event:checked'
  );

  if (checkedCheckboxes.length === 0) {
    //Swal.fire("No checklist selected", "Please select at least one item", "info");
    return;
  }

  // ดึง job_id ที่ถูกเลือก
  const selectedJobIds = Array.from(checkedCheckboxes).map(
    (checkbox) => checkbox.dataset.jobId
  );

  //console.log("Deleting job_ids:", selectedJobIds);

  handleDeleteEventFromShowMoreData(selectedJobIds);

  
};

  return (
    <div
      className="w-3/4 h-full max-h-[80vh] bg-white p-5 rounded-lg shadow-lg overflow-y-auto relative"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitScrollbar: "none",
      }}
    >

      <div 
            id="header-bar"
            className="sticky top-0 z-10 bg-white"
            style={{border:'1px solid none',width:'100%',height:'5em',top:'-19px'}}
      >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-800">
              Checklists on {formattedDate}
            </h2>
            <IconButton onClick={close} className="absolute top-2 right-2">
              <CloseIcon />
            </IconButton>
          </div>
          <div>
            <li className="text-sm font-semibold text-gray-600">
              Total Checklists: {events.length}
            </li>
          </div>
          <div style={{borderBottom:'1px solid none',width:'100%',position:'relative'}}>
            <div className="flex items-center">
                  
                    <label className="ml-2 flex items-center">
                      <input
                        type="radio"
                        name="sorting"
                        className="w-5 h-5 text-red-500"
                        checked={sortKey === "line_name"}
                        onChange={() => handleSort("line_name")}
                         disabled={showCheckbox}
                      />
                      <span className="ml-1"> Line Name</span>
                    </label>

                    <label className="ml-4 flex items-center" >
                      <input
                        type="radio"
                        name="sorting"
                        className="w-5 h-5 text-red-500"
                        checked={sortKey === "job_name"}
                        onChange={() => handleSort("job_name")}
                         disabled={showCheckbox}
                      />
                      <span className="ml-1"> Job Name</span>
                    </label>            
              &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;

              {openOptionDeleteJob &&(
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hidden-show-select"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                      onChange={(e) => setShowCheckbox(e.target.checked)}
                      disabled={!openOptionDeleteJob} //1234
                    />

                  <label htmlFor="hidden-show-select" className="ml-2 cursor-pointer select-none">
                    Deletes
                  </label>&nbsp;&nbsp;&nbsp;

                    {showCheckbox && (
                      <DeleteIcon
                        className="w-5 h-5 text-red-500 ml-2 cursor-pointer transition-shadow duration-200 hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"
                        onClick={handleDelete}
                      />
                    )}
                  </div>
              )}
              
            </div>
          </div>         
      </div>  
      
      { <hr className="border-gray-300 my-4" />}
      <ul className="flex flex-col gap-3">
        
        <ul className="flex flex-wrap gap-2 overflow-auto max-h-96 custom-scroll">
          {sortedEvents.map((event, index) => (
            <li key={index} className="flex items-center justify-between gap-2">
             { showCheckbox && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    data-job-id={event.event_type + "-" + event.event_id}
                    className="checkable-event w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-400"
                  />
                  <span className="ml-2">-</span>
                </div>
            )}
              <span
                className="text-sm font-semibold p-3 text-white rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => showOptionAfterClickEvent(event)}
                style={{
                  backgroundColor: event.color || "#f0f0f0",
                }}
              >
                {event.title}
                {
                  event.last_get_by && event.status_name=="ongoing" && (
                    <AssignmentIndIcon style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }} />
                  )
                }
                {event.abnormal_item === 1 && (
                  <NotificationImportantSharpIcon style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }} />
                )}
                {event.sticker_verify === true && (
                  <VerifiedIcon style={{ marginLeft: 4, color: "white", fontSize: "1.5em" }} />
                )}
              </span>
            </li>

          ))}
        </ul>
      </ul>
    </div>
  );
};

export default ShowmoreData;
