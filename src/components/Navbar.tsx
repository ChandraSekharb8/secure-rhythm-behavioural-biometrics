import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  BarChart3,
  Info,
  History,
  LogOut,
  LogIn,
  LineChart,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Shield },
  { path: "/graph", label: "Graph", icon: BarChart3 },
  { path: "/analysis", label: "Analysis", icon: LineChart },
  { path: "/add-user", label: "Add User", icon: UserPlus },
  { path: "/about", label: "About", icon: Info },
];

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const items = isAuthenticated
    ? [...navItems, { path: "/sessions", label: "Sessions", icon: History }]
    : navItems;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-border">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-display text-sm font-bold tracking-wider text-foreground">
              KEYSTROKE<span className="text-primary">ID</span>
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-0.5">
              Behavioral Biometrics
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {items.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link flex items-center gap-2 ${
                location.pathname === path ? "active text-primary" : ""
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-xs text-muted-foreground px-2">
                {user?.fullName}
              </span>
              <button
                onClick={logout}
                className="nav-link flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={`nav-link flex items-center gap-2 ${
                location.pathname === "/auth" ? "active text-primary" : ""
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
