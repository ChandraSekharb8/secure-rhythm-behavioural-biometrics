import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import TypingSession from "../models/TypingSession.js";
import UserProfile from "../models/UserProfile.js";
import { average, clamp, round } from "../utils/math.js";
import { HttpError } from "../utils/httpError.js";
import { evaluateProfileWithHybridModel } from "./modelService.js";
import { createAndSendOtpChallenge, verifyOtpChallenge } from "./otpService.js";
import { predictWithMlModel } from "./mlModelService.js";

const sumValues = (values = []) =>
  values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const variance = (values = []) => {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length <= 1) return 0;

  const avg = average(finiteValues);
  const squared = finiteValues.reduce((sum, value) => sum + (value - avg) ** 2, 0);
  return squared / finiteValues.length;
};

const calculatePromptMatchRatio = (typedText = "", promptText = "") => {
  const typed = typedText.trim();
  const prompt = promptText.trim();

  if (!prompt && !typed) return 100;
  if (!prompt || !typed) return 0;

  const maxLength = Math.max(prompt.length, typed.length, 1);
  let match = 0;
  for (let index = 0; index < Math.min(prompt.length, typed.length); index += 1) {
    if (prompt[index] === typed[index]) {
      match += 1;
    }
  }

  return (match / maxLength) * 100;
};

const calculateTenSecondWindow = (dwellTimes, flightTimes) => {
  let elapsedMs = 0;
  let characters = 0;

  for (let index = 0; index < dwellTimes.length; index += 1) {
    const dwell = Number.isFinite(dwellTimes[index]) ? dwellTimes[index] : 0;
    const flight = Number.isFinite(flightTimes[index]) ? flightTimes[index] : 0;

    if (elapsedMs >= 10000) break;
    elapsedMs += dwell;
    if (elapsedMs <= 10000) {
      characters += 1;
    }
    if (elapsedMs >= 10000) break;
    elapsedMs += flight;
  }

  const windowMs = Math.min(elapsedMs, 10000);
  const seconds = windowMs / 1000;
  if (seconds <= 0) {
    return { tenSecondWpm: 0, tenSecondWps: 0 };
  }

  const words = characters / 5;
  return {
    tenSecondWpm: (words / seconds) * 60,
    tenSecondWps: words / seconds,
  };
};

const calculateFeatureMetrics = ({
  typedText,
  promptText,
  dwellTimes,
  flightTimes,
  keyCount,
  backspaceCount,
}) => {
  const safeKeyCount = Math.max(keyCount || 0, dwellTimes.length);
  const safeBackspaceCount = Math.max(0, Math.min(backspaceCount || 0, safeKeyCount));
  const durationMs = sumValues(dwellTimes) + sumValues(flightTimes);
  const seconds = durationMs / 1000;
  const charCount = typedText.trim().length;
  const words = charCount / 5;
  const wpm = seconds > 0 ? (words / seconds) * 60 : 0;
  const wps = seconds > 0 ? words / seconds : 0;
  const cps = seconds > 0 ? charCount / seconds : 0;
  const promptMatchRatio = calculatePromptMatchRatio(typedText, promptText);
  const dwellVariance = variance(dwellTimes);
  const flightVariance = variance(flightTimes);

  const avgDwell = average(dwellTimes);
  const avgFlight = average(flightTimes);
  const variabilityRatio =
    (Math.sqrt(dwellVariance) + Math.sqrt(flightVariance)) / Math.max(1, avgDwell + avgFlight);
  const consistencyScore = clamp((1 - variabilityRatio) * 100, 0, 100);

  const tenSecondWindow = calculateTenSecondWindow(dwellTimes, flightTimes);
  const tenSecondDiffRatio =
    wpm > 0 ? Math.abs(tenSecondWindow.tenSecondWpm - wpm) / Math.max(1, wpm) : 1;

  return {
    keyCount: safeKeyCount,
    backspaceCount: safeBackspaceCount,
    backspaceRate: safeKeyCount > 0 ? (safeBackspaceCount / safeKeyCount) * 100 : 0,
    typingDurationMs: durationMs,
    wpm,
    wps,
    cps,
    promptMatchRatio,
    dwellVariance,
    flightVariance,
    consistencyScore,
    tenSecondWpm: tenSecondWindow.tenSecondWpm,
    tenSecondWps: tenSecondWindow.tenSecondWps,
    tenSecondMatch: tenSecondDiffRatio <= env.tenSecondWpmToleranceRatio,
  };
};

