import { Router } from "express";
import { logClientError } from "../controllers/errorLog.controller.js";
import { attachUserIfPresent } from "../middleware/requireAuth.js";

const router = Router();
router.post("/", attachUserIfPresent, logClientError);

export default router;
