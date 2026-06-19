import {
  OverviewResponse,
  Trade,
  DecisionLogEntry,
  WalletResponse,
  SettingsPayload,
  Mode,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_XORR_API || "http://localhost:8000";

class XorrApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "XorrApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errMsg = "API Request failed";
    let errCode = "UNKNOWN_ERROR";
    try {
      const body = await response.json();
      if (body?.error) {
        errMsg = body.error.message || errMsg;
        errCode = body.error.code || errCode;
      }
    } catch {
      // ignore parse failure on non-JSON error pages
    }
    throw new XorrApiError(errMsg, response.status, errCode);
  }

  return response.json() as Promise<T>;
}

export const xorrApi = {
  getHealth: () =>
    request<{
      ok: boolean;
      db: boolean;
      scheduler: { running: boolean; scan_alive: boolean; monitor_alive: boolean; scan_age_sec: number | null; monitor_age_sec: number | null };
      wsFeed: { started: boolean; connected: boolean; symbols: number; last_msg_age_sec: number | null };
      liqFeed: { started: boolean; connected: boolean; symbols_tracked: number; last_event_age_sec: number | null };
      t: string;
    }>("/api/health"),
  getReadiness: () =>
    request<{
      mode: string;
      tradingVenue?: string;
      spotOnly?: boolean;
      fundableAddress: string | null;
      capabilities: { spotLive: boolean; perpsLive: boolean; simulation: boolean };
      requiredReady: string;
      readyForSpotLive: boolean;
      readyForPerpsLive: boolean;
      checks: { key: string; label: string; ok: boolean; detail: string; optional: boolean; fix: string }[];
    }>("/api/readiness"),
  getOverview: () => request<OverviewResponse>("/api/overview"),
  getTrades: (window: "all" | "competition" | "qualifier" = "all") =>
    request<Trade[]>(`/api/trades?window=${window}`),
  getOpenTrades: () => request<Trade[]>("/api/trades/open"),
  getDecisions: (limit: number = 50) =>
    request<DecisionLogEntry[]>(`/api/brain/decisions?limit=${limit}`),
  getLatestDecision: () => request<DecisionLogEntry>("/api/brain/latest"),
  getWallet: () => request<WalletResponse>("/api/wallet"),
  refreshWallet: () => request<WalletResponse>("/api/wallet/refresh", { method: "POST" }),
  getSettings: () => request<SettingsPayload>("/api/settings"),
  saveSettings: (settings: Partial<SettingsPayload>) =>
    request<SettingsPayload>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    }),
  setMode: (mode: Mode) =>
    request<{ mode: Mode; success: boolean }>("/api/engine/mode", {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),
  triggerScan: () => request<{ success: boolean }>("/api/engine/scan", { method: "POST" }),
  getRegistration: () =>
    request<{ registered: boolean; tx: string | null; address: string | null; mode: Mode; contract: string }>(
      "/api/engine/registration"
    ),
  registerCompetition: () =>
    request<{ success: boolean; tx: string; simulated: boolean }>("/api/engine/register", { method: "POST" }),
  startEngine: (force: boolean = false) =>
    request<{ success: boolean; state: string }>(`/api/engine/start${force ? "?force=true" : ""}`, {
      method: "POST",
    }),
  stopEngine: () => request<{ success: boolean; state: string }>("/api/engine/stop", { method: "POST" }),
  
  // Backtest APIs
  runBacktest: (windowDays: number, strategies: string[], qualityMode: boolean) =>
    request<{ runId: string }>("/api/backtest/run", {
      method: "POST",
      body: JSON.stringify({ windowDays, strategies, qualityMode }),
    }),
  getBacktestRuns: () => request<any[]>("/api/backtest/runs"),
  getBacktestReport: (runId: string) => request<any>(`/api/backtest/runs/${runId}`),
  
  // Learning APIs
  getLearningStats: () => request<any>("/api/learning/stats"),
  toggleStrategy: (name: string, enabled: boolean) =>
    request<any>(`/api/settings/strategy/${name}`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
    
  // Council APIs
  getCouncilHealth: () => request<{ primary: number; verifier: number; fast: number }>("/api/council/health"),
  
  // MCP APIs
  getMcpSkills: () => request<any[]>("/api/mcp/skills"),
  refreshMcpSkills: () => request<any>("/api/mcp/refresh", { method: "POST" }),
};
