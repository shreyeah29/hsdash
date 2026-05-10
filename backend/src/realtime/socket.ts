import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { verifyAuthToken } from "../services/jwt";

let io: Server | null = null;

export function getSocketIo(): Server | null {
  return io;
}

export function attachSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const raw =
        (socket.handshake.auth?.token as string | undefined) ??
        (typeof socket.handshake.headers.authorization === "string"
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "").trim()
          : "");
      if (!raw) return next(new Error("Unauthorized"));
      const decoded = verifyAuthToken(raw);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as Role;
    socket.join(`user:${userId}`);
    if (role === Role.ADMIN) socket.join("role:ADMIN");
    if (role === Role.COORDINATOR) socket.join("role:COORDINATOR");
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload?: unknown) {
  io?.to(`user:${userId}`).emit(event, payload ?? {});
}

export function emitTaskRefreshToOps() {
  io?.to("role:ADMIN").emit("task:updated");
  io?.to("role:COORDINATOR").emit("task:updated");
}

export function emitNotificationRefresh(userId: string) {
  emitToUser(userId, "notification:new");
}
