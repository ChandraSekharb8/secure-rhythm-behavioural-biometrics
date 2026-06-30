import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Database, BarChart3, FileText, Workflow, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { fetchDslAnalysis, fetchMlModelReport, type DslAnalysisData, type MlModelReport } from "@/lib/api";

const EMPTY_DATA: DslAnalysisData = {
  meta: {
    datasetPath: "",
    loadedAt: "",
    totalRows: 0,
    subjectCount: 0,
    sessionCount: 0,
    timingFeatureCount: 0,
  },
  cards: {
    totalRows: 0,
    subjectCount: 0,
    sessionCount: 0,
    timingFeatureCount: 0,
    negativeValueCount: 0,
    avgRowDuration: 0,
  },
  charts: {
    subjectDistribution: [],
    sessionDistribution: [],
    repetitionDistribution: [],
    holdLatencyBySubject: [],
    featureMeanComparison: [],
    hPeriodHistogram: [],
    ddPeriodHistogram: [],
    udPeriodHistogram: [],
    negativeValueByFeature: [],
    scatterBySubject: [],
  },
};

const EMPTY_MODEL_REPORT: MlModelReport = {
  version: "0.0.0",
  trainedAt: "",
  targetAccuracy: 98,
  sampleCount: 0,
  classCount: 0,
  models: [],
  history: [],
};

const COLORS = [
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

const implementationModules = [
  {
    title: "Data Collection",
    description: "Captures keystroke dwell and flight timings from user sessions and DSL dataset rows.",
  },
  {
    title: "Preprocessing",
    description: "Computes timing aggregates, feature means, histograms, and normalization-ready metrics.",
  },
  {
    title: "Modeling Pipeline",
    description: "Supports CNN + Bi-LSTM style behavioral flow with profile-driven timing identification.",
  },
  {
    title: "Uncertainty Authentication",
    description: "Confidence threshold check triggers fallback password verification on low confidence.",
  },
  {
    title: "Evaluation",
    description: "Presents 10 analysis views covering distributions, trends, latency, and quality signals.",
  },
  {
    title: "Deployment",
    description: "Integrated frontend + Node/Express + MongoDB backend with live API-powered dashboards.",
  },
];

const tooltipStyle = {
  backgroundColor: "hsl(215 40% 12% / 0.95)",
  border: "1px solid hsl(215 30% 25%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(200 100% 95%)",
};

const chartCard = (
  title: string,
  description: string,
  delay: number,
  content: React.ReactNode,
) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-5"
  >
    <h3 className="font-display text-sm text-foreground tracking-wider">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1 mb-3">{description}</p>
    <div className="h-64">{content}</div>
  </motion.div>
);

