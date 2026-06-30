import bcrypt from "bcryptjs";
import UserProfile from "../models/UserProfile.js";
import { DEFAULT_USER_PROFILES } from "../constants/defaultProfiles.js";
import { HttpError } from "../utils/httpError.js";
import { getDatasetDerivedProfiles } from "./mlModelService.js";
import { normalizeEmailOrUsername } from "../utils/email.js";

const SALT_ROUNDS = 10;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const ensureDefaultProfiles = async () => {
  let seedProfiles = DEFAULT_USER_PROFILES;
  try {
    const datasetProfiles = await getDatasetDerivedProfiles();
    if (datasetProfiles.length > 0) {
      seedProfiles = datasetProfiles;
    }
  } catch (error) {
    console.warn(
      "[profiles] Falling back to static profiles because dataset-derived profiles are unavailable.",
    );
  }

  for (const profile of seedProfiles) {
    const existing = await UserProfile.findOne({ name: profile.name });

    if (!existing) {
      const fallbackPasswordHash = await bcrypt.hash(profile.fallbackPassword, SALT_ROUNDS);
      await UserProfile.create({
        name: profile.name,
        email: profile.email,
        avgDwell: profile.avgDwell,
        avgFlight: profile.avgFlight,
        tolerance: profile.tolerance,
        color: profile.color,
        fallbackPasswordHash,
      });
      continue;
    }

    existing.avgDwell = profile.avgDwell;
    existing.avgFlight = profile.avgFlight;
    existing.tolerance = profile.tolerance;
    existing.color = profile.color;
    existing.active = true;
    if (profile.email) {
      existing.email = profile.email;
    }

    if (!existing.fallbackPasswordHash) {
      existing.fallbackPasswordHash = await bcrypt.hash(profile.fallbackPassword, SALT_ROUNDS);
    }

    await existing.save();
  }
};

export const getActiveProfiles = async () => {
  return UserProfile.find({ active: true }).sort({ name: 1 }).lean();
};

export const createProfile = async ({
  name,
  email,
  avgDwell,
  avgFlight,
  tolerance,
  color,
  fallbackPassword,
  actorUserId,
}) => {
  const cleanName = name.trim();
  const existing = await UserProfile.findOne({
    name: { $regex: `^${escapeRegExp(cleanName)}$`, $options: "i" },
  });

  if (existing) {
    throw new HttpError(409, "Profile name already exists");
  }

  const normalizedEmail = normalizeEmailOrUsername(email, "Email or username");
  const emailExists = await UserProfile.findOne({ email: normalizedEmail });
  if (emailExists) {
    throw new HttpError(409, "Profile email already exists");
  }

  const fallbackPasswordHash = await bcrypt.hash(fallbackPassword, SALT_ROUNDS);
  const profile = await UserProfile.create({
    createdBy: actorUserId ?? null,
    name: cleanName,
    email: normalizedEmail,
    avgDwell,
    avgFlight,
    tolerance,
    color,
    fallbackPasswordHash,
    active: true,
  });

  return {
    id: profile._id.toString(),
    name: profile.name,
    email: profile.email,
    avgDwell: profile.avgDwell,
    avgFlight: profile.avgFlight,
    tolerance: profile.tolerance,
    color: profile.color,
  };
};
