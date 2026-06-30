import { readFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { round } from "../utils/math.js";

const BASE_COLUMNS = ["subject", "sessionIndex", "rep"];

const FALLBACK_CSV = `subject,sessionIndex,rep,H.period,DD.period.t,UD.period.t,HH.period.t,HT.period.t
s001,1,1,178.4,241.2,122.1,81.1,91.4
s001,1,2,182.1,238.6,124.3,83.5,92.2
s001,2,1,176.8,243.9,121.4,80.4,90.7
s001,2,2,179.6,240.8,123.0,82.1,91.1
s002,1,1,165.3,210.5,108.2,76.8,87.5
s002,1,2,168.7,208.1,109.8,77.9,88.0
s002,2,1,163.9,212.3,107.7,76.2,87.1
s002,2,2,166.4,209.7,108.9,77.3,87.8
s003,1,1,153.2,197.4,99.6,72.4,84.2
s003,1,2,155.9,195.0,101.2,73.1,84.7
s003,2,1,151.8,199.1,98.4,71.8,83.9
s003,2,2,154.5,196.8,100.1,72.7,84.4
s004,1,1,190.1,255.7,131.9,86.4,95.1
s004,1,2,192.8,253.1,133.5,87.1,95.8
s004,2,1,188.6,257.4,130.7,85.7,94.6
s004,2,2,191.2,254.8,132.3,86.9,95.3`;

let cache = null;

const parseCsv = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new HttpError(500, "DSL dataset does not contain data rows");
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const parts = line.split(",");
    const row = {};

    headers.forEach((header, index) => {
      const value = parts[index];
      if (BASE_COLUMNS.includes(header)) {
        row[header] = value;
      } else {
        const parsed = Number(value);
        row[header] = Number.isFinite(parsed) ? parsed : null;
      }
    });

    return row;
  });

  return { headers, rows };
};

const toCountArray = (countMap, keyName, valueName = "count") => {
  return [...countMap.entries()]
    .map(([key, value]) => ({ [keyName]: key, [valueName]: value }))
    .sort((a, b) => b[valueName] - a[valueName]);
};

const getHistogram = (values, binCount = 12) => {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = max > min ? (max - min) / binCount : 1;

  const bins = Array.from({ length: binCount }, (_, index) => ({
    bin: `${round(min + width * index, 3)}-${round(min + width * (index + 1), 3)}`,
    count: 0,
  }));

  for (const value of values) {
    const rawIndex = width > 0 ? Math.floor((value - min) / width) : 0;
    const index = Math.max(0, Math.min(binCount - 1, rawIndex));
    bins[index].count += 1;
  }

  return bins;
};

const getNumericValues = (rows, featureName) => {
  return rows
    .map((row) => row[featureName])
    .filter((value) => typeof value === "number" && Number.isFinite(value));
};

