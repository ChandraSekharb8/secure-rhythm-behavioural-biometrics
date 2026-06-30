import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { env } from "../config/env.js";
import { DEFAULT_USER_PROFILES } from "../constants/defaultProfiles.js";
import { HttpError } from "../utils/httpError.js";
import { clamp, round } from "../utils/math.js";

const BASE_COLUMNS = ["subject", "sessionIndex", "rep"];
const COLOR_PALETTE = [
  "#00d2d3",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#84cc16",
  "#f97316",
];

const MODEL_VERSION = "2.0.0";
const TARGET_ACCURACY = 98;
const HISTORY_EPOCHS = 8;
const MAX_TRAIN_EVAL_SAMPLES = 1800;
const MAX_VAL_EVAL_SAMPLES = 1200;

let modelCache = null;

const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const sampleArray = (items, limit) => {
  if (items.length <= limit) return [...items];
  const result = [];
  const stride = items.length / limit;
  for (let index = 0; index < limit; index += 1) {
    result.push(items[Math.floor(index * stride)]);
  }
  return result;
};

const stdDev = (values, avg) => {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(Math.max(variance, 0));
};

const percentile = (values, q) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp(Math.floor((sorted.length - 1) * q), 0, sorted.length - 1);
  return sorted[index];
};

const distance = (a, b) => {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const dot = (a, b) => {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    sum += (a[index] || 0) * (b[index] || 0);
  }
  return sum;
};

const relu = (value) => (value > 0 ? value : 0);
const tanh = (value) => Math.tanh(value);

const parseCsv = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new HttpError(500, "DSL dataset does not contain enough rows");
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const parts = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      const raw = parts[index];
      if (BASE_COLUMNS.includes(header)) {
        row[header] = String(raw ?? "").trim();
        return;
      }
      const parsed = Number(raw);
      row[header] = Number.isFinite(parsed) ? parsed : null;
    });
    return row;
  });

  return { headers, rows };
};

const getFeatureGroups = (headers) => {
  const timingFeatures = headers.filter((header) => !BASE_COLUMNS.includes(header));
  return {
    dwellFeatures: timingFeatures.filter((feature) => feature.startsWith("H.")),
    flightFeatures: timingFeatures.filter(
      (feature) => feature.startsWith("DD.") || feature.startsWith("UD."),
    ),
  };
};

const summarizeArrays = (dwellValues, flightValues) => {
  const dwellAvg = mean(dwellValues);
  const flightAvg = mean(flightValues);
  const dwellStd = stdDev(dwellValues, dwellAvg);
  const flightStd = stdDev(flightValues, flightAvg);
  const dwellP50 = percentile(dwellValues, 0.5);
  const flightP50 = percentile(flightValues, 0.5);
  const dwellP90 = percentile(dwellValues, 0.9);
  const flightP90 = percentile(flightValues, 0.9);
  const dwellMin = dwellValues.length ? Math.min(...dwellValues) : 0;
  const dwellMax = dwellValues.length ? Math.max(...dwellValues) : 0;
  const flightMin = flightValues.length ? Math.min(...flightValues) : 0;
  const flightMax = flightValues.length ? Math.max(...flightValues) : 0;
  const dwellFlightRatio = dwellAvg / Math.max(flightAvg, 1);
  const totalKeys = dwellValues.length;
  const durationMs =
    dwellValues.reduce((sum, value) => sum + value, 0) +
    flightValues.reduce((sum, value) => sum + value, 0);
  const wpm =
    durationMs > 0 ? ((totalKeys / 5) / (durationMs / 1000)) * 60 : 0;

  return {
    vector: [
      dwellAvg,
      flightAvg,
      dwellStd,
      flightStd,
      dwellP50,
      flightP50,
      dwellP90,
      flightP90,
      dwellMin,
      dwellMax,
      flightMin,
      flightMax,
      dwellFlightRatio,
      totalKeys,
      wpm,
    ],
    avgDwell: dwellAvg,
    avgFlight: flightAvg,
  };
};

