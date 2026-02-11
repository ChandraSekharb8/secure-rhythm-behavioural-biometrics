import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Activity, TrendingUp, Users } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, Cell, Legend
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { generateChartData, COLORS, DATASET_USERS } from "@/data/typingDataset";

const GraphPage = () => {
  const [data, setData] = useState(() => generateChartData());

  useEffect(() => {
    const interval = setInterval(() => setData(generateChartData()), 5000);
    return () => clearInterval(interval);
  }, []);

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
            Real-time visualization of keystroke biometric patterns across users.
          </p>
          <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 mt-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-xs text-primary font-display tracking-wider">LIVE DATA</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {chartCard(
            "DWELL TIME DISTRIBUTION",
            <Activity className="w-5 h-5 text-primary" />,
            <ResponsiveContainer>
              <LineChart data={data.dwellData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
                <XAxis dataKey="keystroke" stroke="hsl(210 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={11} />
                <Tooltip contentStyle={customTooltipStyle} />
                {Object.entries(COLORS).map(([key, color]) => (
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
                {Object.entries(COLORS).map(([key, color]) => (
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
                {DATASET_USERS.map((u) => (
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