const calculateMatch = (featureMetrics, profiles, profileStatsMap, mlPrediction) => {
  let bestProfile = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestConfidence = 0;
  let bestUncertainty = 0;
  let bestComponents = null;
  let bestMlProbability = 0;
  const ranked = [];
  const mlProbabilityMap = new Map(
    (mlPrediction?.probabilities ?? []).map((entry) => [entry.label, entry.probability]),
  );
  const mlUncertainty = Number.isFinite(mlPrediction?.uncertainty)
    ? mlPrediction.uncertainty
    : 100;

  for (const profile of profiles) {
    const evaluated = evaluateProfileWithHybridModel({
      profile,
      metrics: {
        ...featureMetrics,
        avgDwell: featureMetrics.avgDwell,
        avgFlight: featureMetrics.avgFlight,
      },
      profileStats: profileStatsMap.get(profile.name),
    });
    const mlProbability = mlProbabilityMap.get(profile.name) ?? 0;
    const mlPenalty = 1 - mlProbability;
    const score = 0.65 * evaluated.score + 0.35 * mlPenalty;
    const confidence = clamp(evaluated.confidence * 0.6 + mlProbability * 100 * 0.4, 0, 100);
    const uncertainty = round(0.6 * evaluated.uncertainty + 0.4 * mlUncertainty, 2);

    ranked.push({ profileName: profile.name, score, confidence });
    if (score < bestScore) {
      bestScore = score;
      bestProfile = profile;
      bestConfidence = confidence;
      bestUncertainty = uncertainty;
      bestComponents = {
        ...evaluated.components,
        mlProbability: round(mlProbability * 100, 2),
      };
      bestMlProbability = mlProbability;
    }
  }

  ranked.sort((a, b) => a.score - b.score);
  const secondBest = ranked[1];
  const margin = secondBest ? secondBest.score - ranked[0].score : 0.5;
  const marginBoost = clamp(margin * 35, 0, 18);
  const confidence = clamp(round(bestConfidence + marginBoost, 0), 0, 100);

  return {
    bestProfile,
    confidence,
    uncertainty: round(bestUncertainty, 2),
    components: bestComponents,
    mlTopPrediction: mlPrediction?.topPrediction ?? null,
    mlUncertainty: round(mlUncertainty, 2),
    mlMatchedProbability: round(bestMlProbability * 100, 2),
  };
};

