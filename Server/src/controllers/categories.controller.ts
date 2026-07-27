import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ include: { filters: true } });

  const shaped = categories.map((category) => ({
    _id: category.id,
    title: category.title,
    keywords: category.keywords,
    filters: Object.fromEntries(
      category.filters.map((filter) => [
        filter.filterName,
        { filterName: filter.filterName, filterList: filter.options },
      ])
    ),
  }));

  res.json({ categories: shaped });
});
