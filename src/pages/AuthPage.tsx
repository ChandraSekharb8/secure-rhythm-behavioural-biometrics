import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/context/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, signup, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }
      if (!fullName.trim()) {
        setErrorMessage("Full name is required");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await signup({ fullName, email, password });
      }

      navigate(mode === "signup" ? "/add-user" : "/sessions");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen cyber-gradient relative">
      <ParticleBackground />
      <Navbar />

      <section className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto glass-card p-8"
        >
          <h1 className="section-title text-center">
            {mode === "login" ? "Login" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {mode === "login"
              ? "Sign in to access your personal session history and analytics."
              : "Create an account to save and review your biometric sessions."}
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetForm();
              }}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-display transition-colors ${
                mode === "login"
                  ? "border-primary/50 text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-primary"
              }`}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <KeyRound className="w-4 h-4" />
                Login
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                resetForm();
              }}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-display transition-colors ${
                mode === "signup"
                  ? "border-primary/50 text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-primary"
              }`}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <UserPlus className="w-4 h-4" />
                Signup
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Email or username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="you@example.com or username"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="At least 8 characters"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="Retype password"
                />
              </div>
            )}

            {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary/20 border border-primary/40 text-primary px-4 py-2 text-sm font-display hover:bg-primary/30 transition-colors disabled:opacity-60"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default AuthPage;
