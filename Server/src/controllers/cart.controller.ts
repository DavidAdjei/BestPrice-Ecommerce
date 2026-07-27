import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { productInclude, serializeProduct } from "../utils/serializeProduct.js";
import { requireParam } from "../utils/params.js";

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: productInclude } },
  });

  res.json({
    cart: items.map((item) => ({
      quantity: item.quantity,
      product: serializeProduct(item.product),
    })),
  });
});

export const addOrUpdateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const { productId, quantity } = req.body as { productId: string; quantity: number };

  if (!productId || quantity < 1) throw badRequest("productId and a positive quantity are required");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product");

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity },
    update: { quantity },
  });

  res.json({ message: "Cart updated", item });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const productId = requireParam(req.params.productId, "productId");
  await prisma.cartItem.delete({ where: { userId_productId: { userId, productId } } });
  res.json({ message: "Item removed from cart" });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  await prisma.cartItem.deleteMany({ where: { userId } });
  res.json({ message: "Cart cleared" });
});
