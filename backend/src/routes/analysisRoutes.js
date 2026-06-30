import { Router } from "express";
import {
  dslAnalysisHandler,
  reloadDslAnalysisHandler,
  mlModelMetaHandler,
  mlModelRetrainHandler,
  mlModelReportHandler,
} from "../controllers/analysisController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/dsl", asyncHandler(dslAnalysisHandler));
router.post("/dsl/reload", requireAuth, asyncHandler(reloadDslAnalysisHandler));
router.get("/model/meta", asyncHandler(mlModelMetaHandler));
router.get("/model/report", asyncHandler(mlModelReportHandler));
router.post("/model/retrain", requireAuth, asyncHandler(mlModelRetrainHandler));

export default router;
