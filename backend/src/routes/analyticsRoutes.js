import { Router } from "express";
import { chartDataHandler } from "../controllers/analyticsController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/charts", asyncHandler(chartDataHandler));

export default router;

