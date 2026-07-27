import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";

const onlineUsers = new Map<string, string>();

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("joinRoom", ({ roomId }: { userId: string; roomId: string }) => {
      socket.join(roomId);
      socket.emit("joined room", { roomId, message: "You have joined the room successfully." });
    });

    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on("userOnline", async ({ userId }: { userId: string }) => {
      onlineUsers.set(userId, socket.id);
      try {
        await prisma.user.update({ where: { id: userId }, data: { online: true } });
        socket.broadcast.emit("onlineStatus", { userId, online: true });
      } catch (error) {
        console.error("Error updating user online status:", error);
      }
    });

    socket.on("typing", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit("userTyping", { userId });
    });

    socket.on("stoppedTyping", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit("userStoppedTyping", { userId });
    });

    socket.on("messageSeen", async ({ roomId, messageIds, userId }: { roomId: string; messageIds: string[]; userId: string }) => {
      try {
        if (!roomId || !Array.isArray(messageIds) || !userId) {
          socket.emit("error", { message: "Invalid input for messageSeen" });
          return;
        }

        const messages = await prisma.message.findMany({ where: { id: { in: messageIds }, roomId } });
        await Promise.all(
          messages.map((message) => {
            const seenBy = new Set<string>(Array.isArray(message.seenBy) ? (message.seenBy as string[]) : []);
            seenBy.add(userId);
            return prisma.message.update({ where: { id: message.id }, data: { seenBy: Array.from(seenBy) } });
          })
        );

        socket.to(roomId).emit("updateSeenStatus", { messageIds, userId });
        socket.emit("messageSeenAcknowledged", { messageIds });
      } catch (error) {
        console.error("Error handling messageSeen event:", error);
        socket.emit("error", { message: "Failed to update seen status" });
      }
    });

    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(([, socketId]) => socketId === socket.id)?.[0];
      if (!userId) return;

      onlineUsers.delete(userId);
      try {
        await prisma.user.update({ where: { id: userId }, data: { online: false, lastSeen: new Date() } });
        socket.broadcast.emit("onlineStatus", { userId, online: false });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    });
  });
};
