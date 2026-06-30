import { z } from "zod";

const timingArray = z
  .array(z.number().finite().min(0).max(20000))
  .max(500, "Too many timing values");

export const identifySchema = z.object({
  typedText: z.string().max(5000).optional().default(""),
  promptText: z.string().max(5000).optional().default(""),
  dwellTimes: timingArray.min(5, "At least 5 dwell timings are required"),
  flightTimes: timingArray.optional().default([]),
  keyCount: z.number().int().min(0).max(50000).optional().default(0),
  backspaceCount: z.number().int().min(0).max(50000).optional().default(0),
});

export const fallbackSchema = z.object({
  password: z.string().min(1, "Password is required").max(128),
  detectedUser: z.string().trim().min(2).max(120).optional(),
  sessionId: z.string().trim().length(24).optional(),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().trim().length(24, "OTP challenge id is required"),
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "OTP must be numeric"),
  sessionId: z.string().trim().length(24).optional(),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().min(2, "Email or username is required").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(2, "Email or username is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
});
