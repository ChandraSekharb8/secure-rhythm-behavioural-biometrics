import TypingSession from "../models/TypingSession.js";
import { round } from "../utils/math.js";

const buildSessionFilter = (query, userId) => {
  const filter = {
    source: "live-demo",
    createdBy: userId,
  };

  if (
    query.authStatus &&
    ["authenticated", "fallback", "denied", "otp_pending"].includes(query.authStatus)
  ) {
    filter.authStatus = query.authStatus;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) {
      const from = new Date(query.from);
      if (!Number.isNaN(from.valueOf())) {
        filter.createdAt.$gte = from;
      }
    }
    if (query.to) {
      const to = new Date(query.to);
      if (!Number.isNaN(to.valueOf())) {
        filter.createdAt.$lte = to;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt;
    }
  }

  return filter;
};

export const sessionListHandler = async (req, res) => {
  const parsedLimit = Number(req.query.limit);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 20;

  const filter = buildSessionFilter(req.query, req.user._id);
  const sessions = await TypingSession.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    sessions: sessions.map((session) => ({
      id: session._id.toString(),
      detectedUser: session.detectedUser,
      confidence: session.confidence,
      authStatus: session.authStatus,
      result: session.authStatus === "authenticated" ? "pass" : "fail",
      authMethod: session.authMethod ?? "typing",
      avgDwell: session.avgDwell,
      avgFlight: session.avgFlight,
      typingSpeedWpm: round(session.featureMetrics?.wpm ?? 0, 2),
      typingSpeedWps: round(session.featureMetrics?.wps ?? 0, 3),
      charsPerSecond: round(session.featureMetrics?.cps ?? 0, 2),
      promptMatchRatio: round(session.featureMetrics?.promptMatchRatio ?? 0, 2),
      backspaceRate: round(session.featureMetrics?.backspaceRate ?? 0, 2),
      consistencyScore: round(session.featureMetrics?.consistencyScore ?? 0, 2),
      tenSecondWpm: round(session.featureMetrics?.tenSecondWpm ?? 0, 2),
      tenSecondMatch: Boolean(session.featureMetrics?.tenSecondMatch),
      keyCount: session.featureMetrics?.keyCount ?? 0,
      backspaceCount: session.featureMetrics?.backspaceCount ?? 0,
      typingDurationMs: round(session.featureMetrics?.typingDurationMs ?? 0, 2),
      createdAt: session.createdAt,
      typedText: session.typedText,
      promptText: session.promptText ?? "",
      warnings: Array.isArray(session.warnings) ? session.warnings : [],
      fallbackAttempted: session.fallbackAttempted,
      fallbackSuccessful: session.fallbackSuccessful,
    })),
  });
};

export const sessionSummaryHandler = async (req, res) => {
  const filter = buildSessionFilter(req.query, req.user._id);
  const [summary] = await Promise.all([
    TypingSession.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
          avgDwell: { $avg: "$avgDwell" },
          avgFlight: { $avg: "$avgFlight" },
          avgTypingSpeedWpm: { $avg: "$featureMetrics.wpm" },
          avgTypingSpeedWps: { $avg: "$featureMetrics.wps" },
          avgCharsPerSecond: { $avg: "$featureMetrics.cps" },
          avgPromptMatchRatio: { $avg: "$featureMetrics.promptMatchRatio" },
          avgBackspaceRate: { $avg: "$featureMetrics.backspaceRate" },
          avgConsistencyScore: { $avg: "$featureMetrics.consistencyScore" },
          avgTenSecondWpm: { $avg: "$featureMetrics.tenSecondWpm" },
          tenSecondMatchCount: {
            $sum: {
              $cond: [{ $eq: ["$featureMetrics.tenSecondMatch", true] }, 1, 0],
            },
          },
          passwordOnlyCount: {
            $sum: {
              $cond: [{ $eq: ["$authMethod", "password-only"] }, 1, 0],
            },
          },
          warningCount: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ["$warnings", []] } }, 0] }, 1, 0],
            },
          },
          authenticatedCount: {
            $sum: {
              $cond: [{ $eq: ["$authStatus", "authenticated"] }, 1, 0],
            },
          },
          fallbackCount: {
            $sum: {
              $cond: [{ $eq: ["$authStatus", "fallback"] }, 1, 0],
            },
          },
          deniedCount: {
            $sum: {
              $cond: [{ $eq: ["$authStatus", "denied"] }, 1, 0],
            },
          },
          otpPendingCount: {
            $sum: {
              $cond: [{ $eq: ["$authStatus", "otp_pending"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const summaryRow = summary?.[0];

  if (!summaryRow) {
    res.json({
      totalSessions: 0,
      avgConfidence: 0,
      avgDwell: 0,
      avgFlight: 0,
      avgTypingSpeedWpm: 0,
      avgTypingSpeedWps: 0,
      avgCharsPerSecond: 0,
      avgPromptMatchRatio: 0,
      avgBackspaceRate: 0,
      avgConsistencyScore: 0,
      avgTenSecondWpm: 0,
      tenSecondMatchRate: 0,
      passwordOnlyCount: 0,
      warningCount: 0,
      authenticatedCount: 0,
      fallbackCount: 0,
      deniedCount: 0,
      otpPendingCount: 0,
      successRate: 0,
    });
    return;
  }

  const successRate =
    summaryRow.totalSessions > 0
      ? round((summaryRow.authenticatedCount / summaryRow.totalSessions) * 100, 1)
      : 0;
  const tenSecondMatchRate =
    summaryRow.totalSessions > 0
      ? round((summaryRow.tenSecondMatchCount / summaryRow.totalSessions) * 100, 1)
      : 0;

  res.json({
    totalSessions: summaryRow.totalSessions,
    avgConfidence: round(summaryRow.avgConfidence ?? 0, 1),
    avgDwell: round(summaryRow.avgDwell ?? 0, 1),
    avgFlight: round(summaryRow.avgFlight ?? 0, 1),
    avgTypingSpeedWpm: round(summaryRow.avgTypingSpeedWpm ?? 0, 2),
    avgTypingSpeedWps: round(summaryRow.avgTypingSpeedWps ?? 0, 3),
    avgCharsPerSecond: round(summaryRow.avgCharsPerSecond ?? 0, 2),
    avgPromptMatchRatio: round(summaryRow.avgPromptMatchRatio ?? 0, 2),
    avgBackspaceRate: round(summaryRow.avgBackspaceRate ?? 0, 2),
    avgConsistencyScore: round(summaryRow.avgConsistencyScore ?? 0, 2),
    avgTenSecondWpm: round(summaryRow.avgTenSecondWpm ?? 0, 2),
    tenSecondMatchRate,
    passwordOnlyCount: summaryRow.passwordOnlyCount,
    warningCount: summaryRow.warningCount,
    authenticatedCount: summaryRow.authenticatedCount,
    fallbackCount: summaryRow.fallbackCount,
    deniedCount: summaryRow.deniedCount,
    otpPendingCount: summaryRow.otpPendingCount,
    successRate,
  });
};
