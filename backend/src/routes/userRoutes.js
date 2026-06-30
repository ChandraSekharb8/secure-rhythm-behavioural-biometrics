import { Router } from "express";
import { profileCreateHandler, profileListHandler } from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/profiles", asyncHandler(profileListHandler));
router.post("/profiles", requireAuth, asyncHandler(profileCreateHandler));

export default router;
