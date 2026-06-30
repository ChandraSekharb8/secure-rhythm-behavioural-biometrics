import { getDslAnalysis, reloadDslAnalysis } from "../services/dslAnalysisService.js";
import {
  getMlModelMeta,
  getMlModelReport,
  trainMlModelFromDslDataset,
} from "../services/mlModelService.js";

export const dslAnalysisHandler = async (req, res) => {
  const top = Number(req.query.top);
  const data = await getDslAnalysis({ top });
  res.json(data);
};

export const reloadDslAnalysisHandler = async (req, res) => {
  const meta = await reloadDslAnalysis();
  res.json({ message: "DSL analysis cache reloaded", meta });
};

export const mlModelMetaHandler = async (req, res) => {
  const meta = await getMlModelMeta();
  res.json(meta);
};

export const mlModelRetrainHandler = async (req, res) => {
  const result = await trainMlModelFromDslDataset();
  res.json({
    message: "ML model retrained from DSL dataset and saved",
    ...result,
  });
};

export const mlModelReportHandler = async (req, res) => {
  const report = await getMlModelReport();
  res.json(report);
};
