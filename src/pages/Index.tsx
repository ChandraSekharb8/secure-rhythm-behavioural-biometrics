import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard, Timer, Fingerprint, ShieldCheck, ShieldAlert,
  Activity, Zap, Lock, Unlock, Gauge, MailCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import heroBg from "@/assets/hero-bg.jpg";
import {
  identifyTyping,
  type TypingFeatureMetrics,
  verifyOtp,
  verifyFallback,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface KeyEvent {
  key: string;
  downTime: number;
  upTime?: number;
}

const TYPING_PROMPTS = [
  "Adaptive systems can protect user accounts through passive verification.",
  "Secure authentication should be invisible, continuous, and reliable.",
  "Typing rhythm reveals hidden behavioral patterns unique to each person.",
  "Modern biometric platforms combine usability with strong identity assurance.",
  "Keystroke timing can strengthen account protection beyond static passwords.",
  "Machine learning models improve security when confidence is measured well.",
  "Continuous identity checks reduce risks from stolen or shared devices.",
  "Typing behavior changes under stress, which makes detection more challenging.",
  "Privacy focused authentication should minimize friction for normal activity.",
  "Reliable systems must handle uncertainty and trigger fallback verification.",
  "User trust increases when security feels seamless and non intrusive.",
  "Biometric timing signals can support zero interruption security workflows.",
  "Session level analytics help monitor confidence and model stability over time.",
  "Strong profile separation is essential for practical behavioral authentication.",
  "Security dashboards should show clear outcomes and transparent reasoning.",
  "Real time classification benefits from robust dwell and flight features.",
  "Feature engineering quality can significantly affect model performance.",
  "Fallback controls are required whenever confidence drops below threshold.",
  "Data quality and consistency are critical for accurate typing models.",
  "Human behavior can be learned without requiring extra hardware sensors.",
  "Authentication speed matters as much as classification accuracy in production.",
  "Usable security depends on balancing friction, confidence, and resilience.",
  "Accurate baseline profiles improve long term behavioral verification quality.",
  "Typing cadence can distinguish users even when passwords are identical.",
  "Low confidence events should be logged for later model evaluation.",
  "Behavior driven protection can reduce impersonation and account misuse.",
  "Secure systems must detect anomalies without overwhelming genuine users.",
  "Good biometrics engineering combines signal quality with practical deployment.",
  "Dynamic typing features offer useful identity traits in real world systems.",
  "Fallback validation should remain fast to preserve user experience.",
];

const getRandomPrompt = (currentPrompt?: string) => {
  if (TYPING_PROMPTS.length === 0) return "";
  if (TYPING_PROMPTS.length === 1) return TYPING_PROMPTS[0];

  let nextPrompt = TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)];
  while (nextPrompt === currentPrompt) {
    nextPrompt = TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)];
  }
  return nextPrompt;
};

