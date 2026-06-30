import { motion } from "framer-motion";
import { BarChart3, Activity, TrendingUp, Users } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { fetchDashboardData, fetchMlModelReport, type DashboardData, type MlModelReport } from "@/lib/api";

const EMPTY_DASHBOARD_DATA: DashboardData = {
  users: [],
  colors: {},
  dwellData: [],
  flightData: [],
  comparisonData: [],
  confidenceData: [],
  clusterData: [],
  resultDistribution: [],
  featureTrendData: [],
  tenSecondMatchByUser: [],
  featureAverages: [],
  sampleCount: 0,
  updatedAt: new Date(0).toISOString(),
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

const GraphPage = () => {
  const {
    data = EMPTY_DASHBOARD_DATA,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: fetchDashboardData,
    refetchInterval: 5000,
  });

  const {
    data: modelReport = EMPTY_MODEL_REPORT,
    isLoading: modelLoading,
  } = useQuery({
    queryKey: ["ml-model-report"],
    queryFn: fetchMlModelReport,
    refetchInterval: 15000,
  });

  const chartCard = (
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    delay: number
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-display text-sm tracking-wider text-foreground">{title}</h3>
      </div>
      <div className="h-64">{children}</div>
    </motion.div>
  );

  const customTooltipStyle = {
    backgroundColor: "hsl(215 40% 12% / 0.95)",
    border: "1px solid hsl(215 30% 25%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(200 100% 95%)",
  };

  return (
    <div className="min-h-screen cyber-gradient relative">
      <ParticleBackground />
      <Navbar />

      <section className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="section-title">
            Analytics <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="section-subtitle mx-auto">
            Real-time visualization generated from live typing sessions.
          </p>
          <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 mt-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-xs text-primary font-display tracking-wider">LIVE DATA</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Session samples used: {data.sampleCount}
          </p>
          <p className="text-xs text-muted-foreground">
            ML model samples: {modelReport.sampleCount} | Target accuracy: {modelReport.targetAccuracy}%
          </p>
          {isLoading && <p className="text-xs text-muted-foreground mt-3">Loading dashboard data...</p>}
          {modelLoading && <p className="text-xs text-muted-foreground">Loading model metrics...</p>}
          {isError && (
            <p className="text-xs text-destructive mt-3">
              {error instanceof Error ? error.message : "Unable to load dashboard data"}
            </p>
          )}
        </motion.div>

        {!isLoading && !isError && data.sampleCount === 0 && (
          <div className="glass-card p-4 mb-6 text-sm text-muted-foreground">
            No typing session data yet. Type on the Home page to populate graphs.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {chartCard(
            "MODEL ACCURACY (CNN / LSTM / ENSEMBLE)",
            <BarChart3 className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={modelReport.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="epoch" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="cnnValTop1" stroke="#00d2d3" strokeWidth={2} dot={false} name="CNN Val Top-1" />
                <Line type="monotone" dataKey="lstmValTop1" stroke="#8b5cf6" strokeWidth={2} dot={false} name="LSTM Val Top-1" />
                <Line type="monotone" dataKey="ensembleValTop1" stroke="#10b981" strokeWidth={2} dot={false} name="Ensemble Val Top-1" />
              </LineChart>
            </ResponsiveContainer>,
            0.08
          )}

          {chartCard(
            "DWELL TIME DISTRIBUTION",
            <Activity className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={data.dwellData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="keystroke" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                {Object.entries(data.colors).map(([key, color]) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>,
            0.1
          )}

          {chartCard(
            "FLIGHT TIME DISTRIBUTION",
            <TrendingUp className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={data.flightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="keystroke" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                {Object.entries(data.colors).map(([key, color]) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>,
            0.2
          )}

          {chartCard(
            "USER COMPARISON",
            <Users className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <BarChart data={data.comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="name" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="dwellTime" fill="#00d2d3" radius={[4, 4, 0, 0]} name="Dwell Time" />
                <Bar dataKey="flightTime" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Flight Time" />
              </BarChart>
            </ResponsiveContainer>,
            0.3
          )}

          {chartCard(
            "AUTHENTICATION CONFIDENCE",
            <BarChart3 className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <AreaChart data={data.confidenceData}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2d3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d2d3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="session" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="confidence" stroke="#00d2d3" strokeWidth={2} fill="url(#confGrad)" />
              </AreaChart>
            </ResponsiveContainer>,
            0.4
          )}

          {chartCard(
            "WPM / 10s WPM TREND",
            <TrendingUp className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={data.featureTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="session" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="wpm" stroke="#00d2d3" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="tenSecondWpm"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>,
            0.45
          )}

          {chartCard(
            "MATCH / CONSISTENCY / BACKSPACE",
            <Activity className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={data.featureTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="session" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="promptMatchRatio"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="consistencyScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="backspaceRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>,
            0.5
          )}
        </div>

        {modelReport.models.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {modelReport.models.map((model) => (
              <div key={model.name} className="glass-card p-4">
                <p className="text-xs text-primary font-display tracking-wider">{model.displayName}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{model.description}</p>
                <p className="text-sm text-foreground mt-2">Val Top-1: {model.metrics.valTop1.toFixed(2)}%</p>
                {typeof model.metrics.datasetTop1 === "number" && (
                  <p className="text-xs text-muted-foreground">
                    Dataset Top-1: {model.metrics.datasetTop1.toFixed(2)}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Val Top-3: {model.metrics.valTop3.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">Val Top-5: {model.metrics.valTop5.toFixed(2)}%</p>
                {typeof model.metrics.trainTop1 === "number" && (
                  <p className="text-xs text-muted-foreground">Train Top-1: {model.metrics.trainTop1.toFixed(2)}%</p>
                )}
                <p
                  className={`text-xs mt-2 ${
                    model.metrics.meetsTarget ? "text-primary" : "text-amber-400"
                  }`}
                >
                  {model.metrics.meetsTarget
                    ? `Meets ${modelReport.targetAccuracy}% target`
                    : `Below ${modelReport.targetAccuracy}% target`}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {chartCard(
            "PASS / FAIL DISTRIBUTION",
            <BarChart3 className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <BarChart data={data.resultDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="result" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="count" fill="#00d2d3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>,
            0.55
          )}

          {chartCard(
            "10S MATCH RATE BY USER",
            <Users className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <BarChart data={data.tenSecondMatchByUser}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="user" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="matchRate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>,
            0.58
          )}

          {chartCard(
            "FEATURE AVERAGES",
            <Activity className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <BarChart data={data.featureAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="feature" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>,
            0.6
          )}
        </div>

        {/* Full-width scatter plot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 mt-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-display text-sm tracking-wider text-foreground">USER CLUSTERING (DWELL VS FLIGHT)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Each dot represents one typing session from the dataset</p>
          <div className="h-80">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="dwell" name="Avg Dwell (ms)" stroke="hsl(210 20% 55%)" fontSize={11} label={{ value: "Avg Dwell (ms)", position: "insideBottom", offset: -5, fill: "hsl(210 20% 55%)", fontSize: 11 }} />
                <YAxis dataKey="flight" name="Avg Flight (ms)" stroke="hsl(210 20% 55%)" fontSize={11} label={{ value: "Avg Flight (ms)", angle: -90, position: "insideLeft", fill: "hsl(210 20% 55%)", fontSize: 11 }} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => `${value.toFixed(1)} ms`} />
                <Legend formatter={(value) => <span style={{ color: "hsl(200 100% 95%)", fontSize: 12 }}>{value}</span>} />
                {data.users.map((u) => (
                  <Scatter
                    key={u.name}
                    name={u.name}
                    data={data.clusterData.filter((d) => d.user === u.name)}
                    fill={u.color}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default GraphPage;
