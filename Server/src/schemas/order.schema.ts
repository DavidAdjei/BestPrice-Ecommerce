import { z } from "zod";

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1, "Cart is empty"),
  couponCode: z.string().optional(),
});
