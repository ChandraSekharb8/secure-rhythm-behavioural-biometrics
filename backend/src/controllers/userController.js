import { getActiveProfiles, createProfile } from "../services/profileService.js";
import { createProfileSchema } from "../validation/userSchemas.js";

export const profileListHandler = async (req, res) => {
  const profiles = await getActiveProfiles();
  const response = profiles.map((profile) => ({
    id: profile._id.toString(),
    name: profile.name,
    email: profile.email ?? "",
    avgDwell: profile.avgDwell,
    avgFlight: profile.avgFlight,
    tolerance: profile.tolerance,
    color: profile.color,
  }));

  res.json({ users: response });
};

export const profileCreateHandler = async (req, res) => {
  const parsed = createProfileSchema.parse(req.body);
  const profile = await createProfile({
    ...parsed,
    actorUserId: req.user?._id?.toString() ?? null,
  });

  res.status(201).json({ user: profile });
};
