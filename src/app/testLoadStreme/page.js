'use client'
import { useEffect, useState } from 'react';

const YourComponent = () => {
  const [jobs, setJobs] = useState([]); // หรือใช้ interface แทน any ก็ได้

  useEffect(() => {
    const fetchStream = async () => {
      //const res = await fetch('/api/job/get-jobs-all');
      //const res = await fetch('/api/job/get-jobs-from-workgroup/6698b0acfe8c7ef010d214de');
      const res = await fetch('/api/job/get-job-events/?workgroup_id=679987c578c9f93fbc00eb7a');
      //679987c578c9f93fbc00eb7a
      //6698b0acfe8c7ef010d214de
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary;
        while ((boundary = buffer.indexOf('\n')) >= 0) {
          const chunk = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);

          if (chunk) {
            try {
              const data = JSON.parse(chunk);
              console.log('📦 ได้ข้อมูล:', data);

              // ถ้า data เป็น array เช่น [ {}, {}, ... ]
              if (Array.isArray(data)) {
                setJobs(prev => [...prev, ...data]); // รวมเข้ากับ jobs ที่มีอยู่
              }

              // ถ้าเป็น object เดี่ยว ก็แปะต่อแบบนี้:
              // setJobs(prev => [...prev, data]);

            } catch (err) {
              console.error('❌ JSON parse error:', err, chunk);
            }
          }
        }
      }
    };

    fetchStream();
  }, []);

  return (
    <div>
      <h2>รวมข้อมูลจาก Stream</h2>
      <p>จำนวนทั้งหมด: {jobs.length} รายการ</p>
  
      {/* <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Job Name</th>
            <th>Doc Number</th>
            <th>Line Name</th>
            <th>Checklist Version</th>
            <th>WD Tag</th>
            <th>Status ID</th>
            <th>Submitter</th>
            <th>updatedAt</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr key={index}>
              <td>{job.JOB_NAME}</td>
              <td>{job.DOC_NUMBER}</td>
              <td>{job.LINE_NAME}</td>
              <td>{job.CHECKLIST_VERSION}</td>
              <td>{job.WD_TAG}</td>
              <td>{job.JOB_STATUS_ID}</td>
              <td>
                {job.SUBMITTED_BY?.EMP_NAME} ({job.SUBMITTED_BY?.USERNAME})
              </td>
              <td>{job.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default YourComponent;