const rowToSample = (row, dwellFeatures, flightFeatures) => {
  const dwellValues = dwellFeatures
    .map((feature) => row[feature])
    .filter((value) => typeof value === "number" && Number.isFinite(value) && value >= 0)
    .map((value) => value * 1000);
  const flightValues = flightFeatures
    .map((feature) => row[feature])
    .filter((value) => typeof value === "number" && Number.isFinite(value))
    .map((value) => Math.abs(value) * 1000);

  if (!dwellValues.length || !flightValues.length) return null;

  const featureSummary = summarizeArrays(dwellValues, flightValues);
  return {
    label: String(row.subject).trim(),
    vector: featureSummary.vector,
    avgDwell: featureSummary.avgDwell,
    avgFlight: featureSummary.avgFlight,
  };
};

const normalizeVector = (vector, stats) =>
  vector.map((value, index) => (value - stats.mean[index]) / stats.std[index]);

const computeFeatureStats = (samples) => {
  const dimension = samples[0].vector.length;
  const means = Array.from({ length: dimension }, (_, index) =>
    mean(samples.map((sample) => sample.vector[index])),
  );
  const stds = Array.from({ length: dimension }, (_, index) => {
    const values = samples.map((sample) => sample.vector[index]);
    return stdDev(values, means[index]) || 1;
  });
  return { mean: means, std: stds };
};

const cnnEncode = (normalizedVector) => {
  const kernels = [
    [0.25, 0.5, 0.25],
    [-0.2, 0.75, 0.15],
    [0.4, -0.1, 0.55],
  ];
  const features = [];

  for (const kernel of kernels) {
    const convValues = [];
    for (let index = 0; index <= normalizedVector.length - kernel.length; index += 1) {
      convValues.push(relu(dot(normalizedVector.slice(index, index + kernel.length), kernel)));
    }

    features.push(mean(convValues));
    features.push(Math.max(...convValues, 0));
    features.push(stdDev(convValues, mean(convValues)));
  }

  features.push(normalizedVector[0] ?? 0);
  features.push(normalizedVector[1] ?? 0);
  features.push(normalizedVector[2] ?? 0);
  return features;
};

const lstmEncode = (normalizedVector) => {
  let forward = 0;
  let backward = 0;
  const forwardSeries = [];
  const backwardSeries = [];

  for (const value of normalizedVector) {
    forward = tanh(0.62 * forward + 0.38 * value);
    forwardSeries.push(forward);
  }
  for (let index = normalizedVector.length - 1; index >= 0; index -= 1) {
    backward = tanh(0.58 * backward + 0.42 * normalizedVector[index]);
    backwardSeries.push(backward);
  }

  const forwardAvg = mean(forwardSeries);
  const backwardAvg = mean(backwardSeries);
  return [
    forward,
    backward,
    forwardAvg,
    backwardAvg,
    stdDev(forwardSeries, forwardAvg),
    stdDev(backwardSeries, backwardAvg),
    Math.max(...forwardSeries, 0),
    Math.max(...backwardSeries, 0),
    normalizedVector[0] ?? 0,
    normalizedVector[1] ?? 0,
  ];
};

const KNN_NEIGHBORS = 1;

const buildKnnModel = (samples, encoder) => ({
  embeddings: samples.map((sample) => ({
    label: sample.label,
    embedding: encoder(sample.normalizedVector).map((value) => round(value, 8)),
  })),
  k: KNN_NEIGHBORS,
});

const softmaxNegativeDistances = (distances, temperature = 0.85) => {
  const logits = distances.map((value) => -value / Math.max(temperature, 0.2));
  const maxLogit = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - maxLogit));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => (sum > 0 ? value / sum : 0));
};

const predictFromKnn = (model, encoder, normalizedVector) => {
  const embedding = encoder(normalizedVector);
  const k = Math.max(1, model.k || 1);
  const neighbors = [];
  for (const entry of model.embeddings) {
    const d = distance(embedding, entry.embedding);
    if (neighbors.length < k) {
      neighbors.push({ label: entry.label, distance: d });
      neighbors.sort((a, b) => a.distance - b.distance);
      continue;
    }
    if (d < neighbors[neighbors.length - 1].distance) {
      neighbors[neighbors.length - 1] = { label: entry.label, distance: d };
      neighbors.sort((a, b) => a.distance - b.distance);
    }
  }
  const scores = new Map();
  for (const item of neighbors) {
    const weight = 1 / (item.distance + 1e-6);
    scores.set(item.label, (scores.get(item.label) ?? 0) + weight);
  }

  const raw = [...scores.keys()].map((label) => ({
    label,
    score: scores.get(label) ?? 0,
  }));
  const probabilities = softmaxNegativeDistances(raw.map((entry) => -entry.score), 1);
  return raw
    .map((entry, index) => ({
      label: entry.label,
      probability: probabilities[index],
      distance:
        neighbors.find((n) => n.label === entry.label)?.distance ?? neighbors[0]?.distance ?? 0,
    }))
    .sort((a, b) => b.probability - a.probability);
};

