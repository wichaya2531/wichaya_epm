'use client'
import { useState } from 'react';

const UploadPage = () => {
  const [file, setFile] = useState(null); // เก็บไฟล์ที่ผู้ใช้เลือก
  const [uploading, setUploading] = useState(false); // เก็บสถานะการอัปโหลด

  // ฟังก์ชันจัดการการเลือกไฟล์
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // ฟังก์ชันจัดการการอัปโหลดไฟล์
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await fetch('/api/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        alert('File uploaded successfully');
      } else {
        alert('File upload failed: ' + result.error);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Upload File</h1>

      <input type="file" onChange={handleFileChange} />

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default UploadPage;
