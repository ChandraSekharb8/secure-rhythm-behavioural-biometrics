import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/context/AuthContext";
import { createUserProfile, fetchProfiles } from "@/lib/api";

const AddUserPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avgDwell, setAvgDwell] = useState("120");
  const [avgFlight, setAvgFlight] = useState("180");
  const [tolerance, setTolerance] = useState("40");
  const [color, setColor] = useState("#00d2d3");
  const [fallbackPassword, setFallbackPassword] = useState("");
  const [confirmFallbackPassword, setConfirmFallbackPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createUserProfile,
    onSuccess: async (profile) => {
      setMessage(`User profile "${profile.name}" created successfully.`);
      setErrorMessage(null);
      setName("");
      setEmail("");
      setFallbackPassword("");
      setConfirmFallbackPassword("");
      await profilesQuery.refetch();
    },
    onError: (error) => {
      setMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create user profile");
    },
  });

  if (!loading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Name is required");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required");
      return;
    }

    if (fallbackPassword !== confirmFallbackPassword) {
      setErrorMessage("Fallback passwords do not match");
      return;
    }

    await createMutation.mutateAsync({
      name: name.trim(),
      email: email.trim(),
      avgDwell: Number(avgDwell),
      avgFlight: Number(avgFlight),
      tolerance: Number(tolerance),
      color,
      fallbackPassword,
    });
  };

  const profiles = profilesQuery.data ?? [];

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
            Add <span className="text-gradient">User Profile</span>
          </h1>
          <p className="section-subtitle">
            Signup/login is required. Create a new typing biometric user for authentication.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="font-display text-sm tracking-wider text-foreground">
                CREATE USER
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">User name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="e.g. New User"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Email or username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="user@example.com or username"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Avg Dwell (ms)</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={avgDwell}
                    onChange={(event) => setAvgDwell(event.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Avg Flight (ms)</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={avgFlight}
                    onChange={(event) => setAvgFlight(event.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Tolerance</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={tolerance}
                    onChange={(event) => setTolerance(event.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-full h-10 bg-muted/50 border border-border rounded-lg px-2 py-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Fallback password
                </label>
                <input
                  type="password"
                  value={fallbackPassword}
                  onChange={(event) => setFallbackPassword(event.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="At least 8 chars, include letter and number"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Confirm fallback password
                </label>
                <input
                  type="password"
                  value={confirmFallbackPassword}
                  onChange={(event) => setConfirmFallbackPassword(event.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
              {message && (
                <p className="text-xs text-primary inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full rounded-lg bg-primary/20 border border-primary/40 text-primary px-4 py-2 text-sm font-display hover:bg-primary/30 transition-colors disabled:opacity-60"
              >
                {createMutation.isPending ? "Creating..." : "Create User Profile"}
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="font-display text-sm tracking-wider text-foreground mb-3">
              ACTIVE USERS ({profiles.length})
            </h2>
            {profilesQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            )}
            {profilesQuery.isError && (
              <p className="text-sm text-destructive">
                {profilesQuery.error instanceof Error
                  ? profilesQuery.error.message
                  : "Failed to load users"}
              </p>
            )}
            {!profilesQuery.isLoading && !profilesQuery.isError && (
              <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <p className="text-sm text-foreground font-display">{profile.name}</p>
                    <p>Email: {profile.email || "-"}</p>
                    <p>Dwell: {profile.avgDwell} ms</p>
                    <p>Flight: {profile.avgFlight} ms</p>
                    <p>Tolerance: {profile.tolerance}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AddUserPage;
