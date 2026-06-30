import {
  identifySchema,
  fallbackSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
} from "../validation/authSchemas.js";
import {
  identifyTypingPattern,
  verifyFallbackPassword,
  verifyOtpForAuthentication,
} from "../services/biometricsService.js";
import {
  signupAccount,
  loginAccount,
  getAccountMe,
} from "../services/accountService.js";

export const signupHandler = async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const result = await signupAccount(parsed);
    res.status(201).json(result);
  } catch (err) {
    console.error("========== SIGNUP ERROR ==========");
    console.error(err);
    console.error("==================================");
    next(err);
  }
};

export const loginHandler = async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginAccount(parsed);
    res.json(result);
  } catch (err) {
    console.error("========== LOGIN ERROR ==========");
    console.error(err);
    console.error("==================================");
    next(err);
  }
};


export const meHandler = async (req, res) => {
  const user = getAccountMe(req.user);
  res.json({ user });
};

export const identifyHandler = async (req, res) => {
  const parsed = identifySchema.parse(req.body);
  const result = await identifyTypingPattern({
    ...parsed,
    actorUserId: req.user?._id?.toString() ?? null,
  });
  res.json(result);
};

export const fallbackHandler = async (req, res) => {
  const parsed = fallbackSchema.parse(req.body);
  const result = await verifyFallbackPassword({
    ...parsed,
    actorUserId: req.user?._id?.toString() ?? null,
  });
  res.json(result);
};

export const verifyOtpHandler = async (req, res) => {
  const parsed = verifyOtpSchema.parse(req.body);
  const result = await verifyOtpForAuthentication({
    ...parsed,
    actorUserId: req.user?._id?.toString() ?? null,
  });
  res.json(result);
};
