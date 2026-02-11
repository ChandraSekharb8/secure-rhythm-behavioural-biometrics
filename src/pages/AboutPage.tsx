import { motion } from "framer-motion";
import {
  Brain, Layers, ShieldCheck, Database, Cpu, BarChart3,
  Globe, GitBranch, AlertTriangle, CheckCircle2, Code2,
  ExternalLink, Target, Fingerprint, Lock, Activity
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

const modules = [
  { icon: Database, title: "Data Collection", desc: "Keystroke event logging with precise timing capture" },
  { icon: Cpu, title: "Preprocessing", desc: "Feature extraction and min-max normalization" },
  { icon: Brain, title: "Model Training", desc: "CNN + Bi-LSTM hybrid architecture training" },
  { icon: AlertTriangle, title: "Uncertainty Auth", desc: "Monte Carlo Dropout for confidence estimation" },
  { icon: BarChart3, title: "Evaluation", desc: "Accuracy, EER, and AUC-ROC metrics" },
  { icon: Globe, title: "Deployment", desc: "Secure demo system with live authentication" },
];

const techStack = [
  "Python", "TensorFlow / PyTorch", "NumPy", "Pandas",
  "scikit-learn", "matplotlib", "Flask / Django", "HTML / JavaScript",
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
});

const AboutPage = () => (
  <div className="min-h-screen cyber-gradient relative">
    <ParticleBackground />
    <Navbar />

    <section className="relative z-10 container mx-auto px-6 pt-28 pb-12">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h1 className="section-title">
          Project <span className="text-gradient">Overview</span>
        </h1>
        <p className="section-subtitle mx-auto mt-3">
          A secure and continuous authentication system using behavioral biometrics,
          specifically keystroke dynamics — learning your unique typing rhythm to verify identity
          without relying solely on traditional passwords.
        </p>
      </motion.div>

      {/* Problem Statement */}
      <motion.div {...fadeUp(0.05)} className="mb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-6">
          Problem <span className="text-gradient">Statement</span>
        </h2>
        <div className="glass-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Traditional authentication methods like passwords and PINs are vulnerable to theft, phishing, and brute-force attacks. Once compromised, anyone can impersonate the legitimate user. There is a growing need for <strong className="text-foreground">continuous and passive authentication</strong> that verifies identity based on <em>who you are</em>, not just <em>what you know</em>.
          </p>
          <p className="text-sm text-muted-foreground">
            This project addresses that gap by leveraging <strong className="text-foreground">keystroke dynamics</strong> — the unique rhythm and pattern in how each person types — as a behavioral biometric for secure, non-intrusive authentication.
          </p>
        </div>
      </motion.div>

      {/* Objective */}
      <motion.div {...fadeUp(0.08)} className="mb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-6">
          Project <span className="text-gradient">Objective</span>
        </h2>
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Build a deep learning model that can <strong className="text-foreground">identify users based on their typing patterns</strong> by analyzing keystroke timing features — specifically dwell time and flight time.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Fingerprint className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Implement <strong className="text-foreground">uncertainty-aware authentication</strong> using Monte Carlo Dropout, allowing the system to measure confidence and trigger fallback verification when needed.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Create a <strong className="text-foreground">real-time demo system</strong> where users can type and see live authentication results, showcasing the practical viability of behavioral biometrics.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Features */}
      <motion.div {...fadeUp(0.1)} className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
        {[
          { label: "Key Hold Time", sub: "Dwell Time — how long each key is pressed" },
          { label: "Inter-Key Delay", sub: "Flight Time — gap between consecutive keys" },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* How It Works */}
      <motion.div {...fadeUp(0.12)} className="mb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-6">
          How It <span className="text-gradient">Works</span>
        </h2>
        <div className="glass-card p-6 space-y-4">
          {[
            { step: "1", title: "User Types", desc: "The user types a predefined sentence (e.g., \"The quick brown fox jumps over the lazy fox\") on the demo interface." },
            { step: "2", title: "Feature Extraction", desc: "The system captures precise key press/release timestamps and computes dwell times and flight times for each keystroke." },
            { step: "3", title: "Model Prediction", desc: "The CNN + Bi-LSTM model processes the timing features and predicts which user is typing, along with a confidence score." },
            { step: "4", title: "Uncertainty Check", desc: "If confidence is high, the user is authenticated seamlessly. If low, a fallback password verification is triggered." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-primary font-display text-sm font-bold">{item.step}</span>
              </div>
              <div>
                <p className="font-display text-sm text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Architecture */}
      <motion.div {...fadeUp(0.2)} className="mb-16">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
          Model <span className="text-gradient">Architecture</span>
        </h2>
        <div className="max-w-3xl mx-auto glass-card p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { icon: Layers, label: "CNN Layers", desc: "Extract local timing patterns from keystroke sequences" },
              { icon: GitBranch, label: "Bi-LSTM Layers", desc: "Learn long-term temporal dependencies in typing" },
              { icon: ShieldCheck, label: "MC Dropout", desc: "Monte Carlo Dropout for uncertainty estimation" },
            ].map((item, i) => (
              <div key={item.label} className="flex flex-col items-center text-center flex-1">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 glow-border">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="font-display text-sm text-foreground mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute">
                    <span className="text-primary text-2xl">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Uncertainty Auth */}
      <motion.div {...fadeUp(0.3)} className="mb-16 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Uncertainty-Aware <span className="text-gradient">Authentication</span>
        </h2>
        <div className="glass-card p-6 text-left space-y-3">
          <p className="text-sm text-muted-foreground">
            The model measures prediction confidence using Monte Carlo Dropout at inference time.
          </p>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">High confidence →</strong> Seamless authentication
            </p>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Low confidence →</strong> Fallback password verification triggered
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modules */}
      <motion.div {...fadeUp(0.4)} className="mb-16">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
          Project <span className="text-gradient">Modules</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="module-card"
            >
              <m.icon className="w-6 h-6 text-primary" />
              <h3 className="font-display text-sm text-foreground">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Dataset & Data Collection */}
      <motion.div {...fadeUp(0.5)} className="mb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
          Dataset & <span className="text-gradient">Data Collection</span>
        </h2>
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-display text-sm text-foreground mb-1">Dataset Used</p>
              <p className="text-xs text-muted-foreground">
                The model was trained on <strong className="text-foreground">generated_typing_dataset_FULL_sentence.xlsx</strong>, containing keystroke timing data (dwell times and flight times) collected from multiple users — including Varsha, Nagendra, Chandra Shekar, and Devi — each with pre-calculated average dwell and flight times.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Code2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-display text-sm text-foreground mb-1">Data Collection Tool</p>
              <p className="text-xs text-muted-foreground">
                Keystroke timing data was collected using a custom-built <strong className="text-foreground">HTML/JavaScript Typing Biometrics Collector</strong>. This lightweight tool captures individual key press and release events via <code className="text-primary/80 bg-primary/5 px-1 rounded">performance.now()</code>, calculates per-key dwell times (key hold duration) and inter-key flight times (gap between consecutive keystrokes), and outputs the raw timing arrays along with their averages — enabling rapid dataset generation across multiple typing sessions.
              </p>
              <a
                href="/typing-biometrics-collector.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors font-display"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Try the Data Collection Tool Demo
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div {...fadeUp(0.6)} className="text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">
          Technologies <span className="text-gradient">Used</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((tech) => (
            <div
              key={tech}
              className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              <Code2 className="w-3.5 h-3.5" />
              {tech}
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    <Footer />
  </div>
);

export default AboutPage;
