import { Router } from "express";
import { getAllOrders, postOrder, validateCoupon, verifyOrderPayment } from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { placeOrderSchema } from "../schemas/order.schema.js";

const router = Router();

router.get("/:userId", requireAuth, getAllOrders);
router.post("/:userId", requireAuth, validate(placeOrderSchema), postOrder);
router.put("/verify", verifyOrderPayment);
router.get("/coupons/validate", requireAuth, validateCoupon);

export default router;
