import bcrypt from "bcryptjs";
import AppUser from "../models/AppUser.js";
import { HttpError } from "../utils/httpError.js";
import { signUserToken } from "../utils/token.js";
import { isEmailAddress, normalizeEmailOrUsername } from "../utils/email.js";

const SALT_ROUNDS = 10;
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeUser = (userDoc) => ({
  id: userDoc._id.toString(),
  fullName: userDoc.fullName,
  email: userDoc.email,
  createdAt: userDoc.createdAt,
  lastLoginAt: userDoc.lastLoginAt,
});

export const signupAccount = async ({ fullName, email, password }) => {
  const normalizedEmail = normalizeEmailOrUsername(email, "Email or username");
  const existing = await AppUser.findOne({ email: normalizedEmail });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await AppUser.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    lastLoginAt: new Date(),
  });

  const token = signUserToken(user._id.toString());
  return { token, user: sanitizeUser(user) };
};

export const loginAccount = async ({ email, password }) => {
  const loginIdentifier = String(email ?? "").trim().toLowerCase();
  if (!loginIdentifier) {
    throw new HttpError(400, "Email or username is required");
  }

  let user = null;
  if (isEmailAddress(loginIdentifier)) {
    user = await AppUser.findOne({ email: loginIdentifier, active: true });
  } else {
    const matches = await AppUser.find({
      active: true,
      email: { $regex: `^${escapeRegExp(loginIdentifier)}@`, $options: "i" },
    }).limit(2);

    if (matches.length > 1) {
      throw new HttpError(
        409,
        "Multiple accounts found for this username. Please login with full email.",
      );
    }

    user = matches[0] ?? null;
  }

  if (!user) {
    throw new HttpError(401, "Invalid email/username or password");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new HttpError(401, "Invalid email/username or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signUserToken(user._id.toString());
  return { token, user: sanitizeUser(user) };
};

export const getAccountMe = (userDoc) => {
  if (!userDoc) {
    throw new HttpError(401, "Authentication required");
  }
  return sanitizeUser(userDoc);
};
