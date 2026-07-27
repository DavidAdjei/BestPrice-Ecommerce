import { Router } from "express";
import {
  listProducts,
  getProduct,
  listFeaturedProducts,
  listProductsByIds,
  addProductReview,
} from "../controllers/products.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Must come before "/:id" for the same reason as seller.routes.ts —
// otherwise these get swallowed by GET /products/:id.
router.get("/featured", listFeaturedProducts);
router.get("/by-ids", listProductsByIds);
router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/:id/reviews", requireAuth, addProductReview);

export default router;
