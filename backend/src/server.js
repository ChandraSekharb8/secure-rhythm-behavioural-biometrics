import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase, disconnectDatabase } from "./config/db.js";
import { ensureDefaultProfiles } from "./services/profileService.js";
import { ensureMlModelReady, getMlModelMeta } from "./services/mlModelService.js";

const start = async () => {
  try {
    await connectToDatabase();
    await ensureMlModelReady();
    await ensureDefaultProfiles();
    const modelMeta = await getMlModelMeta();
    console.log(
      `ML model loaded (${modelMeta.classCount} classes, ${modelMeta.sampleCount} samples) from ${modelMeta.modelPath}`,
    );
    const smtpConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
    if (!smtpConfigured) {
      console.warn(
        "[mail] SMTP is not configured. OTP emails will not be delivered. Configure SMTP_* in backend/.env.",
      );
      if (env.smtpRequireConfigured) {
        console.warn(
          "[mail] SMTP_REQUIRE_CONFIGURED=true, OTP requests will fail until SMTP is configured.",
        );
      } else {
        console.warn(
          "[mail] SMTP_REQUIRE_CONFIGURED=false, OTP codes are only printed to backend logs (dev mode).",
        );
      }
    }

    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  try {
    console.log(`${signal} received. Closing MongoDB connection...`);
    await disconnectDatabase();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

start();
