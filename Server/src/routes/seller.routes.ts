import { Router } from "express";
import {
  addProduct,
  getSellerProducts,
  getSellerOrders,
  getSellerStats,
  updateOrderStatus,
  uploadProductImages,
} from "../controllers/seller.controller.js";
import { upload } from "../utils/multer.js";
import { validate } from "../middleware/validate.js";
import { createProductSchema } from "../schemas/product.schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// This must be registered before "/:sellerId" — Express matches routes in
// registration order, and "/:sellerId" matches any single path segment
// (including literally "upload-images"), so with the old ordering a
// POST to /seller/upload-images was being swallowed by the
// POST /seller/:sellerId handler instead, silently breaking image
// uploads for new products.
router.post("/upload-images", requireAuth, upload.array("image"), uploadProductImages);

router.get("/:sellerId", requireAuth, getSellerProducts);
router.post("/:sellerId", requireAuth, validate(createProductSchema), addProduct);

// The seller side of the old app had no way to see orders placed
// against its products at all — buyers could check out, but sellers
// had no matching view. Adding it here rather than leaving it missing.
router.get("/:sellerId/orders", requireAuth, getSellerOrders);
router.put("/orders/:orderId/status", requireAuth, updateOrderStatus);
router.get("/:sellerId/stats", requireAuth, getSellerStats);

export default router;
