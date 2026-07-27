import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const logClientError = asyncHandler(async (req: Request, res: Response) => {
  const { message, stack, url } = req.body as { message: string; stack?: string; url?: string };
  if (!message) {
    res.status(204).end();
    return;
  }

  await prisma.errorLog.create({
    data: { message: message.slice(0, 2000), stack: stack?.slice(0, 5000), url, userId: req.userId },
  });

  res.status(204).end();
});