const computeDataset = ({ headers, rows }) => {
  const timingFeatures = headers.filter((header) => !BASE_COLUMNS.includes(header));
  const holdFeatures = timingFeatures.filter((feature) => feature.startsWith("H."));
  const latencyFeatures = timingFeatures.filter(
    (feature) => feature.startsWith("DD.") || feature.startsWith("UD."),
  );
  const holdSet = new Set(holdFeatures);
  const latencySet = new Set(latencyFeatures);

  const subjectCounts = new Map();
  const sessionCounts = new Map();
  const repCounts = new Map();
  const subjectTiming = new Map();
  const negativeByFeature = new Map();

  let negativeValueCount = 0;
  let totalRowDuration = 0;
  let rowDurationCount = 0;

  for (const row of rows) {
    subjectCounts.set(row.subject, (subjectCounts.get(row.subject) ?? 0) + 1);
    sessionCounts.set(row.sessionIndex, (sessionCounts.get(row.sessionIndex) ?? 0) + 1);
    repCounts.set(row.rep, (repCounts.get(row.rep) ?? 0) + 1);

    let rowSum = 0;
    let rowValueCount = 0;
    let holdSum = 0;
    let holdCount = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const feature of timingFeatures) {
      const value = row[feature];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;

      rowSum += value;
      rowValueCount += 1;

      if (value < 0) {
        negativeValueCount += 1;
        negativeByFeature.set(feature, (negativeByFeature.get(feature) ?? 0) + 1);
      }

      if (holdSet.has(feature)) {
        holdSum += value;
        holdCount += 1;
      }

      if (latencySet.has(feature)) {
        latencySum += value;
        latencyCount += 1;
      }
    }

    if (rowValueCount > 0) {
      totalRowDuration += rowSum;
      rowDurationCount += 1;
    }

    const current = subjectTiming.get(row.subject) ?? {
      holdSum: 0,
      holdCount: 0,
      latencySum: 0,
      latencyCount: 0,
    };

    current.holdSum += holdSum;
    current.holdCount += holdCount;
    current.latencySum += latencySum;
    current.latencyCount += latencyCount;
    subjectTiming.set(row.subject, current);
  }

  const featureMeanComparison = timingFeatures.slice(0, 10).map((feature) => {
    const values = getNumericValues(rows, feature);
    const mean =
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return { feature, mean: round(mean, 4) };
  });

  const holdLatencyBySubject = [...subjectTiming.entries()]
    .map(([subject, value]) => ({
      subject,
      avgHold:
        value.holdCount > 0 ? round(value.holdSum / value.holdCount, 4) : 0,
      avgLatency:
        value.latencyCount > 0 ? round(value.latencySum / value.latencyCount, 4) : 0,
    }))
    .sort((a, b) => b.avgHold - a.avgHold);

  const maxScatterPoints = 600;
  const scatterStride = Math.max(1, Math.ceil(rows.length / maxScatterPoints));
  const scatterBySubject = [];
  for (let index = 0; index < rows.length; index += scatterStride) {
    const row = rows[index];
    if (
      typeof row["H.period"] === "number" &&
      typeof row["DD.period.t"] === "number" &&
      Number.isFinite(row["H.period"]) &&
      Number.isFinite(row["DD.period.t"])
    ) {
      scatterBySubject.push({
        subject: row.subject,
        hPeriod: round(row["H.period"], 4),
        ddPeriodT: round(row["DD.period.t"], 4),
      });
    }
  }

  return {
    meta: {
      datasetPath: env.dslDatasetPath,
      loadedAt: new Date().toISOString(),
      totalRows: rows.length,
      subjectCount: subjectCounts.size,
      sessionCount: sessionCounts.size,
      timingFeatureCount: timingFeatures.length,
    },
    cards: {
      totalRows: rows.length,
      subjectCount: subjectCounts.size,
      sessionCount: sessionCounts.size,
      timingFeatureCount: timingFeatures.length,
      negativeValueCount,
      avgRowDuration:
        rowDurationCount > 0 ? round(totalRowDuration / rowDurationCount, 4) : 0,
    },
    charts: {
      subjectDistribution: toCountArray(subjectCounts, "subject"),
      sessionDistribution: toCountArray(sessionCounts, "sessionIndex"),
      repetitionDistribution: toCountArray(repCounts, "rep"),
      holdLatencyBySubject,
      featureMeanComparison,
      hPeriodHistogram: getHistogram(getNumericValues(rows, "H.period"), 12),
      ddPeriodHistogram: getHistogram(getNumericValues(rows, "DD.period.t"), 12),
      udPeriodHistogram: getHistogram(getNumericValues(rows, "UD.period.t"), 12),
      negativeValueByFeature: toCountArray(negativeByFeature, "feature"),
      scatterBySubject,
    },
  };
};

const loadDatasetFromFile = async () => {
  let rawText = FALLBACK_CSV;

  if (env.dslDatasetPath) {
    try {
      rawText = await readFile(env.dslDatasetPath, "utf8");
    } catch {
      rawText = FALLBACK_CSV;
    }
  }

  const parsed = parseCsv(rawText);
  return computeDataset(parsed);
};

export const getDslAnalysis = async ({ top = 15 } = {}) => {
  if (!cache) {
    cache = await loadDatasetFromFile();
  }

  const positiveTop = Math.min(Math.max(Number(top) || 15, 5), 50);

  return {
    ...cache,
    charts: {
      ...cache.charts,
      subjectDistribution: cache.charts.subjectDistribution.slice(0, positiveTop),
      holdLatencyBySubject: cache.charts.holdLatencyBySubject.slice(0, positiveTop),
      negativeValueByFeature: cache.charts.negativeValueByFeature.slice(0, positiveTop),
    },
  };
};

export const reloadDslAnalysis = async () => {
  cache = await loadDatasetFromFile();
  return cache.meta;
};
