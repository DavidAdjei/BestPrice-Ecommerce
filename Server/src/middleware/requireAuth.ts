import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/jwt.js";
import { forbidden, unauthorized } from "../utils/AppError.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const payload = verifyAuthToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { accountStatus: true },
    });
    if (!user) {
      next(unauthorized("Invalid or expired session"));
      return;
    }
    if (user.accountStatus !== "ACTIVE") {
      next(forbidden("This account is no longer active"));
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    next(unauthorized("Invalid or expired session"));
  }
};

// Same check, but doesn't reject the request when there's no session —
// useful for routes that behave differently for guests vs logged-in
// users (e.g. product listing includes wishlist state only when a
// user is present).
export const attachUserIfPresent = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    next();
    return;
  }
  try {
    req.userId = verifyAuthToken(token).userId;
  } catch {
    // ignore invalid token, treat as guest
  }
  next();
};
