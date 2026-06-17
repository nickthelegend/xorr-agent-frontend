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
  getHealth: () => request<{ ok: boolean; ts: string }>("/api/health"),
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
  startEngine: (force: boolean = false) =>
    request<{ success: boolean; state: string }>(`/api/engine/start${force ? "?force=true" : ""}`, {
      method: "POST",
    }),
  stopEngine: () => request<{ success: boolean; state: string }>("/api/engine/stop", { method: "POST" }),
};
