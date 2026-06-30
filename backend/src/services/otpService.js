import crypto from "crypto";
import { env } from "../config/env.js";
import OtpChallenge from "../models/OtpChallenge.js";
import UserProfile from "../models/UserProfile.js";
import { HttpError } from "../utils/httpError.js";
import { sendOtpMail } from "./mailService.js";
import { isEmailAddress } from "../utils/email.js";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hashOtp = (otpCode) => crypto.createHash("sha256").update(otpCode).digest("hex");

const generateOtpCode = () => {
  const length = Math.max(4, Math.min(8, Math.round(env.otpLength)));
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "your registered email";
  const [name, domain] = email.split("@");
  const safeName =
    name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}${"*".repeat(name.length - 2)}`;
  return `${safeName}@${domain}`;
};

export const createAndSendOtpChallenge = async ({
  profileId,
  username = null,
  sessionId = null,
  purpose,
  actorUserId = null,
}) => {
  if (!profileId && !username) {
    throw new HttpError(400, "Profile id or username is required for OTP");
  }

  let profile = null;
  if (profileId) {
    profile = await UserProfile.findById(profileId).lean();
  } else if (username) {
    profile = await UserProfile.findOne({
      name: { $regex: `^${escapeRegExp(String(username).trim())}$`, $options: "i" },
      active: true,
    }).lean();
  }

  if (!profile || !profile.active) {
    throw new HttpError(404, "User profile not found for OTP verification");
  }

  const destinationEmail = String(profile.email ?? "").trim().toLowerCase();
  if (!isEmailAddress(destinationEmail)) {
    throw new HttpError(
      400,
      "Selected username does not have a valid email configured in DB for OTP",
    );
  }

  // Reuse an active challenge to avoid issuing multiple OTP codes for repeated requests.
  const existingChallengeFilter = {
    createdBy: actorUserId ?? null,
    profileId: profile._id,
    purpose,
    verifiedAt: null,
    expiresAt: { $gt: new Date() },
  };

  // Password-only flow can create a fresh session on each click; reuse active OTP across sessions.
  if (purpose === "typing-auth") {
    existingChallengeFilter.sessionId = sessionId ?? null;
  }

  const existingChallenge = await OtpChallenge.findOne(existingChallengeFilter)
    .sort({ createdAt: -1 })
    .lean();

  if (existingChallenge) {
    return {
      challengeId: existingChallenge._id.toString(),
      destination: maskEmail(destinationEmail),
      expiresAt: existingChallenge.expiresAt,
      reused: true,
    };
  }

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);

  const challenge = await OtpChallenge.create({
    createdBy: actorUserId ?? null,
    profileId: profile._id,
    sessionId,
    purpose,
    codeHash: hashOtp(otpCode),
    attempts: 0,
    maxAttempts: env.otpMaxAttempts,
    expiresAt,
  });

  await sendOtpMail({
    to: destinationEmail,
    name: profile.name,
    otp: otpCode,
    expiresMinutes: env.otpExpiresMinutes,
  });

  return {
    challengeId: challenge._id.toString(),
    destination: maskEmail(destinationEmail),
    expiresAt,
  };
};

export const verifyOtpChallenge = async ({ challengeId, otpCode, actorUserId = null }) => {
  const challenge = await OtpChallenge.findById(challengeId);
  if (!challenge) {
    throw new HttpError(404, "OTP challenge not found");
  }

  if (
    actorUserId &&
    challenge.createdBy &&
    challenge.createdBy.toString() !== actorUserId.toString()
  ) {
    throw new HttpError(403, "You do not have access to this OTP challenge");
  }

  if (challenge.verifiedAt) {
    throw new HttpError(400, "OTP already verified");
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "OTP expired");
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new HttpError(400, "OTP attempts exceeded");
  }

  const expectedHash = challenge.codeHash;
  const actualHash = hashOtp(otpCode);
  const isValid = expectedHash === actualHash;

  challenge.attempts += 1;

  if (isValid) {
    challenge.verifiedAt = new Date();
  }

  await challenge.save();

  return {
    challenge,
    isValid,
    attemptsLeft: Math.max(challenge.maxAttempts - challenge.attempts, 0),
  };
};
