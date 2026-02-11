import { motion } from "framer-motion";
import {
  Brain, Layers, ShieldCheck, Database, Cpu, BarChart3,
  Globe, GitBranch, AlertTriangle, CheckCircle2, Code2
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
  "scikit-learn", "matplotlib", "Flask / Django",
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
          specifically keystroke dynamics — learning your unique typing rhythm.
        </p>
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

      {/* Tech Stack */}
      <motion.div {...fadeUp(0.5)} className="text-center">
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