const AnalysisPage = () => {
  const [topCount, setTopCount] = useState(15);

  const { data = EMPTY_DATA, isLoading, isError, error } = useQuery({
    queryKey: ["dsl-analysis", topCount],
    queryFn: () => fetchDslAnalysis(topCount),
  });

  const { data: modelReport = EMPTY_MODEL_REPORT } = useQuery({
    queryKey: ["ml-model-report-analysis"],
    queryFn: fetchMlModelReport,
  });

  const scatterGroups = useMemo(() => {
    const groups = new Map<string, Array<{ subject: string; hPeriod: number; ddPeriodT: number }>>();

    for (const item of data.charts.scatterBySubject) {
      const current = groups.get(item.subject) ?? [];
      current.push(item);
      groups.set(item.subject, current);
    }

    return [...groups.entries()];
  }, [data.charts.scatterBySubject]);

  return (
    <div className="min-h-screen cyber-gradient relative">
      <ParticleBackground />
      <Navbar />

      <section className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="section-title">
            DSL Dataset <span className="text-gradient">Analysis (10 Views)</span>
          </h1>
          <p className="section-subtitle">
            Backend-driven analysis using the full `DSL-StrongPasswordData.csv` dataset.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="glass-card px-3 py-2 text-xs text-muted-foreground">
              Loaded: {data.meta.loadedAt ? new Date(data.meta.loadedAt).toLocaleString() : "-"}
            </div>
            <div className="glass-card px-3 py-2 text-xs text-muted-foreground">
              Source: {data.meta.datasetPath || "-"}
            </div>
            <div className="glass-card px-3 py-2 text-xs text-muted-foreground">
              <label className="mr-2">Top subjects/features</label>
              <select
                value={topCount}
                onChange={(event) => setTopCount(Number(event.target.value))}
                className="bg-muted/50 border border-border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground mt-3">Loading analysis...</p>}
          {isError && (
            <p className="text-sm text-destructive mt-3">
              {error instanceof Error ? error.message : "Failed to load DSL analysis"}
            </p>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm text-foreground tracking-wider">ABSTRACT</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This system delivers secure, continuous authentication using keystroke dynamics.
              Instead of relying only on static passwords, it learns each user&apos;s typing rhythm
              through dwell and flight timings. Low-confidence decisions are handled by fallback
              verification to balance security and usability.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm text-foreground tracking-wider">IMPLEMENTATION FLOW</h2>
            </div>
            <div className="space-y-2">
              {[
                "Collect keystroke events and compute dwell/flight timings",
                "Extract and aggregate timing features from complete dataset rows",
                "Identify user pattern and calculate confidence score",
                "Trigger fallback verification when confidence is low",
              ].map((item) => (
                <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {modelReport.models.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + index * 0.03 }}
              className="glass-card p-4"
            >
              <p className="text-xs text-primary font-display tracking-wider">{model.displayName}</p>
              <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {typeof model.metrics.datasetTop1 === "number" && (
                  <p>
                    Dataset Top-1: <span className="text-foreground">{model.metrics.datasetTop1.toFixed(2)}%</span>
                  </p>
                )}
                <p>Val Top-1: <span className="text-foreground">{model.metrics.valTop1.toFixed(2)}%</span></p>
                <p>Val Top-3: <span className="text-foreground">{model.metrics.valTop3.toFixed(2)}%</span></p>
                <p>Val Top-5: <span className="text-foreground">{model.metrics.valTop5.toFixed(2)}%</span></p>
                {typeof model.metrics.trainTop1 === "number" && (
                  <p>Train Top-1: <span className="text-foreground">{model.metrics.trainTop1.toFixed(2)}%</span></p>
                )}
                <p
                  className={
                    model.metrics.meetsTarget ? "text-primary" : "text-amber-400"
                  }
                >
                  {model.metrics.meetsTarget
                    ? `Meets ${modelReport.targetAccuracy}% target`
                    : `Below ${modelReport.targetAccuracy}% target`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {chartCard(
          "MODEL TRAINING ACCURACY CURVES",
          "CNN, Bi-LSTM, and ensemble Top-1 accuracy across training epochs.",
          0.03,
          <ResponsiveContainer>
            <LineChart data={modelReport.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
              <XAxis dataKey="epoch" stroke="hsl(210 20% 55%)" fontSize={10} />
              <YAxis stroke="hsl(210 20% 55%)" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line dataKey="cnnTrainTop1" stroke="#22d3ee" strokeWidth={2} dot={false} name="CNN Train" />
              <Line dataKey="cnnValTop1" stroke="#00d2d3" strokeWidth={2} dot={false} name="CNN Val" />
              <Line dataKey="lstmTrainTop1" stroke="#a78bfa" strokeWidth={2} dot={false} name="LSTM Train" />
              <Line dataKey="lstmValTop1" stroke="#8b5cf6" strokeWidth={2} dot={false} name="LSTM Val" />
              <Line dataKey="ensembleValTop1" stroke="#10b981" strokeWidth={2} dot={false} name="Ensemble Val" />
            </LineChart>
          </ResponsiveContainer>,
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {implementationModules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.03 }}
              className="glass-card p-4"
            >
              <p className="text-xs text-primary font-display tracking-wider mb-1">MODULE {index + 1}</p>
              <p className="text-sm text-foreground font-display mb-1">{module.title}</p>
              <p className="text-xs text-muted-foreground">{module.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Rows</p>
            <p className="text-2xl font-display text-foreground">{data.cards.totalRows}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-2xl font-display text-foreground">{data.cards.subjectCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-2xl font-display text-foreground">{data.cards.sessionCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Timing Features</p>
            <p className="text-2xl font-display text-foreground">{data.cards.timingFeatureCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Negative Timing Values</p>
            <p className="text-2xl font-display text-destructive">{data.cards.negativeValueCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Avg Row Duration</p>
            <p className="text-2xl font-display text-primary">{data.cards.avgRowDuration}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {chartCard(
            "1) Samples Per Subject",
            "How many rows each subject contributes.",
            0.05,
            <ResponsiveContainer>
              <BarChart data={data.charts.subjectDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="subject" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#00d2d3" />
              </BarChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "2) Samples Per Session Index",
            "Distribution of rows by `sessionIndex`.",
            0.08,
            <ResponsiveContainer>
              <BarChart data={data.charts.sessionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="sessionIndex" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "3) Samples Per Repetition",
            "Distribution of rows by `rep`.",
            0.11,
            <ResponsiveContainer>
              <BarChart data={data.charts.repetitionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="rep" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "4) Hold Vs Latency By Subject",
            "Average hold timings (`H.*`) against latency timings (`DD.*`, `UD.*`).",
            0.14,
            <ResponsiveContainer>
              <BarChart data={data.charts.holdLatencyBySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="subject" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="avgHold" name="Avg Hold" fill="#eab308" />
                <Bar dataKey="avgLatency" name="Avg Latency" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "5) Mean Of Top Features",
            "Mean value across the first 10 timing features.",
            0.17,
            <ResponsiveContainer>
              <LineChart data={data.charts.featureMeanComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="feature" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line dataKey="mean" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "6) Histogram: H.period",
            "Frequency distribution for key hold period.",
            0.2,
            <ResponsiveContainer>
              <AreaChart data={data.charts.hPeriodHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="bin" stroke="hsl(210 20% 55%)" fontSize={9} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#00d2d3" fill="#00d2d333" />
              </AreaChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "7) Histogram: DD.period.t",
            "Frequency distribution for down-down latency.",
            0.23,
            <ResponsiveContainer>
              <AreaChart data={data.charts.ddPeriodHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="bin" stroke="hsl(210 20% 55%)" fontSize={9} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f633" />
              </AreaChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "8) Histogram: UD.period.t",
            "Frequency distribution for up-down latency.",
            0.26,
            <ResponsiveContainer>
              <AreaChart data={data.charts.udPeriodHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="bin" stroke="hsl(210 20% 55%)" fontSize={9} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf633" />
              </AreaChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "9) Negative Values By Feature",
            "Features with highest negative timing counts.",
            0.29,
            <ResponsiveContainer>
              <BarChart data={data.charts.negativeValueByFeature}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="feature" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>,
          )}

          {chartCard(
            "10) Scatter: H.period vs DD.period.t",
            "Sampled points from the full dataset.",
            0.32,
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="hPeriod" name="H.period" stroke="hsl(210 20% 55%)" fontSize={10} />
                <YAxis
                  dataKey="ddPeriodT"
                  name="DD.period.t"
                  stroke="hsl(210 20% 55%)"
                  fontSize={10}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                {scatterGroups.map(([subject, points], index) => (
                  <Scatter
                    key={subject}
                    name={subject}
                    data={points}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>,
          )}
        </div>

        <div className="glass-card p-4 mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Backend is using all rows from the DSL dataset file and returning computed aggregates.
          <BarChart3 className="w-4 h-4 text-primary ml-auto" />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AnalysisPage;