export const identifyTypingPattern = async ({
  dwellTimes,
  flightTimes,
  typedText,
  promptText,
  keyCount,
  backspaceCount,
  actorUserId = null,
}) => {
  const avgDwell = average(dwellTimes);
  const avgFlight = average(flightTimes);
  const featureMetricsRaw = calculateFeatureMetrics({
    typedText,
    promptText,
    dwellTimes,
    flightTimes,
    keyCount,
    backspaceCount,
  });
  const featureMetrics = {
    keyCount: featureMetricsRaw.keyCount,
    backspaceCount: featureMetricsRaw.backspaceCount,
    backspaceRate: round(featureMetricsRaw.backspaceRate, 2),
    typingDurationMs: round(featureMetricsRaw.typingDurationMs, 2),
    wpm: round(featureMetricsRaw.wpm, 2),
    wps: round(featureMetricsRaw.wps, 3),
    cps: round(featureMetricsRaw.cps, 2),
    promptMatchRatio: round(featureMetricsRaw.promptMatchRatio, 2),
    dwellVariance: round(featureMetricsRaw.dwellVariance, 2),
    flightVariance: round(featureMetricsRaw.flightVariance, 2),
    consistencyScore: round(featureMetricsRaw.consistencyScore, 2),
    tenSecondWpm: round(featureMetricsRaw.tenSecondWpm, 2),
    tenSecondWps: round(featureMetricsRaw.tenSecondWps, 3),
    tenSecondMatch: featureMetricsRaw.tenSecondMatch,
  };

  const profiles = await UserProfile.find({ active: true }).lean();
  if (profiles.length === 0) {
    throw new HttpError(500, "No active user profiles found");
  }

  const recentSessions = await TypingSession.find(
    { source: "live-demo", authMethod: { $in: ["typing", "typing+fallback"] } },
    { detectedUser: 1, "featureMetrics.wpm": 1 },
  )
    .sort({ createdAt: -1 })
    .limit(800)
    .lean();

  const statsByUser = new Map();
  for (const session of recentSessions) {
    const user = session.detectedUser;
    const current = statsByUser.get(user) ?? { wpmSum: 0, count: 0 };
    current.wpmSum += session.featureMetrics?.wpm ?? 0;
    current.count += 1;
    statsByUser.set(user, current);
  }

  const profileStatsMap = new Map(
    [...statsByUser.entries()].map(([user, value]) => [
      user,
      { avgWpm: value.count > 0 ? value.wpmSum / value.count : 0 },
    ]),
  );

  const mlPrediction = await predictWithMlModel({
    avgDwell,
    avgFlight,
    dwellTimes,
    flightTimes,
    featureMetrics,
  });

  const {
    bestProfile,
    confidence,
    uncertainty,
    components,
    mlTopPrediction,
    mlUncertainty,
    mlMatchedProbability,
  } = calculateMatch(
    { ...featureMetrics, avgDwell, avgFlight },
    profiles,
    profileStatsMap,
    mlPrediction,
  );
  if (!bestProfile) {
    throw new HttpError(500, "Unable to match typing pattern");
  }

  const warnings = [];
  if (featureMetrics.promptMatchRatio < env.promptMatchThreshold) {
    warnings.push("Type correctly: your input does not match the sentence.");
  }
  if (!featureMetrics.tenSecondMatch) {
    warnings.push("Typing speed in the first 10 seconds is not stable enough.");
  }
  if (uncertainty >= env.modelUncertaintyThreshold) {
    warnings.push("Model uncertainty is high. Fallback verification is recommended.");
  }
  if (mlTopPrediction && mlTopPrediction.label !== bestProfile.name) {
    warnings.push("ML top prediction differs from behavioral match.");
  }

  const canDirectlyAuthenticate =
    confidence >= env.authConfidenceThreshold &&
    featureMetrics.promptMatchRatio >= env.promptMatchThreshold &&
    featureMetrics.tenSecondMatch;

  const authStatus = canDirectlyAuthenticate ? "otp_pending" : "fallback";

  if (canDirectlyAuthenticate) {
    warnings.push("OTP verification is required to complete authentication.");
  }

  const createdSession = await TypingSession.create({
    createdBy: actorUserId,
    profileId: bestProfile._id,
    detectedUser: bestProfile.name,
    typedText,
    promptText,
    dwellTimes,
    flightTimes,
    avgDwell: round(avgDwell),
    avgFlight: round(avgFlight),
    confidence,
    authStatus,
    authMethod: "typing",
    warnings,
    featureMetrics,
    source: "live-demo",
  });

  let otpDetails = null;
  if (canDirectlyAuthenticate) {
    otpDetails = await createAndSendOtpChallenge({
      profileId: bestProfile._id.toString(),
      sessionId: createdSession._id.toString(),
      purpose: "typing-auth",
      actorUserId,
    });
  }

  return {
    sessionId: createdSession._id.toString(),
    detectedUser: bestProfile.name,
    confidence,
    authStatus: canDirectlyAuthenticate ? "otp_pending" : "fallback",
    otpRequired: canDirectlyAuthenticate,
    otpChallengeId: otpDetails?.challengeId ?? null,
    otpDestination: otpDetails?.destination ?? null,
    avgDwell: round(avgDwell),
    avgFlight: round(avgFlight),
    threshold: env.authConfidenceThreshold,
    featureMetrics,
    warnings,
    modelInsights: {
      modelType: "hybrid-cnn-bilstm-inspired",
      uncertaintyMethod: "mc-dropout-inspired",
      uncertainty,
      components,
      mlModel: {
        topPrediction: mlTopPrediction,
        uncertainty: mlUncertainty,
        matchedProbability: mlMatchedProbability,
      },
    },
  };
};

