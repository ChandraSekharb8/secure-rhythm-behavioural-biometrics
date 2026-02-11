import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Activity, TrendingUp, Users } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

const generateData = () => {
  const users = ["Alice", "Bob", "Charlie", "Diana"];
  const dwellData = Array.from({ length: 20 }, (_, i) => ({
    keystroke: i + 1,
    Alice: 80 + Math.random() * 30,
    Bob: 105 + Math.random() * 30,
    Charlie: 60 + Math.random() * 30,
    Diana: 135 + Math.random() * 30,
  }));

  const flightData = Array.from({ length: 20 }, (_, i) => ({
    keystroke: i + 1,
    Alice: 115 + Math.random() * 30,
    Bob: 155 + Math.random() * 30,
    Charlie: 85 + Math.random() * 30,
    Diana: 185 + Math.random() * 30,
  }));

  const comparisonData = users.map((name) => ({
    name,
    dwellTime: [95, 120, 75, 150][users.indexOf(name)],
    flightTime: [130, 170, 100, 200][users.indexOf(name)],
  }));

  const confidenceData = Array.from({ length: 15 }, (_, i) => ({
    session: i + 1,
    confidence: Math.min(100, 50 + i * 3.5 + (Math.random() - 0.5) * 10),
  }));

  return { dwellData, flightData, comparisonData, confidenceData };
};

const COLORS = {
  Alice: "#00d2d3",
  Bob: "#3b82f6",
  Charlie: "#8b5cf6",
  Diana: "#f59e0b",
};

const GraphPage = () => {
  const [data, setData] = useState(generateData);

  useEffect(() => {
    const interval = setInterval(() => setData(generateData()), 5000);
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
      </section>

      <Footer />
    </div>
  );
};

export default GraphPage;
