import TypingSession from "../models/TypingSession.js";
import UserProfile from "../models/UserProfile.js";
import { round } from "../utils/math.js";

const FALLBACK_COLORS = [
  "#00d2d3",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#eab308",
  "#22d3ee",
  "#fb7185",
  "#a3e635",
];

const buildResultDistribution = (sessions) => {
  let pass = 0;
  let fail = 0;
  let passwordOnly = 0;

  for (const session of sessions) {
    if (session.authStatus === "authenticated") {
      pass += 1;
    } else {
      fail += 1;
    }
    if (session.authMethod === "password-only") {
      passwordOnly += 1;
    }
  }

  return [
    { result: "Pass", count: pass },
    { result: "Fail", count: fail },
    { result: "Password Only", count: passwordOnly },
  ];
};

const buildFeatureTrendData = (sessions) => {
  return [...sessions]
    .reverse()
    .slice(0, 25)
    .map((session, index) => ({
      session: index + 1,
      wpm: round(session.featureMetrics?.wpm ?? 0, 2),
      wps: round(session.featureMetrics?.wps ?? 0, 3),
      tenSecondWpm: round(session.featureMetrics?.tenSecondWpm ?? 0, 2),
      promptMatchRatio: round(session.featureMetrics?.promptMatchRatio ?? 0, 2),
      consistencyScore: round(session.featureMetrics?.consistencyScore ?? 0, 2),
      backspaceRate: round(session.featureMetrics?.backspaceRate ?? 0, 2),
    }));
};

const buildTenSecondMatchByUser = (sessions) => {
  const groups = new Map();

  for (const session of sessions) {
    const user = session.detectedUser;
    const current = groups.get(user) ?? { total: 0, matched: 0 };
    current.total += 1;
    if (session.featureMetrics?.tenSecondMatch) {
      current.matched += 1;
    }
    groups.set(user, current);
  }

  return [...groups.entries()].map(([user, value]) => ({
    user,
    matchRate: value.total > 0 ? round((value.matched / value.total) * 100, 1) : 0,
  }));
};

const buildFeatureAverages = (sessions) => {
  if (!sessions.length) return [];
  const totals = {
    wpm: 0,
    wps: 0,
    promptMatchRatio: 0,
    consistencyScore: 0,
    backspaceRate: 0,
  };

  for (const session of sessions) {
    totals.wpm += session.featureMetrics?.wpm ?? 0;
    totals.wps += session.featureMetrics?.wps ?? 0;
    totals.promptMatchRatio += session.featureMetrics?.promptMatchRatio ?? 0;
    totals.consistencyScore += session.featureMetrics?.consistencyScore ?? 0;
    totals.backspaceRate += session.featureMetrics?.backspaceRate ?? 0;
  }

  return [
    { feature: "WPM", value: round(totals.wpm / sessions.length, 2) },
    { feature: "WPS", value: round(totals.wps / sessions.length, 3) },
    { feature: "Prompt Match %", value: round(totals.promptMatchRatio / sessions.length, 2) },
    { feature: "Consistency %", value: round(totals.consistencyScore / sessions.length, 2) },
    { feature: "Backspace Rate %", value: round(totals.backspaceRate / sessions.length, 2) },
  ];
};

const buildPerKeystrokeData = (sessions, key, maxSteps = 20) => {
  const userBuckets = new Map();
  let highestIndex = 0;

  for (const session of sessions) {
    const values = Array.isArray(session[key]) ? session[key] : [];
    if (values.length === 0) continue;

    const user = session.detectedUser;
    const current = userBuckets.get(user) ?? [];

    for (let index = 0; index < values.length && index < maxSteps; index += 1) {
      const value = values[index];
      if (!Number.isFinite(value)) continue;

      if (!current[index]) {
        current[index] = { sum: 0, count: 0 };
      }

      current[index].sum += value;
      current[index].count += 1;
      highestIndex = Math.max(highestIndex, index + 1);
    }

    userBuckets.set(user, current);
  }

  if (highestIndex === 0) return [];

  const rows = [];
  for (let index = 0; index < highestIndex; index += 1) {
    const row = { keystroke: index + 1 };
    let hasValue = false;

    for (const [user, bucket] of userBuckets.entries()) {
      const cell = bucket[index];
      if (!cell || cell.count === 0) continue;
      row[user] = round(cell.sum / cell.count, 2);
      hasValue = true;
    }

    if (hasValue) {
      rows.push(row);
    }
  }

  return rows;
};

const buildConfidenceData = (sessions) => {
  const recentSessions = [...sessions].reverse().slice(0, 15);
  return recentSessions.map((session, index) => ({
    session: index + 1,
    confidence: round(session.confidence),
  }));
};

const buildClusterData = (sessions) => {
  const recentSessions = sessions.slice(0, 300);
  return recentSessions.map((session) => ({
    dwell: round(session.avgDwell, 1),
    flight: round(session.avgFlight, 1),
    user: session.detectedUser,
  }));
};

export const getDashboardCharts = async () => {
  const [profiles, sessions] = await Promise.all([
    UserProfile.find({ active: true }).sort({ name: 1 }).lean(),
    TypingSession.find({ source: "live-demo" })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean(),
  ]);

  const profileColorMap = new Map(profiles.map((profile) => [profile.name, profile.color]));
  const groupedByUser = new Map();

  for (const session of sessions) {
    const current = groupedByUser.get(session.detectedUser) ?? {
      dwellSum: 0,
      flightSum: 0,
      count: 0,
    };

    current.dwellSum += session.avgDwell ?? 0;
    current.flightSum += session.avgFlight ?? 0;
    current.count += 1;
    groupedByUser.set(session.detectedUser, current);
  }

  const userNames = [...groupedByUser.keys()].sort((a, b) => a.localeCompare(b));
  const colors = Object.fromEntries(
    userNames.map((name, index) => [
      name,
      profileColorMap.get(name) ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    ]),
  );

  const comparisonData = userNames.map((name) => {
    const group = groupedByUser.get(name);
    return {
      name,
      dwellTime: group?.count ? round(group.dwellSum / group.count, 2) : 0,
      flightTime: group?.count ? round(group.flightSum / group.count, 2) : 0,
    };
  });

  return {
    users: userNames.map((name) => ({ name, color: colors[name] })),
    colors,
    dwellData: buildPerKeystrokeData(sessions, "dwellTimes"),
    flightData: buildPerKeystrokeData(sessions, "flightTimes"),
    comparisonData,
    confidenceData: buildConfidenceData(sessions),
    clusterData: buildClusterData(sessions),
    resultDistribution: buildResultDistribution(sessions),
    featureTrendData: buildFeatureTrendData(sessions),
    tenSecondMatchByUser: buildTenSecondMatchByUser(sessions),
    featureAverages: buildFeatureAverages(sessions),
    sampleCount: sessions.length,
    updatedAt: new Date().toISOString(),
  };
};