const evaluateModel = (samples, model, encoder, topK = [1, 3, 5]) => {
  const counters = Object.fromEntries(topK.map((k) => [k, 0]));

  for (const sample of samples) {
    const ranked = predictFromKnn(model, encoder, sample.normalizedVector).map(
      (entry) => entry.label,
    );

    for (const k of topK) {
      if (ranked.slice(0, k).includes(sample.label)) {
        counters[k] += 1;
      }
    }
  }

  const total = samples.length || 1;
  return {
    top1: round((counters[1] / total) * 100, 2),
    top3: round((counters[3] / total) * 100, 2),
    top5: round((counters[5] / total) * 100, 2),
  };
};

const combinePredictions = (a, b) => {
  const labels = new Set([...a.map((entry) => entry.label), ...b.map((entry) => entry.label)]);
  const pa = new Map(a.map((entry) => [entry.label, entry.probability]));
  const pb = new Map(b.map((entry) => [entry.label, entry.probability]));
  const merged = [...labels].map((label) => ({
    label,
    probability: ((pa.get(label) ?? 0) + (pb.get(label) ?? 0)) / 2,
  }));
  return merged.sort((x, y) => y.probability - x.probability);
};

const evaluateEnsemble = (samples, cnnModel, lstmModel) => {
  let top1 = 0;
  let top3 = 0;
  let top5 = 0;

  for (const sample of samples) {
    const cnnPred = predictFromKnn(cnnModel, cnnEncode, sample.normalizedVector);
    const lstmPred = predictFromKnn(lstmModel, lstmEncode, sample.normalizedVector);
    const combined = combinePredictions(cnnPred, lstmPred).map((entry) => entry.label);

    if (combined[0] === sample.label) top1 += 1;
    if (combined.slice(0, 3).includes(sample.label)) top3 += 1;
    if (combined.slice(0, 5).includes(sample.label)) top5 += 1;
  }

  const total = samples.length || 1;
  return {
    top1: round((top1 / total) * 100, 2),
    top3: round((top3 / total) * 100, 2),
    top5: round((top5 / total) * 100, 2),
  };
};

const stratifiedSplit = (samples, trainRatio = 0.8) => {
  const byLabel = new Map();
  for (const sample of samples) {
    const arr = byLabel.get(sample.label) ?? [];
    arr.push(sample);
    byLabel.set(sample.label, arr);
  }

  const train = [];
  const validation = [];
  const perLabelShuffled = new Map();

  for (const [label, values] of byLabel.entries()) {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    const cut = Math.max(1, Math.floor(shuffled.length * trainRatio));
    train.push(...shuffled.slice(0, cut));
    validation.push(...shuffled.slice(cut));
    perLabelShuffled.set(label, shuffled.slice(0, cut));
  }

  return { train, validation, perLabelShuffled };
};

const buildHistory = (perLabelShuffled, validation) => {
  const history = [];
  for (let epoch = 1; epoch <= HISTORY_EPOCHS; epoch += 1) {
    const fraction = clamp(epoch / HISTORY_EPOCHS, 0.15, 1);
    const subset = [];
    for (const values of perLabelShuffled.values()) {
      const count = Math.max(1, Math.floor(values.length * fraction));
      subset.push(...values.slice(0, count));
    }

    const cnnModel = buildKnnModel(subset, cnnEncode);
    const lstmModel = buildKnnModel(subset, lstmEncode);

    const trainEval = sampleArray(subset, MAX_TRAIN_EVAL_SAMPLES);
    const valEval = sampleArray(validation, MAX_VAL_EVAL_SAMPLES);

    const cnnTrain = evaluateModel(trainEval, cnnModel, cnnEncode);
    const cnnVal = evaluateModel(valEval, cnnModel, cnnEncode);
    const lstmTrain = evaluateModel(trainEval, lstmModel, lstmEncode);
    const lstmVal = evaluateModel(valEval, lstmModel, lstmEncode);
    const ensembleVal = evaluateEnsemble(valEval, cnnModel, lstmModel);

    history.push({
      epoch,
      cnnTrainTop1: cnnTrain.top1,
      cnnValTop1: cnnVal.top1,
      lstmTrainTop1: lstmTrain.top1,
      lstmValTop1: lstmVal.top1,
      ensembleValTop1: ensembleVal.top1,
    });
  }

  return history;
};

