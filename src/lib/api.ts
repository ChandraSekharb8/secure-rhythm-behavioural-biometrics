const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const AUTH_TOKEN_STORAGE_KEY = "secure_rhythm_auth_token";

let authToken: string | null =
  typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;

type HttpMethod = "GET" | "POST";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
};

const getUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL.endsWith("/")) {
    return `${API_BASE_URL.slice(0, -1)}${normalizedPath}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(getUrl(path), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const details = Array.isArray(errorBody.details)
      ? errorBody.details.join("; ")
      : null;
    const message = details
      ? `${errorBody.message ?? "API request failed"}: ${details}`
      : (errorBody.message ?? "API request failed");
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const setAuthToken = (token: string) => {
  authToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = () => authToken;

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends AuthPayload {
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface IdentifyPayload {
  typedText?: string;
  promptText?: string;
  dwellTimes: number[];
  flightTimes: number[];
  keyCount?: number;
  backspaceCount?: number;
}

export interface TypingFeatureMetrics {
  keyCount: number;
  backspaceCount: number;
  backspaceRate: number;
  typingDurationMs: number;
  wpm: number;
  wps: number;
  cps: number;
  promptMatchRatio: number;
  dwellVariance: number;
  flightVariance: number;
  consistencyScore: number;
  tenSecondWpm: number;
  tenSecondWps: number;
  tenSecondMatch: boolean;
}

export interface IdentifyResponse {
  sessionId: string;
  detectedUser: string;
  confidence: number;
  authStatus: "authenticated" | "fallback" | "otp_pending";
  otpRequired?: boolean;
  otpChallengeId?: string | null;
  otpDestination?: string | null;
  avgDwell: number;
  avgFlight: number;
  threshold: number;
  featureMetrics?: TypingFeatureMetrics;
  warnings?: string[];
  modelInsights?: {
    modelType: string;
    uncertaintyMethod: string;
    uncertainty: number;
    components?: {
      distanceScore: number;
      behaviorScore: number;
      temporalScore: number;
    };
  };
}

export interface FallbackPayload {
  password: string;
  detectedUser?: string;
  sessionId?: string;
}

export interface FallbackResponse {
  sessionId: string | null;
  detectedUser: string;
  authStatus: "authenticated" | "denied" | "otp_pending";
  confidence: number;
  otpRequired?: boolean;
  otpChallengeId?: string | null;
  otpDestination?: string | null;
}

export interface VerifyOtpPayload {
  challengeId: string;
  otpCode: string;
  sessionId?: string;
}

export interface VerifyOtpResponse {
  sessionId: string | null;
  detectedUser: string;
  authStatus: "authenticated" | "denied" | "otp_pending";
  confidence: number;
  otpVerified: boolean;
  attemptsLeft: number;
}

export interface DashboardUser {
  name: string;
  color: string;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avgDwell: number;
  avgFlight: number;
  tolerance: number;
  color: string;
}

export interface CreateProfilePayload {
  name: string;
  email: string;
  avgDwell: number;
  avgFlight: number;
  tolerance: number;
  color: string;
  fallbackPassword: string;
}

export interface DashboardData {
  users: DashboardUser[];
  colors: Record<string, string>;
  dwellData: Array<Record<string, string | number>>;
  flightData: Array<Record<string, string | number>>;
  comparisonData: Array<{ name: string; dwellTime: number; flightTime: number }>;
  confidenceData: Array<{ session: number; confidence: number }>;
  clusterData: Array<{ dwell: number; flight: number; user: string }>;
  resultDistribution: Array<{ result: string; count: number }>;
  featureTrendData: Array<{
    session: number;
    wpm: number;
    wps: number;
    tenSecondWpm: number;
    promptMatchRatio: number;
    consistencyScore: number;
    backspaceRate: number;
  }>;
  tenSecondMatchByUser: Array<{ user: string; matchRate: number }>;
  featureAverages: Array<{ feature: string; value: number }>;
  sampleCount: number;
  updatedAt: string;
}

export interface DslAnalysisData {
  meta: {
    datasetPath: string;
    loadedAt: string;
    totalRows: number;
    subjectCount: number;
    sessionCount: number;
    timingFeatureCount: number;
  };
  cards: {
    totalRows: number;
    subjectCount: number;
    sessionCount: number;
    timingFeatureCount: number;
    negativeValueCount: number;
    avgRowDuration: number;
  };
  charts: {
    subjectDistribution: Array<{ subject: string; count: number }>;
    sessionDistribution: Array<{ sessionIndex: string; count: number }>;
    repetitionDistribution: Array<{ rep: string; count: number }>;
    holdLatencyBySubject: Array<{ subject: string; avgHold: number; avgLatency: number }>;
    featureMeanComparison: Array<{ feature: string; mean: number }>;
    hPeriodHistogram: Array<{ bin: string; count: number }>;
    ddPeriodHistogram: Array<{ bin: string; count: number }>;
    udPeriodHistogram: Array<{ bin: string; count: number }>;
    negativeValueByFeature: Array<{ feature: string; count: number }>;
    scatterBySubject: Array<{ subject: string; hPeriod: number; ddPeriodT: number }>;
  };
}

export interface MlModelMetrics {
  datasetTop1?: number;
  datasetTop3?: number;
  datasetTop5?: number;
  trainTop1?: number;
  trainTop3?: number;
  trainTop5?: number;
  valTop1: number;
  valTop3: number;
  valTop5: number;
  meetsTarget: boolean;
}

export interface MlModelCard {
  name: string;
  displayName: string;
  description: string;
  metrics: MlModelMetrics;
}

export interface MlModelHistoryPoint {
  epoch: number;
  cnnTrainTop1: number;
  cnnValTop1: number;
  lstmTrainTop1: number;
  lstmValTop1: number;
  ensembleValTop1: number;
}

export interface MlModelReport {
  version: string;
  trainedAt: string;
  targetAccuracy: number;
  sampleCount: number;
  classCount: number;
  models: MlModelCard[];
  history: MlModelHistoryPoint[];
}

export interface SessionItem {
  id: string;
  detectedUser: string;
  confidence: number;
  authStatus: "authenticated" | "fallback" | "denied" | "otp_pending";
  result: "pass" | "fail";
  authMethod: "typing" | "typing+fallback" | "password-only";
  avgDwell: number;
  avgFlight: number;
  typingSpeedWpm: number;
  typingSpeedWps: number;
  charsPerSecond: number;
  promptMatchRatio: number;
  backspaceRate: number;
  consistencyScore: number;
  tenSecondWpm: number;
  tenSecondMatch: boolean;
  keyCount: number;
  backspaceCount: number;
  typingDurationMs: number;
  createdAt: string;
  typedText: string;
  promptText: string;
  warnings: string[];
  fallbackAttempted: boolean;
  fallbackSuccessful: boolean;
}

export interface SessionSummary {
  totalSessions: number;
  avgConfidence: number;
  avgDwell: number;
  avgFlight: number;
  avgTypingSpeedWpm: number;
  avgTypingSpeedWps: number;
  avgCharsPerSecond: number;
  avgPromptMatchRatio: number;
  avgBackspaceRate: number;
  avgConsistencyScore: number;
  avgTenSecondWpm: number;
  tenSecondMatchRate: number;
  passwordOnlyCount: number;
  warningCount: number;
  authenticatedCount: number;
  fallbackCount: number;
  deniedCount: number;
  otpPendingCount: number;
  successRate: number;
}

export type SessionQuery = {
  limit?: number;
  authStatus?: "authenticated" | "fallback" | "denied" | "otp_pending";
  from?: string;
  to?: string;
};

const toQueryString = (query?: SessionQuery) => {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.authStatus) params.set("authStatus", query.authStatus);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const text = params.toString();
  return text ? `?${text}` : "";
};

export const signupAccount = (payload: SignupPayload) =>
  request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });

export const loginAccount = (payload: AuthPayload) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });

export const fetchCurrentAccount = () =>
  request<{ user: AuthUser }>("/auth/me").then((res) => res.user);

export const identifyTyping = (payload: IdentifyPayload) =>
  request<IdentifyResponse>("/auth/identify", {
    method: "POST",
    body: payload,
  });

export const verifyFallback = (payload: FallbackPayload) =>
  request<FallbackResponse>("/auth/fallback", {
    method: "POST",
    body: payload,
  });

export const verifyOtp = (payload: VerifyOtpPayload) =>
  request<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: payload,
  });

export const fetchDashboardData = () => request<DashboardData>("/analytics/charts");

export const fetchDslAnalysis = (top = 15) =>
  request<DslAnalysisData>(`/analysis/dsl?top=${top}`);

export const fetchMlModelReport = () =>
  request<MlModelReport>("/analysis/model/report");

export const fetchProfiles = () =>
  request<{ users: ProfileUser[] }>("/users/profiles").then((res) => res.users);

export const createUserProfile = (payload: CreateProfilePayload) =>
  request<{ user: ProfileUser }>("/users/profiles", {
    method: "POST",
    body: payload,
  }).then((res) => res.user);

export const fetchSessionHistory = (query?: SessionQuery) =>
  request<{ sessions: SessionItem[] }>(`/sessions${toQueryString(query)}`).then(
    (res) => res.sessions,
  );

export const fetchSessionSummary = (query?: SessionQuery) =>
  request<SessionSummary>(`/sessions/summary${toQueryString(query)}`);
