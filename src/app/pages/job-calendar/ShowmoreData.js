import React from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import Swal from "sweetalert2";

const ShowmoreData = ({ data, close }) => {
  const router = useRouter();
  const { events, date } = data;
  const formattedDate = new Date(date).toLocaleDateString();
  
  //console.log("data", data);

  const handleSelectEvent = (event) => {
    if (router) {
      if (event.status_name === 'plan') {
        close();
        Swal.fire({
          title: 'Checklist is in plan status',
          text: 'You cannot view the Checklist in plan status',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      } else if (event.status_name === 'complete') {
        router.push(`/pages/view-jobs?job_id=${event.job_id}&view=true`);
      } else if (event.status_name === 'overdue') {
        close();
        Swal.fire({
          title: 'Checklist is overdue',
          text: 'You cannot view the Checklist in overdue status',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }
      else if (event.status_name === 'new') {
        router.push(`/pages/view-jobs?job_id=${event.job_id}&view=false`);
      }
      else if (event.status_name === 'ongoing') {
        router.push(`/pages/view-jobs?job_id=${event.job_id}&view=false`);
      }
      else if (event.status_name === 'waiting for approval') {
        close();
        Swal.fire({
          title: 'Checklist is waiting for approval',
          text: 'You cannot view the Checklist in waiting for approval status',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }
      else if (event.status_name === 'renew') {
        router.push(`/pages/job-renew?job_id=${event.job_id}`);
      }

      else {
        router.push(`/pages/view-jobs?job_id=${event.job_id}&view=true`);
      }
    }
  };

  return (
    <div className="w-3/4 h-full max-h-[80vh] bg-white p-5 rounded-lg shadow-lg overflow-y-auto relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: 'none' }}>
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold text-gray-800">Checklists on {formattedDate}</h2>
        <IconButton onClick={close} className="absolute top-2 right-2">
          <CloseIcon />
        </IconButton>
      </div>
      <hr className="border-gray-300 my-4" />
      <ul className="flex flex-col gap-3">
        <li className="text-sm font-semibold text-gray-600">Total Checklists: {events.length}</li>
        <ul className="flex flex-wrap gap-2">
          {events.map((event, index) => (
            <li
              key={index}
              className="flex items-start justify-between"
            >
              <span
                className="text-sm font-semibold p-3 text-white rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectEvent(event)}
                style={{
                  backgroundColor: event.color || '#f0f0f0',
                }}
              >
                {event.title}
              </span>
            </li>
          ))}
        </ul>

      </ul>
    </div>
  );
}

export default ShowmoreData;