export const verifyFallbackPassword = async ({
  password,
  detectedUser,
  sessionId,
  actorUserId = null,
}) => {
  let session = null;

  if (sessionId) {
    session = await TypingSession.findById(sessionId);
  }

  if (
    session &&
    actorUserId &&
    session.createdBy &&
    session.createdBy.toString() !== actorUserId.toString()
  ) {
    throw new HttpError(403, "You do not have access to this session");
  }

  const userName = detectedUser ?? session?.detectedUser;
  if (!userName) {
    throw new HttpError(400, "Detected user is required for fallback verification");
  }

  const userProfile = await UserProfile.findOne({
    name: { $regex: `^${escapeRegExp(userName.trim())}$`, $options: "i" },
    active: true,
  });
  if (!userProfile) {
    throw new HttpError(404, "Detected user profile does not exist");
  }

  const matches = await bcrypt.compare(password, userProfile.fallbackPasswordHash);
  const authStatus = matches ? "otp_pending" : "denied";
  const confidence = matches ? 100 : 0;

  if (session) {
    session.fallbackAttempted = true;
    session.fallbackSuccessful = matches;
    session.authStatus = authStatus;
    session.confidence = confidence;
    session.authMethod = "typing+fallback";
    session.warnings = matches ? ["OTP verification is required to complete authentication."] : [];
    await session.save();
  }

  if (!session) {
    session = await TypingSession.create({
      createdBy: actorUserId,
      profileId: userProfile._id,
      detectedUser: userProfile.name,
      typedText: "",
      promptText: "",
      dwellTimes: [],
      flightTimes: [],
      avgDwell: round(userProfile.avgDwell, 2),
      avgFlight: round(userProfile.avgFlight, 2),
      confidence,
      authStatus,
      authMethod: "password-only",
      warnings: matches ? ["OTP verification is required to complete authentication."] : [],
      featureMetrics: {
        keyCount: 0,
        backspaceCount: 0,
        backspaceRate: 0,
        typingDurationMs: 0,
        wpm: 0,
        wps: 0,
        cps: 0,
        promptMatchRatio: 0,
        dwellVariance: 0,
        flightVariance: 0,
        consistencyScore: 0,
        tenSecondWpm: 0,
        tenSecondWps: 0,
        tenSecondMatch: false,
      },
      fallbackAttempted: true,
      fallbackSuccessful: matches,
      source: "live-demo",
    });
  }

  let otpDetails = null;
  if (matches) {
    otpDetails = await createAndSendOtpChallenge({
      profileId: userProfile._id.toString(),
      sessionId: session._id.toString(),
      purpose: session?.authMethod === "password-only" ? "password-auth" : "typing-auth",
      actorUserId,
    });
  }

  return {
    sessionId: session ? session._id.toString() : null,
    detectedUser: userProfile.name,
    authStatus,
    confidence,
    otpRequired: matches,
    otpChallengeId: otpDetails?.challengeId ?? null,
    otpDestination: otpDetails?.destination ?? null,
  };
};

export const verifyOtpForAuthentication = async ({
  challengeId,
  otpCode,
  sessionId = null,
  actorUserId = null,
}) => {
  const { challenge, isValid, attemptsLeft } = await verifyOtpChallenge({
    challengeId,
    otpCode,
    actorUserId,
  });

  let session = null;
  const targetSessionId = sessionId ?? challenge.sessionId?.toString() ?? null;

  if (targetSessionId) {
    session = await TypingSession.findById(targetSessionId);
  }

  if (
    session &&
    actorUserId &&
    session.createdBy &&
    session.createdBy.toString() !== actorUserId.toString()
  ) {
    throw new HttpError(403, "You do not have access to this session");
  }

  if (session) {
    if (isValid) {
      session.authStatus = "authenticated";
      session.confidence = 100;
      session.warnings = [];
    } else if (attemptsLeft <= 0) {
      session.authStatus = "denied";
      session.warnings = ["OTP attempts exceeded. Authentication denied."];
    } else {
      session.authStatus = "otp_pending";
      session.warnings = ["Invalid OTP. Try again."];
    }

    await session.save();
  }

  const profile =
    session?.profileId ? await UserProfile.findById(session.profileId).lean() : await UserProfile.findById(challenge.profileId).lean();

  return {
    sessionId: session?._id?.toString() ?? targetSessionId,
    detectedUser: session?.detectedUser ?? profile?.name ?? "Unknown",
    authStatus: isValid ? "authenticated" : attemptsLeft <= 0 ? "denied" : "otp_pending",
    confidence: isValid ? 100 : 0,
    otpVerified: isValid,
    attemptsLeft,
  };
};
