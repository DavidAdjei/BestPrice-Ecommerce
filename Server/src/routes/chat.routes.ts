import { Router } from "express";
import type { Server } from "socket.io";
import {
  createRoom,
  getMessages,
  getUserRooms,
  markAsSeen,
  markRoomRead,
  sendMessage,
  softDeleteMessage,
  uploadImages,
} from "../controllers/chat.controller.js";
import { upload } from "../utils/multer.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const chatRoutes = (io: Server) => {
  const router = Router();

  router.post("/join-room", requireAuth, createRoom);
  router.get("/messages/:roomId", requireAuth, getMessages);
  router.post("/sendMessage", requireAuth, (req, res) => sendMessage(req, res, io));
  router.get("/chatList/:userId", requireAuth, getUserRooms);
  router.post("/uploadImages", requireAuth, upload.array("images"), uploadImages);
  router.post("/markSeen", requireAuth, markAsSeen);
  router.post("/softDelete", requireAuth, softDeleteMessage);
  router.post("/markRoomRead", requireAuth, markRoomRead);

  return router;
};
