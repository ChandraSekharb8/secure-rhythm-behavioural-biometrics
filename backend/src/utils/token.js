import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signUserToken = (userId) => {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

export const verifyUserToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

