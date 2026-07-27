import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { requireParam } from "../utils/params.js";
import { toPublicUser } from "../utils/serialize.js";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role: role.toUpperCase() as "BUYER" | "SELLER" | "ADMIN" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ users: users.map(toPublicUser) });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const { accountStatus } = req.body as { accountStatus: string };

  if (!["ACTIVE", "SUSPENDED", "DELETED"].includes(accountStatus)) {
    throw badRequest("Invalid account status");
  }

  const user = await prisma.user.update({
    where: { id },
    data: { accountStatus: accountStatus as "ACTIVE" | "SUSPENDED" | "DELETED" },
  });
  if (!user) throw notFound("User");

  res.json({ message: "Account status updated", user: toPublicUser(user) });
});

export const listAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      buyer: { select: { firstName: true, lastName: true, email: true } },
      seller: { select: { firstName: true, lastName: true, email: true } },
      items: true,
    },
    orderBy: { orderDate: "desc" },
    take: 200,
  });
  res.json({ orders });
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [userCount, productCount, orderCount, orders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({ select: { totalPrice: true } }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

  res.json({ userCount, productCount, orderCount, totalRevenue });
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ coupons });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, percentOff, amountOff, maxRedemptions, expiresAt } = req.body as {
    code: string;
    percentOff?: number;
    amountOff?: number;
    maxRedemptions?: number;
    expiresAt?: string;
  };

  if (!code || (!percentOff && !amountOff)) {
    throw badRequest("A code and either percentOff or amountOff are required");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      percentOff,
      amountOff,
      maxRedemptions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  });

  res.status(201).json({ message: "Coupon created", coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  await prisma.coupon.delete({ where: { id } });
  res.json({ message: "Coupon deleted" });
});
