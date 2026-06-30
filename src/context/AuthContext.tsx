import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuthToken,
  fetchCurrentAccount,
  getAuthToken,
  loginAccount,
  setAuthToken,
  signupAccount,
  type AuthPayload,
  type AuthUser,
  type SignupPayload,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: AuthPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const current = await fetchCurrentAccount();
        setUser(current);
      } catch (error) {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapAuth();
  }, []);

  const login = async (payload: AuthPayload) => {
    const response = await loginAccount(payload);
    setAuthToken(response.token);
    setUser(response.user);
  };

  const signup = async (payload: SignupPayload) => {
    const response = await signupAccount(payload);
    setAuthToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