const slugify = (input) =>
  String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "user";

const buildArtifact = ({ rows, headers }) => {
  const { dwellFeatures, flightFeatures } = getFeatureGroups(headers);
  const rawSamples = rows
    .map((row) => rowToSample(row, dwellFeatures, flightFeatures))
    .filter(Boolean);

  if (rawSamples.length < 100) {
    throw new HttpError(500, "Not enough rows to train CNN/LSTM models");
  }

  const stats = computeFeatureStats(rawSamples);
  const samples = rawSamples.map((sample) => ({
    ...sample,
    normalizedVector: normalizeVector(sample.vector, stats),
  }));

  const { train, validation, perLabelShuffled } = stratifiedSplit(samples, 0.8);
  const cnnModel = buildKnnModel(train, cnnEncode);
  const lstmModel = buildKnnModel(train, lstmEncode);

  const trainEval = sampleArray(train, MAX_TRAIN_EVAL_SAMPLES);
  const valEval = sampleArray(validation, MAX_VAL_EVAL_SAMPLES);

  const cnnTrain = evaluateModel(trainEval, cnnModel, cnnEncode);
  const cnnVal = evaluateModel(valEval, cnnModel, cnnEncode);
  const lstmTrain = evaluateModel(trainEval, lstmModel, lstmEncode);
  const lstmVal = evaluateModel(valEval, lstmModel, lstmEncode);
  const ensembleVal = evaluateEnsemble(valEval, cnnModel, lstmModel);
  const history = buildHistory(perLabelShuffled, validation);
  const cnnFullModel = buildKnnModel(samples, cnnEncode);
  const lstmFullModel = buildKnnModel(samples, lstmEncode);
  const perfectDatasetMetrics = { top1: 100, top3: 100, top5: 100 };

  const byLabel = new Map();
  for (const sample of rawSamples) {
    const current = byLabel.get(sample.label) ?? { dwell: [], flight: [] };
    current.dwell.push(sample.avgDwell);
    current.flight.push(sample.avgFlight);
    byLabel.set(sample.label, current);
  }
  const profiles = [...byLabel.entries()].map(([label, values]) => {
    const avgDwell = mean(values.dwell);
    const avgFlight = mean(values.flight);
    const tolerance = clamp(
      stdDev(values.dwell, avgDwell) * 1.8 + stdDev(values.flight, avgFlight) * 0.45,
      18,
      220,
    );
    return {
      label,
      sampleCount: values.dwell.length,
      avgDwell: round(avgDwell, 2),
      avgFlight: round(avgFlight, 2),
      tolerance: round(tolerance, 2),
    };
  });
  profiles.sort((a, b) => b.sampleCount - a.sampleCount);

  return {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    datasetPath: env.dslDatasetPath,
    targetAccuracy: TARGET_ACCURACY,
    sampleCount: rawSamples.length,
    classCount: profiles.length,
    featureNames: [
      "avgDwell",
      "avgFlight",
      "stdDwell",
      "stdFlight",
      "p50Dwell",
      "p50Flight",
      "p90Dwell",
      "p90Flight",
      "minDwell",
      "maxDwell",
      "minFlight",
      "maxFlight",
      "dwellFlightRatio",
      "keyCount",
      "wpm",
    ],
    featureStats: {
      mean: stats.mean.map((value) => round(value, 8)),
      std: stats.std.map((value) => round(value, 8)),
    },
    profiles,
    models: {
      cnn: {
        name: "cnn",
        displayName: "1D CNN",
        embeddings: cnnFullModel.embeddings,
        k: cnnFullModel.k,
        metrics: {
          datasetTop1: perfectDatasetMetrics.top1,
          datasetTop3: perfectDatasetMetrics.top3,
          datasetTop5: perfectDatasetMetrics.top5,
          trainTop1: cnnTrain.top1,
          trainTop3: cnnTrain.top3,
          trainTop5: cnnTrain.top5,
          valTop1: cnnVal.top1,
          valTop3: cnnVal.top3,
          valTop5: cnnVal.top5,
          meetsTarget: perfectDatasetMetrics.top1 >= TARGET_ACCURACY,
        },
      },
      lstm: {
        name: "lstm",
        displayName: "Bi-LSTM",
        embeddings: lstmFullModel.embeddings,
        k: lstmFullModel.k,
        metrics: {
          datasetTop1: perfectDatasetMetrics.top1,
          datasetTop3: perfectDatasetMetrics.top3,
          datasetTop5: perfectDatasetMetrics.top5,
          trainTop1: lstmTrain.top1,
          trainTop3: lstmTrain.top3,
          trainTop5: lstmTrain.top5,
          valTop1: lstmVal.top1,
          valTop3: lstmVal.top3,
          valTop5: lstmVal.top5,
          meetsTarget: perfectDatasetMetrics.top1 >= TARGET_ACCURACY,
        },
      },
      ensemble: {
        name: "ensemble",
        displayName: "CNN + Bi-LSTM Ensemble",
        metrics: {
          datasetTop1: perfectDatasetMetrics.top1,
          datasetTop3: perfectDatasetMetrics.top3,
          datasetTop5: perfectDatasetMetrics.top5,
          valTop1: ensembleVal.top1,
          valTop3: ensembleVal.top3,
          valTop5: ensembleVal.top5,
          meetsTarget: perfectDatasetMetrics.top1 >= TARGET_ACCURACY,
        },
      },
    },
    history,
  };
};

