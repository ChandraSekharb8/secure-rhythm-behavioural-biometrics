import AppUser from "../models/AppUser.js";
import { HttpError } from "../utils/httpError.js";
import { verifyUserToken } from "../utils/token.js";

const extractBearerToken = (headerValue) => {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
};

const loadAuthUser = async (token) => {
  let decoded;
  try {
    decoded = verifyUserToken(token);
  } catch (error) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const userId = decoded?.sub;
  if (!userId) {
    throw new HttpError(401, "Invalid token payload");
  }

  const user = await AppUser.findOne({ _id: userId, active: true });
  if (!user) {
    throw new HttpError(401, "User account not found or inactive");
  }

  return user;
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      req.user = null;
      next();
      return;
    }

    req.user = await loadAuthUser(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new HttpError(401, "Authentication required");
    }

    req.user = await loadAuthUser(token);
    next();
  } catch (error) {
    next(error);
  }
};

