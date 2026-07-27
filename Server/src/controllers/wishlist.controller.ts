import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { conflict, notFound } from "../utils/AppError.js";
import { productInclude, serializeProduct } from "../utils/serializeProduct.js";
import { requireParam } from "../utils/params.js";

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const productId = requireParam(req.params.productId, "productId");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product");

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw conflict("Already in wishlist");

  await prisma.wishlistItem.create({ data: { userId, productId } });
  res.json({ message: `${product.title} has been added to wishlist` });
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const productId = requireParam(req.params.productId, "productId");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product");

  await prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
  res.json({ message: `${product.title} has been removed from wishlist` });
});

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: productInclude } },
  });

  res.json({ wishlist: items.map((item) => serializeProduct(item.product)) });
});
