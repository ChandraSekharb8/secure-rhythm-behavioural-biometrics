import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard, Timer, Fingerprint, ShieldCheck, ShieldAlert,
  Activity, Zap, Lock, Unlock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import heroBg from "@/assets/hero-bg.jpg";

import { DATASET_USERS } from "@/data/typingDataset";

interface KeyEvent {
  key: string;
  downTime: number;
  upTime?: number;
}

const Index = () => {
  const [text, setText] = useState("");
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [dwellTimes, setDwellTimes] = useState<number[]>([]);
  const [flightTimes, setFlightTimes] = useState<number[]>([]);
  const [detectedUser, setDetectedUser] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [authStatus, setAuthStatus] = useState<"idle" | "authenticated" | "fallback" | "denied">("idle");
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackPassword, setFallbackPassword] = useState("");
  const lastKeyUpTime = useRef<number>(0);

  const avgDwell = dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0;
  const avgFlight = flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;

  const identifyUser = useCallback(() => {
    if (dwellTimes.length < 5) return;
    let bestMatch = DATASET_USERS[0];
    let bestDist = Infinity;

    DATASET_USERS.forEach((user) => {
      const dwellDiff = Math.abs(avgDwell - user.avgDwell);
      const flightDiff = Math.abs(avgFlight - user.avgFlight);
      const dist = Math.sqrt(dwellDiff ** 2 + flightDiff ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = user;
      }
    });

    const maxDist = 200;
    const conf = Math.max(0, Math.min(100, ((maxDist - bestDist) / maxDist) * 100));
    setDetectedUser(bestMatch.name);
    setConfidence(Math.round(conf));

    if (conf >= 60) {
      setAuthStatus("authenticated");
      setShowFallback(false);
    } else {
      setAuthStatus("fallback");
      setShowFallback(true);
    }
  }, [dwellTimes, flightTimes, avgDwell, avgFlight]);

  useEffect(() => {
    if (dwellTimes.length >= 5) identifyUser();
  }, [dwellTimes.length, identifyUser]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key.length !== 1) return;
    const now = performance.now();
    if (lastKeyUpTime.current > 0) {
      setFlightTimes((prev) => [...prev, now - lastKeyUpTime.current]);
    }
    setKeyEvents((prev) => [...prev, { key: e.key, downTime: now }]);
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key.length !== 1) return;
    const now = performance.now();
    lastKeyUpTime.current = now;
    setKeyEvents((prev) => {
      const last = [...prev].reverse().find((k) => k.key === e.key && !k.upTime);
      if (last) {
        const dwell = now - last.downTime;
        setDwellTimes((d) => [...d, dwell]);
      }
      return prev;
    });
  }, []);

  const handleReset = () => {
    setText("");
    setKeyEvents([]);
    setDwellTimes([]);
    setFlightTimes([]);
    setDetectedUser(null);
    setConfidence(0);
    setAuthStatus("idle");
    setShowFallback(false);
    setFallbackPassword("");
    lastKeyUpTime.current = 0;
  };

  const handleFallbackSubmit = () => {
    if (fallbackPassword === "secure123") {
      setAuthStatus("authenticated");
      setShowFallback(false);
      setConfidence(100);
    } else {
      setAuthStatus("denied");
      setShowFallback(false);
    }
  };

  return (
    <div className="min-h-screen cyber-gradient relative">
      <ParticleBackground />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6">
              <Activity className="w-4 h-4 text-primary animate-glow-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-display">
                Live Authentication Demo
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 text-foreground">
              Behavioral Biometrics
              <br />
              <span className="text-gradient">Keystroke Dynamics</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Authenticate users continuously through their unique typing rhythm.
              No passwords. No tokens. Just you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="relative z-10 container mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Typing Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-sm tracking-wider text-foreground">
                    TYPING DATA COLLECTION
                  </h2>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
                >
                  RESET
                </button>
              </div>
              <textarea
                className="typing-area h-40"
                placeholder="Type: The quick brown fox jumps over the lazy fox"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
              />
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>Characters: {text.length}</span>
                <span>Keystrokes analyzed: {dwellTimes.length}</span>
              </div>
            </div>

            {/* Feature Extraction */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="glass-card p-5 text-center">
                <Timer className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{avgDwell.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">ms</span></div>
                <div className="stat-label">Avg Dwell Time</div>
              </div>
              <div className="glass-card p-5 text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{avgFlight.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">ms</span></div>
                <div className="stat-label">Avg Flight Time</div>
              </div>
            </div>
          </motion.div>

          {/* Authentication Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="glass-card p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Fingerprint className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wider text-foreground">
                  IDENTIFICATION
                </h2>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <AnimatePresence mode="wait">
                  {authStatus === "idle" && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-float" />
                      <p className="text-sm text-muted-foreground">
                        Type at least 5 characters to begin identification
                      </p>
                    </motion.div>
                  )}

                  {authStatus === "authenticated" && (
                    <motion.div
                      key="auth"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3 glow-border">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-display text-lg text-foreground">{detectedUser}</p>
                      <p className="text-xs text-primary uppercase tracking-widest mt-1">
                        Authenticated
                      </p>
                    </motion.div>
                  )}

                  {authStatus === "fallback" && (
                    <motion.div
                      key="fallback"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                      </div>
                      <p className="font-display text-lg text-foreground">{detectedUser}?</p>
                      <p className="text-xs text-destructive uppercase tracking-widest mt-1">
                        Low Confidence
                      </p>
                    </motion.div>
                  )}

                  {authStatus === "denied" && (
                    <motion.div
                      key="denied"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                      </div>
                      <p className="font-display text-lg text-foreground">Access Denied</p>
                      <p className="text-xs text-destructive uppercase tracking-widest mt-1">
                        Not Authorized
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confidence */}
                {detectedUser && (
                  <div className="w-full mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="text-primary font-display">{confidence}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: confidence >= 60
                            ? "linear-gradient(90deg, hsl(185 80% 50%), hsl(185 100% 60%))"
                            : "linear-gradient(90deg, hsl(0 70% 50%), hsl(30 80% 55%))",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fallback */}
              <AnimatePresence>
                {showFallback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-border overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      Typing pattern not recognized. Enter your password to verify identity.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={fallbackPassword}
                        onChange={(e) => setFallbackPassword(e.target.value)}
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        placeholder="Password"
                      />
                      <button
                        onClick={handleFallbackSubmit}
                        className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-display hover:bg-primary/30 transition-colors"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
