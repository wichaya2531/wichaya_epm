"use client";
import Image from "next/image";
import { config } from "@/config/config.js";

export default function Page({ params }) {
  
  console.log("test xxxx");
  //console.log(config);  
  
  const handleActivateClick = async () => {
      // เพิ่ม logic ที่คุณต้องการ
      if (!params.jobID) {
        console.error("No jobID provided.");
        return;
      }
    
      try {
        
          //console.log(`/api/acknowledge`);
          const response = await fetch(`/api/acknowledge`, {

          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taskID: params.jobID }),
        });
    
        if (response.ok) {
          console.log(`Task ID ${params.jobID} acknowledged successfully..`);
          document.getElementById(params.jobID).innerHTML="Success"; 


        } else {
          console.error("Failed to acknowledge task:", response.statusText);
        }
      } catch (error) {
        console.error("Error acknowledging task:", error);
      }

  };


  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {/* Card Container */}
      <div style={{
        width: "550px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        marginTop: "20px", // เว้นระยะจากขอบบน
        height:"450px"
      }}>
        
        {/* Header */}
        <header style={{
          backgroundColor: "rgb(29 78 216 / var(--tw-bg-opacity))", 
          backgroundColor: "#007BFF",
          color: "white",
          padding: "15px",
          textAlign: "center",
          fontSize: "20px",
        }}>
          <h2>e - PM System :: Acknowledge Overdue Task</h2>
        </header>

        {/* Main Content */}
        <main style={{
          padding: "20px",
          textAlign: "center",
        }}>
          {/* Acknowledge Icon */}
          <center>
              <Image  
                    src="/assets/images/e_pm-Icon.ico" 
                    alt="e-PM Icon" 
                    width={150} // กำหนดขนาดภาพ
                    height={150} 
                />
          </center>

          {/* Acknowledge Button with red border */}

          <hr></hr>
           TaskID :: {params.jobID}
          <hr></hr>
          <button 
            id={params.jobID}
            className="btn btn-primary btn-lg mt-4" 
            style={{
              width: "200px", 
              border: "2px solid lime", // เส้นขอบสีเขียว
              fontWeight: "900",
              transition: "all 0.3s ease", // การเปลี่ยนแปลงแบบค่อยเป็นค่อยไป
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)"; // ขยายขนาดปุ่ม
              e.target.style.borderColor = "red"; // เปลี่ยนสีขอบเป็นแดง
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)"; // คืนขนาดปกติ
              e.target.style.borderColor = "lime"; // คืนสีขอบเดิม
            }}
            onClick={handleActivateClick}
          >
            Acknowledge
          </button>
        </main>

      </div>
    </div>
  );
}
