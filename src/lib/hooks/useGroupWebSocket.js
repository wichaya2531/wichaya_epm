// src/lib/hooks/useGroupWebSocket.js
"use client";
import { useEffect, useRef } from "react";
import { io as ioClient } from "socket.io-client";

export default function useGroupWebSocket(workgroupId, { onUpdate } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!workgroupId) return;

    // bootstrap server (จำเป็นสำหรับ Next)
    fetch("/api/socket/");

    const socket = ioClient("/", {
      path: "/api/socket/",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_group", { workgroup_id: workgroupId });
    });

    socket.on("joined_group", (data) => {
      // console.log("Joined", data.room);
    });

    socket.on("group:update", (payload) => {
      // payload: { collection, op, id, doc, ts }
      onUpdate?.(payload);
    });

    socket.on("connect_error", (e) => {
      console.warn("[socket connect_error]", e?.message);
    });

    return () => {
      try {
        socket.emit("leave_group", { workgroup_id: workgroupId });
        socket.disconnect();
      } catch {}
    };
  }, [workgroupId]);
}
