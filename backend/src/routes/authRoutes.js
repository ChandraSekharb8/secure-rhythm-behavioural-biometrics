import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  meHandler,
  identifyHandler,
  fallbackHandler,
  verifyOtpHandler,
} from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", asyncHandler(signupHandler));
router.post("/login", asyncHandler(loginHandler));
router.get("/me", requireAuth, asyncHandler(meHandler));
router.post("/identify", optionalAuth, asyncHandler(identifyHandler));
router.post("/fallback", optionalAuth, asyncHandler(fallbackHandler));
router.post("/verify-otp", optionalAuth, asyncHandler(verifyOtpHandler));

export default router;
