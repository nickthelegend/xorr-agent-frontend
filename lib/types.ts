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
  pnlUsd: number;                  // live unrealized for open trades, realized for closed
  pnlPct: number;
  holdMinutes: number;
  entryPrice: number | null;       // USD fill price at entry
  exitPrice: number | null;        // USD fill price at exit (null while open)
  markPrice: number | null;        // current mark (open) or exit price (closed)
  unrealized: boolean;             // true while the position is open
  entryMarketCap: number | null;
  exitMarketCap: number | null;
  score: number;                   // brain score 0-100
  exitReason: ExitReason | null;
  window: "COMPETITION" | "QUALIFIER";
  txOpen: string;
  txClose: string | null;
  strategy: string;
  // Perp fields (spot trades default to long / spot / 1x)
  isPerp?: boolean;
  venue?: "spot" | "perp";
  direction?: "long" | "short";
  leverage?: number;
  liquidationPrice?: number;
}

export interface CouncilVote {
  model: string;
  score: number;
  reasoning: string;
  redFlags: string[];
  latencyMs: number;
}

export interface CouncilDecision {
  councilScore: number;
  consensus: number;          // stddev
  finalConfidence: number;
  votes: CouncilVote[];
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
  council?: CouncilDecision;       // present for ENTER/SKIP, absent for HOLD/EXIT
  confluence?: number;
  confluenceBreakdown?: Record<string, number>;
}

export interface WalletResponse {
  address: string;
  network: "bsc-mainnet" | "bsc-testnet";
  balances: { symbol: string; amount: number; usd: number; contract?: string; }[];
  gasOk: boolean;
  gasThresholdBnb: number;
  simulation: boolean;             // true => balances above are the paper portfolio
  onchain: {                       // the REAL self-custody wallet (fund this address)
    address: string;
    bnb: number;
    bnbUsd: number;
    usdt: number;
    gasOk: boolean;
  };
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
  qualityMode: boolean;
  confluenceThreshold: number;
  councilMinFinalConfidence: number;
  groqModel: string;
  groqCouncilPrimary: string;
  groqCouncilVerifier: string;
  groqCouncilFast: string;
  enableStrategyMomentumPullback: boolean;
  enableStrategyFibGoldenPocket: boolean;
  enableStrategyCapitulation: boolean;
  enableStrategyNewsCatalyst: boolean;
  enableStrategyMeanReversion: boolean;
  enableStrategyTrendFollow: boolean;
  enableStrategyVolSqueeze: boolean;
  enableStrategyWhaleFlow: boolean;
}

export interface LogEntry {
  t: string;
  level: "info" | "warn" | "error" | "debug";
  msg: string;
}
