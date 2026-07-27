import { z } from "zod";

export const createProductSchema = z.object({
  product: z.object({
    title: z.string().min(1, "Product title is required"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be greater than 0"),
    inStock: z.coerce.number().int().min(0).default(0),
    categoryId: z.string().optional(),
    Brand: z.string().optional(),
    ram: z.string().optional(),
    displaySize: z.coerce.number().optional(),
    eta: z.coerce.number().optional(),
    forWhom: z.string().optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    type: z.string().optional(),
    specs: z.array(z.string()).optional(),
    imgs: z.array(z.string()).optional(),
    popular: z.boolean().optional(),
  }),
});
