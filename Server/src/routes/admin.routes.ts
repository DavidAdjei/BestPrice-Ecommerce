import { Router } from "express";
import {
  listUsers,
  updateUserStatus,
  listAllOrders,
  getPlatformStats,
  listCoupons,
  createCoupon,
  deleteCoupon,
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/stats", getPlatformStats);
router.get("/users", listUsers);
router.put("/users/:id/status", updateUserStatus);
router.get("/orders", listAllOrders);
router.get("/coupons", listCoupons);
router.post("/coupons", createCoupon);
router.delete("/coupons/:id", deleteCoupon);

export default router;
