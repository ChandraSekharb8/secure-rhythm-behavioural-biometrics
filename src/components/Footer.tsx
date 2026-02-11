import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-8 mt-20">
    <div className="container mx-auto px-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="font-display text-xs tracking-widest text-muted-foreground">
          KEYSTROKE<span className="text-primary">ID</span>
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-display tracking-[0.3em]">
        Secure. Continuous. Intelligent.
      </p>
      <p className="text-xs text-muted-foreground/50">
        © 2026 Behavioral Biometrics Research Project
      </p>
    </div>
  </footer>
);

export default Footer;
