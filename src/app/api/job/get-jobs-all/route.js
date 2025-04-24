import { Job } from "@/lib/models/Job";
import { connectToDb } from "@/app/api/mongo/index.js";

export async function GET() {
    await connectToDb();
    

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {

        const gap=1000;    

        for (let i = 1; i <= 10; i++) {
          const jobs = await Job.find().skip((i - 1) * gap).limit(gap); // ✅
          
          
          if(jobs.length<=0){
            break;
          }      

          const json = JSON.stringify(jobs);      // แปลงเป็น string
          const chunk = encoder.encode(json + '\n'); // ใส่ newline คั่นแต่ละ batch
          controller.enqueue(chunk);
          await new Promise(resolve => setTimeout(resolve, 500)); // delay 1 วิ

        }
    
        controller.enqueue(encoder.encode('"A จบการส่งข้อมูล"\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      }
    });
  }


// export default async function handler() {

 
  
//   res.setHeader('Content-Type', 'text/plain; charset=utf-8');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Transfer-Encoding', 'chunked'); // สำคัญสำหรับ streaming




//   let count = 0;
//   const interval = setInterval(() => {
//     count++;
//     res.write(`ข้อความที่ ${count}\n`);

//     if (count >= 5) {
//       clearInterval(interval);
//       res.end('จบการส่งข้อมูลแล้ว\n');
//     }
//   }, 1000);
// }