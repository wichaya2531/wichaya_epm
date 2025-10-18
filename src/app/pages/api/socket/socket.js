// /pages/api/socket.js
import { Server } from "socket.io";
import { connectToDb } from "@/app/api/mongo/index.js";
import { Job } from "@/lib/models/Job";
import { Schedule } from "@/lib/models/Schedule";

let ioInstance = null;
let watchersInitialized = false;

export default async function handler(req, res) {
  if (!res.socket.server.io) {
    await connectToDb();

    const io = new Server(res.socket.server, {
      path: "/api/socket/",
      addTrailingSlash: false,
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    res.socket.server.io = io;
    ioInstance = io;

    io.on("connection", (socket) => {
      // client ขอเข้าห้องตาม workgroup
      socket.on("join_group", ({ workgroup_id }) => {
        if (!workgroup_id) return;
        // ออกจากห้องเก่าทั้งหมดก่อน (ถ้าต้องการ)
        for (const room of socket.rooms) {
          if (room !== socket.id) socket.leave(room);
        }
        socket.join(`group:${workgroup_id}`);
        socket.emit("joined_group", { room: `group:${workgroup_id}` });
      });

      socket.on("leave_group", ({ workgroup_id }) => {
        if (!workgroup_id) return;
        socket.leave(`group:${workgroup_id}`);
      });
    });

    // เปิด Change Streams + broadcast ตาม WORKGROUP_ID → room group:<id>
    if (!watchersInitialized) {
      watchersInitialized = true;

      const commonOps = { $match: { operationType: { $in: ["insert","update","replace","delete"] } } };
      const opts = { fullDocument: "updateLookup" };

      const forward = (collection) => (chg) => {
        const doc = chg.fullDocument || {};
        const wg = doc.WORKGROUP_ID; // สำคัญ: field นี้ต้องอยู่ในเอกสาร
        if (!wg) return;
        const payload = {
          collection,
          op: chg.operationType,
          id: chg.documentKey?._id?.toString?.(),
          doc, // จะ map ฝั่ง client หรือ map ที่นี่ก็ได้
          ts: Date.now(),
        };
        io.to(`group:${wg}`).emit("group:update", payload);
      };

      try {
        const jobStream = Job.watch([commonOps], opts);
        jobStream.on("change", forward("Job"));
        jobStream.on("error", (e) => console.error("[jobStream error]", e));

        const scheduleStream = Schedule.watch([commonOps], opts);
        scheduleStream.on("change", forward("Schedule"));
        scheduleStream.on("error", (e) => console.error("[scheduleStream error]", e));
      } catch (e) {
        console.error("[ChangeStream init error]", e);
      }
    }
  }

  res.end(); // จบ bootstrap
}
