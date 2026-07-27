import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { forbidden } from "../utils/AppError.js";

export const requireAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
  if (!user || user.role !== "ADMIN") {
    next(forbidden("Admin access required"));
    return;
  }
  next();
};
