import { Router } from "express";
import {
  signUp,
  signin,
  isAuth,
  logout,
  loginWithGoogle,
  editImage,
  editUser,
  addAddress,
  getNotifications,
  getBanks,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { addressSchema, editUserSchema, signInSchema, signUpSchema } from "../schemas/auth.schema.js";
import { upload } from "../utils/multer.js";
import { authRateLimiter, loginRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/signUp", authRateLimiter, validate(signUpSchema), signUp);
router.post("/login", loginRateLimiter, validate(signInSchema), signin);
router.put("/:id", validate(editUserSchema), editUser);
router.put("/addAddress/:id", validate(addressSchema), addAddress);
router.put("/uploadImage/:id", upload.single("image"), editImage);
router.get("/isAuth", requireAuth, isAuth);
router.get("/banks", getBanks);
router.get("/notifications/:userId", requireAuth, getNotifications);
router.get("/google/callback", loginWithGoogle);
router.post("/logout", logout);

router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authRateLimiter, resendVerificationEmail);
router.post("/request-password-reset", authRateLimiter, requestPasswordReset);
router.post("/reset-password", authRateLimiter, resetPassword);

export default router;
