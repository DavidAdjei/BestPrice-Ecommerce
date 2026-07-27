import { Router } from "express";
import { addOrUpdateCartItem, clearCart, getCart, removeCartItem } from "../controllers/cart.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/:userId", requireAuth, getCart);
router.post("/:userId", requireAuth, addOrUpdateCartItem);
router.delete("/:userId/:productId", requireAuth, removeCartItem);
router.delete("/:userId", requireAuth, clearCart);

export default router;
