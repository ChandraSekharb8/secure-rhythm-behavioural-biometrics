import { Router } from "express";
import {
  sessionListHandler,
  sessionSummaryHandler,
} from "../controllers/sessionController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(sessionListHandler));
router.get("/summary", requireAuth, asyncHandler(sessionSummaryHandler));

export default router;
