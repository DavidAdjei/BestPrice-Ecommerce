import { Router } from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlist.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/:userId/:productId", requireAuth, addToWishlist);
router.delete("/:userId/:productId", requireAuth, removeFromWishlist);
router.get("/:userId", requireAuth, getWishlist);

export default router;
