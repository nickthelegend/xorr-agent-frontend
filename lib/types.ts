export type Mode = "simulation" | "live";
export type TradeStatus = "open" | "win" | "loss" | "breakeven";
export type ExitReason =
  | "TRAIL_STOP_PROFIT"
  | "SL_HIT"
  | "TP_HIT"
  | "MAX_HOLD_TIME"
  | "STAGNATION_EXIT"
  | "STRATEGY_FLIP"
  | "MANUAL_CLOSE"
  | "KILL_SWITCH";

export interface OverviewResponse {
  asOf: string;                    // ISO timestamp
  mode: Mode;
  portfolio: {
    totalUsd: number;              // 12.32
    totalReturnPct: number;        // -10.47
    usdt: number;
    bnb: number;
    bnbUsd: number;                // gas valuation
  };
  pnl: {
    totalUsd: number;              // 0.27
    closedTrades: number;          // 16
    bestTradeUsd: number;          // 0.57
    worstTradeUsd: number;         // -0.19
  };
  winRate: {
    pct: number;                   // 31.2
    wins: number;
    losses: number;
  };
  openPositions: {
    count: number;
    monitoredEverySec: number;     // 60
  };
  fearGreed: {
    value: number;                 // 23
    label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
    annotation: string;            // "AI halves position size in Extreme Fear..."
  };
  sessionPerf: {
    competition: { winRatePct: number; trades: string; }; // "5/15"
    qualifier:   { winRatePct: number; trades: string; }; // "0/1"
  };
  equityCurve: { t: string; equityUsd: number; }[];       // last 14 days, 1pt/hr
}

export interface Trade {
  id: string;
  openedAt: string;
  closedAt: string | null;
  symbol: string;
  contract: string;                // checksummed address
  status: TradeStatus;
  invested: number;                // USDT in
  pnlUsd: number;
  pnlPct: number;
  holdMinutes: number;
  entryMarketCap: number | null;
  exitMarketCap: number | null;
  score: number;                   // brain score 0-100
  exitReason: ExitReason | null;
  bundlerPct: number;              // 0 for spot
  devPct: number;
  snipers: number;
  window: "COMPETITION" | "QUALIFIER";
  txOpen: string;
  txClose: string | null;
  strategy: string;
}

export interface DecisionLogEntry {
  id: string;
  t: string;                       // ISO
  symbol: string;
  action: "ENTER" | "SKIP" | "EXIT" | "HOLD" | "RESIZE" | "MODE_CHANGE";
  strategy: string;
  filtersPassed: string[];         // e.g. ["vedic_timing","regime","cex_sanity","liquidity"]
  filtersBlocked: string[];
  brainScore: number;
  reasoning: string;               // markdown-safe text
  marketSnapshot: Record<string, number>;
}

export interface WalletResponse {
  address: string;
  network: "bsc-mainnet" | "bsc-testnet";
  balances: { symbol: string; amount: number; usd: number; contract?: string; }[];
  gasOk: boolean;
  gasThresholdBnb: number;
  qrPngBase64: string;             // address QR
}

export interface SettingsPayload {
  scanIntervalSec: number;
  maxConcurrentPositions: number;
  baseTradeSizeUsd: number;
  slippageBpsSpot: number;
  slippageBpsNews: number;
  maxDrawdownPct: number;
  killDrawdownPct: number;
  cexDeviationBps: number;
  liquidityImpactBps: number;
  enableVedicFilter: boolean;
  enableNewsCatalyst: boolean;
  groqModel: string;
}

export interface LogEntry {
  t: string;
  level: "info" | "warn" | "error" | "debug";
  msg: string;
}
