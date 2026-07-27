import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/AppError.js";
import { uploadImages } from "../utils/cloudinary.js";
import { productInclude, serializeProduct } from "../utils/serializeProduct.js";
import { requireParam } from "../utils/params.js";
import { sendOrderStatusEmail } from "../utils/mailer.js";

const assertIsSeller = async (sellerId: string) => {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== "SELLER") throw forbidden("Invalid user type");
  return seller;
};

export const addProduct = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = requireParam(req.params.sellerId, "sellerId");
  const { product } = req.body;

  await assertIsSeller(sellerId);

  const { imgs, ...productData } = product;

  const created = await prisma.product.create({
    data: {
      ...productData,
      sellerId,
      images: imgs?.length
        ? { create: imgs.map((url: string, position: number) => ({ url, position })) }
        : undefined,
    },
    include: productInclude,
  });

  res.status(201).json({ message: "Product added successfully", product: serializeProduct(created) });
});

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw badRequest("Add at least one image");

  const imageUrls = await uploadImages(files);
  res.status(200).json({ message: "Images uploaded successfully", imageUrls });
});

export const getSellerProducts = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = requireParam(req.params.sellerId, "sellerId");
  await assertIsSeller(sellerId);

  const products = await prisma.product.findMany({
    where: { sellerId },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json({ products: products.map(serializeProduct) });
});

export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = requireParam(req.params.sellerId, "sellerId");
  await assertIsSeller(sellerId);

  const orders = await prisma.order.findMany({
    where: { sellerId },
    include: { items: true, buyer: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { orderDate: "desc" },
  });

  res.json({ orders });
});

const nextStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = requireParam(req.params.orderId, "orderId");
  const { status } = req.body as { status: string };

  if (!nextStatuses.includes(status as (typeof nextStatuses)[number])) {
    throw badRequest("Invalid status value");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { buyer: true } });
  if (!order) throw notFound("Order");

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as (typeof nextStatuses)[number] },
  });

  // Previously a status change was silent — the buyer had no way to know
  // unless they happened to check the site. Now they get both an in-app
  // notification and an email.
  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: "Order update",
      content: `Your order #${order.id.slice(-8)} is now ${status.toLowerCase()}.`,
    },
  });
  try {
    await sendOrderStatusEmail(order.buyer.email, order.buyer.firstName, order.id, status);
  } catch (error) {
    console.error("Failed to send order status email:", error);
  }

  res.json({ message: "Order status updated", order: updated });
});

export const getSellerStats = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = requireParam(req.params.sellerId, "sellerId");
  await assertIsSeller(sellerId);

  const [orders, products] = await Promise.all([
    prisma.order.findMany({ where: { sellerId }, select: { totalPrice: true, orderDate: true, status: true } }),
    prisma.product.count({ where: { sellerId } }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  const totalOrders = orders.length;

  // Revenue for each of the last 14 days, oldest first — enough for a
  // simple trend chart without pulling in a heavier analytics setup.
  const days: { date: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dateKey = day.toISOString().slice(0, 10);
    const revenue = orders
      .filter((order) => order.orderDate.toISOString().slice(0, 10) === dateKey)
      .reduce((sum, order) => sum + Number(order.totalPrice), 0);
    days.push({ date: dateKey, revenue });
  }

  const lowStockProducts = await prisma.product.findMany({
    where: { sellerId, inStock: { lte: 5 } },
    select: { id: true, title: true, inStock: true },
    orderBy: { inStock: "asc" },
  });

  res.json({
    totalRevenue,
    totalOrders,
    totalProducts: products,
    revenueByDay: days,
    lowStockProducts,
  });
});
