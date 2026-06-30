import { env } from "../config/env.js";
import { HttpError } from "./httpError.js";

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
const BASIC_USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

const toUsernameSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/[._-]{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");

export const normalizeEmailOrUsername = (value, fieldLabel = "Email") => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    throw new HttpError(400, `${fieldLabel} is required`);
  }

  const lowered = raw.toLowerCase();
  if (BASIC_EMAIL_REGEX.test(lowered)) {
    return lowered;
  }

  const username = BASIC_USERNAME_REGEX.test(lowered) ? lowered : toUsernameSlug(lowered);
  if (!BASIC_USERNAME_REGEX.test(username)) {
    throw new HttpError(400, `${fieldLabel} must be a valid email or username`);
  }

  const domain = String(env.profileEmailDomain ?? "").trim().toLowerCase();
  if (!domain) {
    throw new HttpError(500, "PROFILE_EMAIL_DOMAIN is not configured");
  }

  return `${username}@${domain}`;
};

export const isEmailAddress = (value) => BASIC_EMAIL_REGEX.test(String(value ?? "").trim());
