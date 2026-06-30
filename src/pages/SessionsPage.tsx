import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarClock, ShieldCheck, ShieldX, Activity, Gauge } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchSessionHistory,
  fetchSessionSummary,
  type SessionItem,
} from "@/lib/api";

const SessionsPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<
    "" | "authenticated" | "fallback" | "denied" | "otp_pending"
  >("");
  const [limit, setLimit] = useState(20);

  const query = useMemo(
    () => ({
      limit,
      authStatus: statusFilter || undefined,
    }),
    [limit, statusFilter],
  );

  const historyQuery = useQuery({
    queryKey: ["session-history", query],
    queryFn: () => fetchSessionHistory(query),
    enabled: isAuthenticated,
  });

  const summaryQuery = useQuery({
    queryKey: ["session-summary", query],
    queryFn: () => fetchSessionSummary(query),
    enabled: isAuthenticated,
  });

  if (!loading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const sessions = historyQuery.data ?? [];
  const summary = summaryQuery.data;

  const badgeClass = (status: SessionItem["authStatus"]) => {
    if (status === "authenticated") return "text-primary border-primary/40 bg-primary/10";
    if (status === "otp_pending") return "text-sky-300 border-sky-300/40 bg-sky-500/10";
    if (status === "fallback") return "text-amber-400 border-amber-400/40 bg-amber-500/10";
    return "text-destructive border-destructive/40 bg-destructive/10";
  };

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
            My <span className="text-gradient">Session History</span>
          </h1>
          <p className="section-subtitle">
            Profile logs with pass/fail status, typing speed, typed sentence, and fallback outcomes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4 md:p-5 mb-6"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status filter</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | ""
                      | "authenticated"
                      | "fallback"
                      | "denied"
                      | "otp_pending",
                  )
                }
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">All statuses</option>
                <option value="authenticated">Authenticated</option>
                <option value="otp_pending">OTP Pending</option>
                <option value="fallback">Fallback</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Rows</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
            <p className="text-2xl font-display text-foreground">{summary?.totalSessions ?? 0}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-display text-primary">{summary?.successRate ?? 0}%</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
            <p className="text-2xl font-display text-foreground">{summary?.avgConfidence ?? 0}%</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Dwell / Flight</p>
            <p className="text-sm font-display text-foreground">
              {(summary?.avgDwell ?? 0).toFixed(1)} / {(summary?.avgFlight ?? 0).toFixed(1)} ms
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Typing Speed</p>
            <p className="text-2xl font-display text-foreground">
              {(summary?.avgTypingSpeedWpm ?? 0).toFixed(1)} WPM
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Prompt Match</p>
            <p className="text-2xl font-display text-foreground">
              {(summary?.avgPromptMatchRatio ?? 0).toFixed(1)}%
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Consistency</p>
            <p className="text-2xl font-display text-foreground">
              {(summary?.avgConsistencyScore ?? 0).toFixed(1)}%
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">10s Match Rate</p>
            <p className="text-2xl font-display text-foreground">
              {(summary?.tenSecondMatchRate ?? 0).toFixed(1)}%
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Password-only Logins</p>
            <p className="text-2xl font-display text-foreground">{summary?.passwordOnlyCount ?? 0}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Warning Sessions</p>
            <p className="text-2xl font-display text-foreground">{summary?.warningCount ?? 0}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">OTP Pending</p>
            <p className="text-2xl font-display text-foreground">{summary?.otpPendingCount ?? 0}</p>
          </div>
        </div>

        <div className="glass-card p-4 overflow-x-auto">
          {(historyQuery.isLoading || summaryQuery.isLoading) && (
            <p className="text-sm text-muted-foreground py-4">Loading sessions...</p>
          )}

          {(historyQuery.isError || summaryQuery.isError) && (
            <p className="text-sm text-destructive py-4">
              {(historyQuery.error as Error)?.message ||
                (summaryQuery.error as Error)?.message ||
                "Failed to load session data"}
            </p>
          )}

          {!historyQuery.isLoading && !historyQuery.isError && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              No sessions yet. Go to Home and type to generate biometric sessions.
            </p>
          )}

          {sessions.length > 0 && (
            <table className="w-full min-w-[1520px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="text-left py-3">Time</th>
                  <th className="text-left py-3">Detected User</th>
                  <th className="text-left py-3">Result</th>
                  <th className="text-left py-3">Method</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Confidence</th>
                  <th className="text-left py-3">Typing Speed</th>
                  <th className="text-left py-3">WPS / CPS</th>
                  <th className="text-left py-3">Prompt Match</th>
                  <th className="text-left py-3">Backspace</th>
                  <th className="text-left py-3">Consistency</th>
                  <th className="text-left py-3">10s WPM Match</th>
                  <th className="text-left py-3">Avg Dwell</th>
                  <th className="text-left py-3">Avg Flight</th>
                  <th className="text-left py-3">Typed Sentence</th>
                  <th className="text-left py-3">Warnings</th>
                  <th className="text-left py-3">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/60">
                    <td className="py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {new Date(session.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{session.detectedUser}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs border rounded-full px-2 py-1 ${
                          session.result === "pass"
                            ? "text-primary border-primary/40 bg-primary/10"
                            : "text-destructive border-destructive/40 bg-destructive/10"
                        }`}
                      >
                        {session.result}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-muted-foreground">{session.authMethod}</span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs border rounded-full px-2 py-1 ${badgeClass(session.authStatus)}`}>
                        {session.authStatus}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{session.confidence}%</td>
                    <td className="py-3 text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" />
                        {session.typingSpeedWpm.toFixed(1)} WPM
                      </span>
                    </td>
                    <td className="py-3 text-foreground">
                      {session.typingSpeedWps.toFixed(2)} / {session.charsPerSecond.toFixed(2)}
                    </td>
                    <td className="py-3 text-foreground">{session.promptMatchRatio.toFixed(1)}%</td>
                    <td className="py-3 text-foreground">
                      {session.backspaceCount}/{session.keyCount} ({session.backspaceRate.toFixed(1)}%)
                    </td>
                    <td className="py-3 text-foreground">{session.consistencyScore.toFixed(1)}%</td>
                    <td className="py-3 text-foreground">
                      <span
                        className={`text-xs border rounded-full px-2 py-1 ${
                          session.tenSecondMatch
                            ? "text-primary border-primary/40 bg-primary/10"
                            : "text-destructive border-destructive/40 bg-destructive/10"
                        }`}
                      >
                        {session.tenSecondWpm.toFixed(1)} WPM / {session.tenSecondMatch ? "match" : "no-match"}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        {session.avgDwell.toFixed(1)} ms
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{session.avgFlight.toFixed(1)} ms</td>
                    <td
                      className="py-3 text-muted-foreground max-w-[280px] truncate"
                      title={session.promptText ? `Prompt: ${session.promptText}` : session.typedText}
                    >
                      {session.typedText || "-"}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[260px] truncate" title={session.warnings.join(" | ")}>
                      {session.warnings.length ? session.warnings.join(", ") : "-"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {session.fallbackAttempted ? (
                        session.fallbackSuccessful ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <ShieldX className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )
                      ) : (
                        "Not attempted"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SessionsPage;