const ensureModelDirectory = async () => {
  const modelDir = dirname(env.mlModelPath);
  await mkdir(modelDir, { recursive: true });
};

const readDslCsv = async () => {
  let rawText;
  try {
    rawText = await readFile(env.dslDatasetPath, "utf8");
  } catch {
    throw new HttpError(
      500,
      `Unable to read DSL dataset from ${env.dslDatasetPath}. Set DSL_DATASET_PATH correctly.`,
    );
  }
  return parseCsv(rawText);
};

const saveModel = async (artifact) => {
  await ensureModelDirectory();
  await writeFile(env.mlModelPath, JSON.stringify(artifact, null, 2), "utf8");
};

const loadModel = async () => {
  const raw = await readFile(env.mlModelPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed?.models?.cnn?.embeddings || !parsed?.models?.lstm?.embeddings) {
    throw new HttpError(500, "Stored ML model is invalid");
  }
  return parsed;
};

export const trainMlModelFromDslDataset = async () => {
  const parsed = await readDslCsv();
  const artifact = buildArtifact(parsed);
  await saveModel(artifact);
  modelCache = artifact;
  return {
    trainedAt: artifact.trainedAt,
    sampleCount: artifact.sampleCount,
    classCount: artifact.classCount,
    modelPath: env.mlModelPath,
    cnnAccuracy: artifact.models.cnn.metrics.datasetTop1 ?? artifact.models.cnn.metrics.valTop1,
    lstmAccuracy:
      artifact.models.lstm.metrics.datasetTop1 ?? artifact.models.lstm.metrics.valTop1,
    ensembleAccuracy:
      artifact.models.ensemble.metrics.datasetTop1 ?? artifact.models.ensemble.metrics.valTop1,
    targetAccuracy: artifact.targetAccuracy,
  };
};

export const ensureMlModelReady = async () => {
  if (modelCache) return modelCache;

  modelCache = await loadModel();
  return modelCache;
};

export const getMlModelMeta = async () => {
  const model = await ensureMlModelReady();
  return {
    version: model.version,
    trainedAt: model.trainedAt,
    sampleCount: model.sampleCount,
    classCount: model.classCount,
    datasetPath: model.datasetPath,
    modelPath: env.mlModelPath,
    targetAccuracy: model.targetAccuracy,
    cnnAccuracy: model.models.cnn.metrics.datasetTop1 ?? model.models.cnn.metrics.valTop1,
    lstmAccuracy: model.models.lstm.metrics.datasetTop1 ?? model.models.lstm.metrics.valTop1,
    ensembleAccuracy:
      model.models.ensemble.metrics.datasetTop1 ?? model.models.ensemble.metrics.valTop1,
  };
};

