import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { ACCESS_TOKEN_KEY } from "@/services/api";
import { useAuthStore } from "@/store/auth";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function RealtimeSync() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;

    let socket: Socket | null = io(apiBase, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 12,
    });

    const bumpAssignments = () => {
      bumpTasks();
      bumpNotifications();
    };

    const bumpTasks = () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["my-tasks"] });
      void qc.invalidateQueries({ queryKey: ["tasks", "admin-monitor"] });
      void qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
    };

    const bumpAllProduction = () => {
      bumpTasks();
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
      void qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
    };

    const bumpNotifications = () => {
      void qc.invalidateQueries({ queryKey: ["my-notifications"] });
    };

    const bumpAttendance = () => {
      void qc.invalidateQueries({ queryKey: ["work-shift-today"] });
    };

    socket.on("task:updated", bumpAllProduction);
    socket.on("production:cleared", bumpAllProduction);
    socket.on("assignment:updated", bumpAssignments);
    socket.on("notification:new", bumpNotifications);
    socket.on("attendance:updated", bumpAttendance);

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [qc, user?.id]);

  return <Outlet />;
}