const sanitizeTimings = (values: number[]) =>
  values
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 20000)
    .slice(-500);

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(() => getRandomPrompt());
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [dwellTimes, setDwellTimes] = useState<number[]>([]);
  const [flightTimes, setFlightTimes] = useState<number[]>([]);
  const [keyCount, setKeyCount] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [detectedUser, setDetectedUser] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [authStatus, setAuthStatus] = useState<
    "idle" | "authenticated" | "fallback" | "denied" | "otp_pending"
  >("idle");
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackPassword, setFallbackPassword] = useState("");
  const [manualDetectedUser, setManualDetectedUser] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpDestination, setOtpDestination] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [latestFeatureMetrics, setLatestFeatureMetrics] = useState<TypingFeatureMetrics | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const lastKeyUpTime = useRef<number>(0);
  const latestRequestId = useRef(0);

  const avgDwell = dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0;
  const avgFlight = flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;
  const typingDurationMs = dwellTimes.reduce((sum, value) => sum + value, 0) + flightTimes.reduce((sum, value) => sum + value, 0);
  const typingSeconds = typingDurationMs / 1000;
  const typedWords = text.trim().length / 5;
  const liveWpm = typingSeconds > 0 ? (typedWords / typingSeconds) * 60 : 0;
  const liveWps = typingSeconds > 0 ? typedWords / typingSeconds : 0;
  const backspaceRate = keyCount > 0 ? (backspaceCount / keyCount) * 100 : 0;
  const promptMatchRatio = (() => {
    const typed = text.trim();
    const prompt = selectedPrompt.trim();
    if (!typed || !prompt) return 0;
    let match = 0;
    const maxLength = Math.max(typed.length, prompt.length, 1);
    for (let index = 0; index < Math.min(typed.length, prompt.length); index += 1) {
      if (typed[index] === prompt[index]) {
        match += 1;
      }
    }
    return (match / maxLength) * 100;
  })();

  const identifyUser = useCallback(async () => {
    if (dwellTimes.length < 5) return;

    const promptThreshold = 60;
    if (text.trim().length >= 10 && promptMatchRatio < promptThreshold) {
      setWarningMessage("Type correctly: please follow the displayed sentence.");
      setAuthStatus("fallback");
      setShowFallback(true);
      return;
    }

    const safeDwell = sanitizeTimings(dwellTimes);
    const safeFlight = sanitizeTimings(flightTimes);
    if (safeDwell.length < 5) {
      setWarningMessage("Typing timings look noisy. Continue typing steadily.");
      return;
    }

    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    setIsAuthenticating(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const response = await identifyTyping({
        typedText: text,
        promptText: selectedPrompt,
        dwellTimes: safeDwell,
        flightTimes: safeFlight,
        keyCount,
        backspaceCount,
      });

      if (latestRequestId.current !== requestId) {
        return;
      }

      setSessionId(response.sessionId);
      setDetectedUser(response.detectedUser);
      setConfidence(response.confidence);
      setLatestFeatureMetrics(response.featureMetrics ?? null);
      setOtpChallengeId(response.otpChallengeId ?? null);
      setOtpDestination(response.otpDestination ?? null);
      if (response.otpRequired) {
        setOtpCode("");
      }
      if (response.warnings?.length) {
        setWarningMessage(response.warnings.join(" "));
      }

      if (response.authStatus === "authenticated") {
        setAuthStatus("authenticated");
        setShowFallback(false);
        setOtpChallengeId(null);
        setOtpDestination(null);
      } else {
        if (response.authStatus === "otp_pending") {
          setAuthStatus("otp_pending");
          setShowFallback(false);
        } else {
          setAuthStatus("fallback");
          setShowFallback(true);
        }
      }
    } catch (error) {
      if (latestRequestId.current !== requestId) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Unable to identify typing pattern");
    } finally {
      if (latestRequestId.current === requestId) {
        setIsAuthenticating(false);
      }
    }
  }, [backspaceCount, dwellTimes, flightTimes, keyCount, promptMatchRatio, selectedPrompt, text]);

  useEffect(() => {
    if (dwellTimes.length < 5) return;
    const timeout = window.setTimeout(() => {
      void identifyUser();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [dwellTimes, flightTimes, identifyUser]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      setKeyCount((prev) => prev + 1);
      setBackspaceCount((prev) => prev + 1);
      return;
    }
    if (e.key.length !== 1) return;
    const now = performance.now();
    setKeyCount((prev) => prev + 1);
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
      const index = [...prev].reverse().findIndex((k) => k.key === e.key && !k.upTime);
      if (index >= 0) {
        const actualIndex = prev.length - 1 - index;
        const event = prev[actualIndex];
        const dwell = now - event.downTime;
        setDwellTimes((d) => [...d, dwell]);
        const next = [...prev];
        next[actualIndex] = { ...event, upTime: now };
        return next;
      }
      return prev;
    });
  }, []);

  const handleReset = () => {
    setText("");
    setKeyEvents([]);
    setDwellTimes([]);
    setFlightTimes([]);
    setKeyCount(0);
    setBackspaceCount(0);
    setDetectedUser(null);
    setConfidence(0);
    setLatestFeatureMetrics(null);
    setAuthStatus("idle");
    setShowFallback(false);
    setFallbackPassword("");
    setManualPassword("");
    setOtpCode("");
    setOtpChallengeId(null);
    setOtpDestination(null);
    setSessionId(null);
    setIsAuthenticating(false);
    setErrorMessage(null);
    setWarningMessage(null);
    setSelectedPrompt((previousPrompt) => getRandomPrompt(previousPrompt));
    lastKeyUpTime.current = 0;
    latestRequestId.current += 1;
  };

  const handleFallbackSubmit = async () => {
    if (!fallbackPassword.trim() || !detectedUser) return;

    setIsAuthenticating(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const response = await verifyFallback({
        password: fallbackPassword,
        detectedUser,
        ...(sessionId ? { sessionId } : {}),
      });

      setSessionId(response.sessionId);
      setDetectedUser(response.detectedUser);
      setConfidence(response.confidence);
      setFallbackPassword("");
      setOtpChallengeId(response.otpChallengeId ?? null);
      setOtpDestination(response.otpDestination ?? null);
      if (response.otpRequired) {
        setOtpCode("");
      }

      if (response.authStatus === "authenticated") {
        setAuthStatus("authenticated");
        setOtpChallengeId(null);
        setOtpDestination(null);
      } else if (response.authStatus === "otp_pending") {
        setAuthStatus("otp_pending");
      } else {
        setAuthStatus("denied");
      }

      setShowFallback(response.authStatus === "fallback");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Fallback verification failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordOnlyLogin = async () => {
    if (!manualDetectedUser.trim() || !manualPassword.trim()) {
      setErrorMessage("Enter user name and password");
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const response = await verifyFallback({
        detectedUser: manualDetectedUser.trim(),
        password: manualPassword,
      });

      setSessionId(response.sessionId);
      setDetectedUser(response.detectedUser);
      setConfidence(response.confidence);
      setOtpChallengeId(response.otpChallengeId ?? null);
      setOtpDestination(response.otpDestination ?? null);
      if (response.otpRequired) {
        setOtpCode("");
      }

      if (response.authStatus === "authenticated") {
        setAuthStatus("authenticated");
        setOtpChallengeId(null);
        setOtpDestination(null);
      } else if (response.authStatus === "otp_pending") {
        setAuthStatus("otp_pending");
      } else {
        setAuthStatus("denied");
      }

      setShowFallback(false);
      setManualPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Password-only login failed");
    } finally {
    setIsAuthenticating(false);
    setWarningMessage(null);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpChallengeId || !otpCode.trim()) {
      setErrorMessage("Enter OTP code");
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const response = await verifyOtp({
        challengeId: otpChallengeId,
        otpCode: otpCode.trim(),
        ...(sessionId ? { sessionId } : {}),
      });

      setSessionId(response.sessionId);
      setDetectedUser(response.detectedUser);
      setConfidence(response.confidence);

      if (response.authStatus === "authenticated") {
        setAuthStatus("authenticated");
        setOtpChallengeId(null);
        setOtpDestination(null);
        setOtpCode("");
        setWarningMessage(null);
      } else if (response.authStatus === "otp_pending") {
        setAuthStatus("otp_pending");
        setWarningMessage(`Invalid OTP. Attempts left: ${response.attemptsLeft}`);
      } else {
        setAuthStatus("denied");
        setWarningMessage("OTP verification failed. Access denied.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setIsAuthenticating(false);
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="block text-xs text-muted-foreground">Random typing sentence</label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-primary border border-primary/40 rounded px-2 py-1 hover:bg-primary/10 transition-colors"
                >
                  New random sentence
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3 font-mono tracking-wide bg-muted/30 border border-border rounded-lg px-4 py-2">
                "{selectedPrompt}"
              </p>
              <textarea
                className="typing-area h-40"
                placeholder="Start typing the sentence above..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
              />
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>Characters: {text.length}</span>
                <span>Keystrokes analyzed: {keyCount}</span>
                {isAuthenticating && dwellTimes.length >= 5 && (
                  <span className="text-primary">Analyzing...</span>
                )}
              </div>
              {errorMessage && (
                <p className="mt-2 text-xs text-destructive">{errorMessage}</p>
              )}
              {warningMessage && (
                <p className="mt-2 text-xs text-amber-400">{warningMessage}</p>
              )}
              {!errorMessage && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {isAuthenticated
                    ? "You are logged in. Sessions from this demo are saved to your history."
                    : "Login to save sessions and unlock personal history filters."}
                </p>
              )}
            </div>

            {/* Feature Extraction */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
              <div className="glass-card p-5 text-center">
                <Gauge className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{liveWpm.toFixed(1)}</div>
                <div className="stat-label">Live WPM</div>
              </div>
              <div className="glass-card p-5 text-center">
                <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{liveWps.toFixed(2)}</div>
                <div className="stat-label">Live WPS</div>
              </div>
              <div className="glass-card p-5 text-center">
                <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{promptMatchRatio.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">%</span></div>
                <div className="stat-label">Prompt Match</div>
              </div>
              <div className="glass-card p-5 text-center">
                <ShieldAlert className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="stat-value">{backspaceRate.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">%</span></div>
                <div className="stat-label">Backspace Rate</div>
              </div>
            </div>
            {latestFeatureMetrics && (
              <div className="glass-card p-4 mt-4 text-xs text-muted-foreground grid sm:grid-cols-2 gap-2">
                <p>Consistency: <span className="text-foreground">{latestFeatureMetrics.consistencyScore.toFixed(1)}%</span></p>
                <p>10s WPM: <span className="text-foreground">{latestFeatureMetrics.tenSecondWpm.toFixed(1)}</span></p>
                <p>10s Match: <span className="text-foreground">{latestFeatureMetrics.tenSecondMatch ? "Yes" : "No"}</span></p>
                <p>Duration: <span className="text-foreground">{latestFeatureMetrics.typingDurationMs.toFixed(0)} ms</span></p>
              </div>
            )}
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
                        {isAuthenticating && dwellTimes.length >= 5
                          ? "Analyzing typing pattern..."
                          : "Type at least 5 characters to begin identification"}
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

                  {authStatus === "otp_pending" && (
                    <motion.div
                      key="otp-pending"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                        <MailCheck className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-display text-lg text-foreground">{detectedUser}</p>
                      <p className="text-xs text-primary uppercase tracking-widest mt-1">
                        OTP Verification Required
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
                        disabled={isAuthenticating}
                        className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-display hover:bg-primary/30 transition-colors disabled:opacity-60"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {(authStatus === "otp_pending" || otpChallengeId) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    OTP sent to {otpDestination ?? "your email"}. Enter it to complete authentication.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value.replace(/[^\d]/g, ""))}
                      className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="Enter OTP"
                    />
                    <button
                      onClick={handleOtpSubmit}
                      disabled={isAuthenticating}
                      className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-display hover:bg-primary/30 transition-colors disabled:opacity-60"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Unable to type normally? Use password-only login.
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={manualDetectedUser}
                    onChange={(event) => setManualDetectedUser(event.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    placeholder="Enter user name"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={manualPassword}
                      onChange={(event) => setManualPassword(event.target.value)}
                      className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="Password-only fallback"
                    />
                    <button
                      onClick={handlePasswordOnlyLogin}
                      disabled={isAuthenticating}
                      className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-display hover:bg-primary/30 transition-colors disabled:opacity-60"
                    >
                      Login
                    </button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-[11px] text-muted-foreground">
                      Tip: sign in to save password-only logins in your private profile logs.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
