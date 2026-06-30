import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const buildTransport = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const mailTransport = buildTransport();

export const sendOtpMail = async ({ to, name, otp, expiresMinutes }) => {
  if (!mailTransport) {
    if (env.smtpRequireConfigured) {
      throw new HttpError(500, "Email service is not configured");
    }

    console.log(
      `[OTP-DEV] Email transport is not configured. OTP for ${to}: ${otp} (valid ${expiresMinutes} min)`,
    );
    return { delivered: false };
  }

  await mailTransport.sendMail({
    from: env.smtpUser,
    to,
    subject: "KeystrokeID OTP Verification",
    text: [
      `Hello ${name || "User"},`,
      "",
      `Your OTP is: ${otp}`,
      `This code is valid for ${expiresMinutes} minutes.`,
      "",
      "If this was not you, please Check your SYSTEM.",
    ].join("\n"),
  });

  return { delivered: true };
};
