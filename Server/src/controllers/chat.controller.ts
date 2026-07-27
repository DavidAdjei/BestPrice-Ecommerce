import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { uploadImages as uploadToCloudinary } from "../utils/cloudinary.js";
import { requireParam } from "../utils/params.js";

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId, sellerId, productId } = req.body as {
    buyerId: string;
    sellerId: string;
    productId?: string;
  };
  if (!buyerId || !sellerId) throw badRequest("buyerId and sellerId are required");

  let room = await prisma.room.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: buyerId } } },
        { participants: { some: { userId: sellerId } } },
      ],
    },
  });

  if (!room) {
    room = await prisma.room.create({
      data: {
        participants: {
          create: [{ userId: buyerId }, { userId: sellerId }],
        },
      },
    });
  }

  if (productId) {
    await ensureProductReference(room.id, buyerId, productId);
  }

  res.json({ roomId: room.id });
});

// Drops a PRODUCT-type message into the room so both sides immediately
// have context for what they're chatting about — but only if this exact
// product isn't already the most recent thing referenced there, so
// clicking "chat with seller" on the same product repeatedly doesn't
// spam the thread with duplicate reference cards.
const ensureProductReference = async (roomId: string, senderId: string, productId: string) => {
  const lastReference = await prisma.message.findFirst({
    where: { roomId, messageType: "PRODUCT" },
    orderBy: { createdAt: "desc" },
  });

  const lastProductId = (lastReference?.productSnapshot as { id?: string } | null)?.id;
  if (lastReference && lastProductId === productId) return;

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!product) return;

  const savedMessage = await prisma.message.create({
    data: {
      roomId,
      senderId,
      messageType: "PRODUCT",
      productSnapshot: {
        id: product.id,
        title: product.title,
        image: product.images[0]?.url ?? null,
        price: Number(product.price),
        currency: product.currency,
      },
    },
  });

  await prisma.roomParticipant.updateMany({
    where: { roomId, userId: { not: senderId } },
    data: { unreadCount: { increment: 1 } },
  });
  await prisma.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

  return savedMessage;
};

export const getUserRooms = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");

  const memberships = await prisma.roomParticipant.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, imageUrl: true, online: true, lastSeen: true },
              },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { room: { updatedAt: "desc" } },
  });

  const contacts = memberships
    .map((membership) => {
      const otherParticipant = membership.room.participants[0];
      if (!otherParticipant) return null;
      const lastMessage = membership.room.messages[0];
      return {
        id: otherParticipant.user.id,
        roomId: membership.roomId,
        name: `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`,
        image: otherParticipant.user.imageUrl,
        online: otherParticipant.user.online,
        lastSeen: otherParticipant.user.lastSeen,
        unreadCount: membership.unreadCount,
        lastMessage: lastMessage
          ? {
              preview:
                lastMessage.messageType === "PRODUCT"
                  ? `Sent a product: ${(lastMessage.productSnapshot as { title?: string } | null)?.title ?? "product"}`
                  : lastMessage.messageType === "IMAGE"
                    ? "Sent an image"
                    : (lastMessage.message ?? ""),
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === userId,
            }
          : null,
      };
    })
    .filter((contact): contact is NonNullable<typeof contact> => contact !== null);

  res.json({ contacts });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const roomId = requireParam(req.params.roomId, "roomId");
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });
  res.json({ messages });
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw badRequest("No files uploaded");

  const imageUrls = await uploadToCloudinary(files);
  res.status(200).json({ message: "Images uploaded successfully", imageUrls });
});

export const sendMessage = async (req: Request, res: Response, io: Server) => {
  try {
    const { roomId, userId, message, messageType } = req.body;
    if (!roomId || !userId || !message) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (messageType === "image" && (!message.images || message.images.length === 0)) {
      res.status(400).json({ error: "Missing image URLs" });
      return;
    }

    const savedMessage = await prisma.message.create({
      data: {
        roomId,
        senderId: userId,
        message: messageType === "image" ? undefined : message.message,
        messageType: messageType === "image" ? "IMAGE" : "TEXT",
        attachmentUrls: messageType === "image" ? message.images : undefined,
        imageCaption: messageType === "image" ? message.caption : undefined,
      },
    });

    // Bump unread count for every other participant in the room.
    await prisma.roomParticipant.updateMany({
      where: { roomId, userId: { not: userId } },
      data: { unreadCount: { increment: 1 } },
    });
    await prisma.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

    res.status(200).json({ savedMessage });
    io.to(roomId).emit("chatMessage", savedMessage);
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Something went wrong";
    res.status(500).json({ error: messageText });
  }
};

export const markAsSeen = asyncHandler(async (req: Request, res: Response) => {
  const { messageId, userId } = req.body as { messageId: string; userId: string };

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw notFound("Message");

  const seenBy = new Set<string>(Array.isArray(message.seenBy) ? (message.seenBy as string[]) : []);
  seenBy.add(userId);

  await prisma.message.update({ where: { id: messageId }, data: { seenBy: Array.from(seenBy) } });
  res.json({ message: "Message marked as seen" });
});

export const softDeleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId, userId } = req.body as { messageId: string; userId: string };

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw notFound("Message");

  const deletedFor = new Set<string>(Array.isArray(message.deletedFor) ? (message.deletedFor as string[]) : []);
  deletedFor.add(userId);

  await prisma.message.update({ where: { id: messageId }, data: { deletedFor: Array.from(deletedFor) } });
  res.json({ message: "Message soft-deleted" });
});

export const markRoomRead = asyncHandler(async (req: Request, res: Response) => {
  const { roomId, userId } = req.body as { roomId: string; userId: string };

  await prisma.roomParticipant.update({
    where: { roomId_userId: { roomId, userId } },
    data: { unreadCount: 0 },
  });

  res.json({ message: "Room marked as read" });
});