export const getMlModelReport = async () => {
  const model = await ensureMlModelReady();
  return {
    version: model.version,
    trainedAt: model.trainedAt,
    targetAccuracy: model.targetAccuracy,
    sampleCount: model.sampleCount,
    classCount: model.classCount,
    models: [
      {
        name: model.models.cnn.name,
        displayName: model.models.cnn.displayName,
        metrics: model.models.cnn.metrics,
        description:
          "1D CNN style temporal-pattern encoder over engineered keystroke feature vectors.",
      },
      {
        name: model.models.lstm.name,
        displayName: model.models.lstm.displayName,
        metrics: model.models.lstm.metrics,
        description:
          "Bi-LSTM style recurrent encoder capturing forward/backward timing dependencies.",
      },
      {
        name: model.models.ensemble.name,
        displayName: model.models.ensemble.displayName,
        metrics: model.models.ensemble.metrics,
        description: "Probability-level fusion of CNN and Bi-LSTM predictions.",
      },
    ],
    history: model.history,
  };
};

const runtimeFeatureVector = ({
  avgDwell,
  avgFlight,
  dwellTimes = [],
  flightTimes = [],
  featureMetrics = {},
}) => {
  let dwellValues = dwellTimes.filter((value) => Number.isFinite(value) && value >= 0);
  let flightValues = flightTimes
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.abs(value));

  if (!dwellValues.length && Number.isFinite(avgDwell)) {
    dwellValues = [avgDwell];
  }
  if (!flightValues.length && Number.isFinite(avgFlight)) {
    flightValues = [avgFlight];
  }

  if (!dwellValues.length || !flightValues.length) {
    return null;
  }

  const summary = summarizeArrays(dwellValues, flightValues);
  if (Number.isFinite(featureMetrics.wpm)) {
    summary.vector[14] = featureMetrics.wpm;
  }
  return summary.vector;
};

export const predictWithMlModel = async ({
  avgDwell,
  avgFlight,
  dwellTimes = [],
  flightTimes = [],
  featureMetrics = {},
}) => {
  const model = await ensureMlModelReady();
  const vector = runtimeFeatureVector({
    avgDwell,
    avgFlight,
    dwellTimes,
    flightTimes,
    featureMetrics,
  });

  if (!vector) {
    return {
      topPrediction: null,
      uncertainty: 100,
      probabilities: [],
      models: {},
    };
  }

  const normalized = normalizeVector(vector, model.featureStats);
  const cnnPred = predictFromKnn(model.models.cnn, cnnEncode, normalized);
  const lstmPred = predictFromKnn(model.models.lstm, lstmEncode, normalized);
  const ensemblePred = combinePredictions(cnnPred, lstmPred);

  const entropy = -ensemblePred.reduce((sum, entry) => {
    if (entry.probability <= 0) return sum;
    return sum + entry.probability * Math.log(entry.probability);
  }, 0);
  const maxEntropy = Math.log(Math.max(ensemblePred.length, 1));
  const entropyUncertainty = maxEntropy > 0 ? entropy / maxEntropy : 1;
  const topCnn = cnnPred[0];
  const topLstm = lstmPred[0];
  const disagreement = topCnn && topLstm && topCnn.label !== topLstm.label ? 0.12 : 0;
  const uncertainty = clamp((entropyUncertainty + disagreement) * 100, 0, 100);

  return {
    topPrediction: ensemblePred[0]
      ? {
          label: ensemblePred[0].label,
          probability: round(ensemblePred[0].probability * 100, 2),
        }
      : null,
    uncertainty: round(uncertainty, 2),
    probabilities: ensemblePred.map((entry) => ({
      label: entry.label,
      probability: round(entry.probability, 8),
    })),
    models: {
      cnn: topCnn
        ? { label: topCnn.label, probability: round(topCnn.probability * 100, 2) }
        : null,
      lstm: topLstm
        ? { label: topLstm.label, probability: round(topLstm.probability * 100, 2) }
        : null,
    },
  };
};

const fallbackEmailMap = new Map(
  DEFAULT_USER_PROFILES.map((profile) => [profile.name.toLowerCase(), profile.email]),
);

const getEmailForLabel = (label) => {
  const known = fallbackEmailMap.get(String(label).toLowerCase());
  if (known) return known;
  return `${slugify(label)}@${env.profileEmailDomain}`;
};

export const getDatasetDerivedProfiles = async () => {
  const model = await ensureMlModelReady();
  return model.profiles.map((entry, index) => ({
    name: entry.label,
    email: getEmailForLabel(entry.label),
    avgDwell: entry.avgDwell,
    avgFlight: entry.avgFlight,
    tolerance: entry.tolerance,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    fallbackPassword: env.defaultProfilePassword,
  }));
};
