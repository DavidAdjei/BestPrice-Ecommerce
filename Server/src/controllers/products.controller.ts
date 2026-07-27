import type { Request, Response } from "express";
import type { Prisma } from "../generated/client.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { productInclude, serializeProduct } from "../utils/serializeProduct.js";
import { requireParam } from "../utils/params.js";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

const sortToOrderBy = (sort: SortOption | undefined): Prisma.ProductOrderByWithRelationInput => {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "rating":
      return { rating: "desc" };
    default:
      return { createdAt: "desc" };
  }
};

// Previously the client fetched every product and paginated/filtered in
// the browser — fine for a couple hundred rows, not fine once the
// catalog grows (as it just did, from ~750 imported products). This
// does the filtering, sorting and paging in the database instead.
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const sort = req.query.sort as SortOption | undefined;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const inStockOnly = req.query.inStockOnly === "true";

  let attributeFilters: Record<string, Record<string, boolean>> = {};
  if (typeof req.query.filters === "string" && req.query.filters) {
    try {
      attributeFilters = JSON.parse(req.query.filters);
    } catch {
      // ignore malformed filters rather than failing the whole request
    }
  }

  const where: Prisma.ProductWhereInput = {};

  if (q) {
    // `contains` rather than the fulltext index this table also has —
    // MySQL's natural-language fulltext search applies relevance
    // thresholds that behave unpredictably on a catalog this size
    // (short/common search terms can return zero results). Plain
    // `contains` is slower at large scale but predictable, which matters
    // more for a shop search box.
    where.title = { contains: q };
  }

  if (category) {
    where.category = { title: category };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (inStockOnly) {
    where.inStock = { gt: 0 };
  }

  const attributeConditions: Prisma.ProductWhereInput[] = [];
  for (const [key, options] of Object.entries(attributeFilters)) {
    for (const [value, checked] of Object.entries(options)) {
      if (checked) attributeConditions.push({ [key]: value } as Prisma.ProductWhereInput);
    }
  }
  if (attributeConditions.length > 0) {
    where.OR = attributeConditions;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: sortToOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map(serializeProduct),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  if (!id) throw badRequest("Not allowed");

  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw notFound("Product");

  res.json({ message: "Successful", product: serializeProduct(product) });
});

export const listFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { popular: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  res.json({ products: products.map(serializeProduct) });
});

export const listProductsByIds = asyncHandler(async (req: Request, res: Response) => {
  const idsParam = typeof req.query.ids === "string" ? req.query.ids : "";
  const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 24);
  if (ids.length === 0) {
    res.json({ products: [] });
    return;
  }

  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude });
  // Preserve the caller's order (e.g. most-recently-viewed first) rather
  // than whatever order the database happens to return.
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = ids.map((id) => byId.get(id)).filter((product): product is NonNullable<typeof product> => !!product);

  res.json({ products: ordered.map(serializeProduct) });
});

export const addProductReview = asyncHandler(async (req: Request, res: Response) => {
  const productId = requireParam(req.params.id, "id");
  const { userId, title, content, rating } = req.body as {
    userId: string;
    title: string;
    content: string;
    rating: number;
  };

  if (!userId || !content || !rating) throw badRequest("userId, content and rating are required");

  const [product, user, purchase] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.orderItem.findFirst({
      where: { productId, order: { buyerId: userId, status: "DELIVERED" } },
    }),
  ]);

  if (!product) throw notFound("Product");
  if (!user) throw notFound("User");
  if (!purchase) {
    throw badRequest("You can only review products from a delivered order");
  }

  const review = await prisma.review.create({
    data: {
      productId,
      reviewerId: userId,
      reviewerName: `${user.firstName} ${user.lastName}`,
      title: title || "Review",
      content,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
    },
  });

  // Keep the product's aggregate rating roughly in sync.
  const allRatings = await prisma.review.findMany({ where: { productId }, select: { rating: true } });
  const average = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  await prisma.product.update({ where: { id: productId }, data: { rating: average } });

  res.status(201).json({ message: "Review submitted", review });
});
