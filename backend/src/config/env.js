import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numberFromEnv(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/behavioural_biometrics",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:8080",
  authConfidenceThreshold: numberFromEnv(process.env.AUTH_CONFIDENCE_THRESHOLD, 60),
  promptMatchThreshold: numberFromEnv(process.env.PROMPT_MATCH_THRESHOLD, 65),
  tenSecondWpmToleranceRatio: numberFromEnv(process.env.TEN_SECOND_WPM_TOLERANCE_RATIO, 0.25),
  modelUncertaintyThreshold: numberFromEnv(process.env.MODEL_UNCERTAINTY_THRESHOLD, 18),
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  otpLength: numberFromEnv(process.env.OTP_LENGTH, 6),
  otpExpiresMinutes: numberFromEnv(process.env.OTP_EXPIRES_MINUTES, 10),
  otpMaxAttempts: numberFromEnv(process.env.OTP_MAX_ATTEMPTS, 5),
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: numberFromEnv(process.env.SMTP_PORT, 587),
  smtpSecure: String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpRequireConfigured:
    String(process.env.SMTP_REQUIRE_CONFIGURED ?? "false").toLowerCase() === "true",
 mlModelPath:
  process.env.ML_MODEL_PATH ??
  path.resolve(__dirname, "../data/keystroke-model.json"),
  profileEmailDomain: process.env.PROFILE_EMAIL_DOMAIN ?? "keystrokeid.local",
  defaultProfilePassword: process.env.DEFAULT_PROFILE_PASSWORD ?? "secure123",
  dslDatasetPath:
    process.env.DSL_DATASET_PATH ?? "C:/Users/Deepa/Downloads/DSL-StrongPasswordData.csv",
};
