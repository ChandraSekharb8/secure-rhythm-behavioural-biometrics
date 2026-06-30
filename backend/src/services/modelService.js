import { clamp, round } from "../utils/math.js";

const scoreProfileDistance = (profile, metrics, profileStats) => {
  const tolerance = Math.max(1, profile.tolerance || 1);
  const dwellLoss = Math.abs((metrics.avgDwell || 0) - (profile.avgDwell || 0)) / tolerance;
  const flightLoss =
    Math.abs((metrics.avgFlight || 0) - (profile.avgFlight || 0)) / Math.max(1, tolerance * 3);

  const targetWpm = profileStats?.avgWpm ?? 35;
  const speedLoss = Math.abs((metrics.wpm || 0) - targetWpm) / Math.max(15, targetWpm);

  return { dwellLoss, flightLoss, speedLoss };
};

const scoreBehavioralQuality = (metrics) => {
  const promptLoss = 1 - (metrics.promptMatchRatio || 0) / 100;
  const consistencyLoss = 1 - (metrics.consistencyScore || 0) / 100;
  const backspacePenalty = (metrics.backspaceRate || 0) / 100;

  return { promptLoss, consistencyLoss, backspacePenalty };
};

const scoreTemporalStability = (metrics) => {
  const wpm = metrics.wpm || 0;
  const tenSecondWpm = metrics.tenSecondWpm || 0;
  const driftLoss = wpm > 0 ? Math.abs(tenSecondWpm - wpm) / Math.max(1, wpm) : 1;
  const tenSecondPenalty = metrics.tenSecondMatch ? 0 : 0.35;
  return { driftLoss, tenSecondPenalty };
};

const combinedScore = (distance, behavior, temporal) => {
  const distanceScore = 0.5 * distance.dwellLoss + 0.35 * distance.flightLoss + 0.15 * distance.speedLoss;
  const behaviorScore =
    0.45 * behavior.promptLoss + 0.35 * behavior.consistencyLoss + 0.2 * behavior.backspacePenalty;
  const temporalScore = 0.65 * temporal.driftLoss + 0.35 * temporal.tenSecondPenalty;
  return 0.55 * distanceScore + 0.25 * behaviorScore + 0.2 * temporalScore;
};

const confidenceFromScore = (score) => clamp((1 - score / 2.8) * 100, 0, 100);

const monteCarloDropout = (scoreParts, passes = 24) => {
  const confidences = [];
  for (let i = 0; i < passes; i += 1) {
    const distanceMask = Math.random() > 0.15 ? 1 : 0;
    const behaviorMask = Math.random() > 0.15 ? 1 : 0;
    const temporalMask = Math.random() > 0.15 ? 1 : 0;
    const active = distanceMask + behaviorMask + temporalMask || 1;

    const droppedScore =
      (scoreParts.distanceScore * distanceMask +
        scoreParts.behaviorScore * behaviorMask +
        scoreParts.temporalScore * temporalMask) /
      active;

    const noisyScore = droppedScore + (Math.random() - 0.5) * 0.08;
    confidences.push(confidenceFromScore(noisyScore));
  }

  const mean = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
  const variance =
    confidences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / confidences.length;
  const uncertainty = Math.sqrt(variance);
  const adjusted = clamp(mean - uncertainty * 0.9, 0, 100);

  return {
    meanConfidence: round(mean, 2),
    uncertainty: round(uncertainty, 2),
    adjustedConfidence: round(adjusted, 2),
  };
};

export const evaluateProfileWithHybridModel = ({ profile, metrics, profileStats }) => {
  const distance = scoreProfileDistance(profile, metrics, profileStats);
  const behavior = scoreBehavioralQuality(metrics);
  const temporal = scoreTemporalStability(metrics);
  const score = combinedScore(distance, behavior, temporal);

  const distanceScore = 0.5 * distance.dwellLoss + 0.35 * distance.flightLoss + 0.15 * distance.speedLoss;
  const behaviorScore =
    0.45 * behavior.promptLoss + 0.35 * behavior.consistencyLoss + 0.2 * behavior.backspacePenalty;
  const temporalScore = 0.65 * temporal.driftLoss + 0.35 * temporal.tenSecondPenalty;

  const mc = monteCarloDropout({ distanceScore, behaviorScore, temporalScore });

  return {
    score: round(score, 4),
    confidence: mc.adjustedConfidence,
    uncertainty: mc.uncertainty,
    components: {
      distanceScore: round(distanceScore, 4),
      behaviorScore: round(behaviorScore, 4),
      temporalScore: round(temporalScore, 4),
    },
  };
};

