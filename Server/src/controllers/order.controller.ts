import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { initializeTransaction, verifyTransaction } from "../utils/paystack.js";
import { requireParam } from "../utils/params.js";
import { convertToGHS } from "../utils/fx.js";

export const postOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const { items, couponCode } = req.body as {
    items: { productId: string; quantity: number }[];
    couponCode?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { address: true } });
  if (!user) throw notFound("User");
  if (!user.address) throw badRequest("Add a delivery address before checking out");

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  // Re-price every line item from the database rather than trusting
  // whatever price the client sent, and convert each to GHS at the point
  // of sale — Paystack only ever charges GHS here, so a product listed
  // in USD/IDR/etc. needs converting before it's summed with anything
  // else in the cart (previously this just summed the raw numbers).
  const bySeller = new Map<
    string,
    { productId: string; title: string; priceGHS: number; quantity: number; specifications: string[]; images: string[] }[]
  >();

  for (const { productId, quantity } of items) {
    const product = productById.get(productId);
    if (!product) throw notFound(`Product ${productId}`);
    if (quantity > product.inStock) {
      throw badRequest(`Only ${product.inStock} of "${product.title}" left in stock`);
    }

    const priceGHS = convertToGHS(Number(product.price), product.currency);

    const existing = bySeller.get(product.sellerId) ?? [];
    existing.push({
      productId: product.id,
      title: product.title,
      priceGHS,
      quantity,
      specifications: Array.isArray(product.specs) ? (product.specs as string[]) : [],
      images: product.images.map((img) => img.url),
    });
    bySeller.set(product.sellerId, existing);
  }

  let coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>> | null = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    if (
      !coupon ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      (coupon.maxRedemptions !== null && coupon.timesRedeemed >= (coupon.maxRedemptions ?? 0))
    ) {
      throw badRequest("This coupon code is invalid or has expired");
    }
  }

  const deliveryAddress = `City = ${user.address.city}, Street = ${user.address.street}, House Number = ${user.address.houseNumber}, Region = ${user.address.region}, GPS = ${user.address.ghanaPost}`;
  const reference = `order_${nanoid(12)}`;

  let totalAmount = 0;
  let totalDiscount = 0;
  const sellerEntries = Array.from(bySeller.entries());

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = [];
    for (const [sellerId, orderItems] of sellerEntries) {
      let sellerTotal = orderItems.reduce((sum, item) => sum + item.priceGHS * item.quantity, 0);
      let sellerDiscount = 0;

      if (coupon) {
        // A coupon applies proportionally across each seller's slice of
        // a multi-seller cart, rather than only discounting one order.
        sellerDiscount = coupon.percentOff
          ? sellerTotal * (coupon.percentOff / 100)
          : Number(coupon.amountOff ?? 0) * (sellerTotal / (totalAmount || sellerTotal || 1));
        sellerDiscount = Math.min(sellerDiscount, sellerTotal);
        sellerTotal -= sellerDiscount;
      }

      totalAmount += sellerTotal;
      totalDiscount += sellerDiscount;

      const order = await tx.order.create({
        data: {
          buyerId: userId,
          sellerId,
          totalPrice: sellerTotal,
          deliveryAddress,
          paymentReference: reference,
          couponCode: coupon?.code,
          discountAmount: sellerDiscount || undefined,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.priceGHS,
              quantity: item.quantity,
              specifications: item.specifications,
              images: item.images,
            })),
          },
        },
      });
      orders.push(order);
    }

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { timesRedeemed: { increment: 1 } } });
    }

    return orders;
  });

  if (createdOrders.length === 0) throw badRequest("No valid items to order");

  const { authorization_url } = await initializeTransaction(user.email, Math.round(totalAmount * 100), reference);

  res.status(200).json({ paymentUrl: authorization_url, discountApplied: totalDiscount });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const code = (req.query.code as string | undefined)?.trim().toUpperCase();
  if (!code) throw badRequest("Coupon code is required");

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (
    !coupon ||
    !coupon.active ||
    (coupon.expiresAt && coupon.expiresAt < new Date()) ||
    (coupon.maxRedemptions !== null && coupon.timesRedeemed >= (coupon.maxRedemptions ?? 0))
  ) {
    throw badRequest("This coupon code is invalid or has expired");
  }

  res.json({
    code: coupon.code,
    percentOff: coupon.percentOff,
    amountOff: coupon.amountOff ? Number(coupon.amountOff) : null,
  });
});

export const verifyOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  const reference = req.query.reference as string;
  if (!reference) throw badRequest("Missing payment reference");

  const data = await verifyTransaction(reference);

  if (data.status !== "success") {
    throw badRequest("Transaction verification failed or payment was not successful");
  }

  const { customer, authorization } = data;

  await prisma.order.updateMany({
    where: { paymentReference: reference },
    data: { payment: "PAID" },
  });

  const user = await prisma.user.findUnique({ where: { email: customer.email } });
  if (!user) throw notFound("User");

  await prisma.user.update({
    where: { id: user.id },
    data: { paystackSecret: authorization.authorization_code },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "Payment Received",
      content: `Hello ${user.firstName}, your payment was successful. Thank you for purchasing from us`,
    },
  });

  res.status(200).json({ message: "Payment received and orders updated" });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: { items: true },
    orderBy: { orderDate: "desc" },
  });
  res.json({ orders });
});
