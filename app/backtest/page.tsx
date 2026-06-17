"use client";

import React, { useEffect, useState, useRef } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import KpiNumber from "../../components/ui/KpiNumber";
import SectionLabel from "../../components/ui/SectionLabel";
import Button from "../../components/ui/Button";
import EquityCurve from "../../components/overview/EquityCurve";
import { xorrApi } from "../../lib/api";
import { formatMoney, formatPercent } from "../../lib/format";
import { RefreshCw, Play, Shield, BarChart3, AlertCircle } from "lucide-react";

const STRATEGIES_LIST = [
  { id: "momentum_pullback", name: "Momentum Pullback" },
  { id: "fib_golden_pocket", name: "Fib Golden Pocket" },
  { id: "capitulation", name: "Capitulation Wick" },
  { id: "news_catalyst", name: "News Catalyst" },
  { id: "mean_reversion", name: "Mean Reversion" },
  { id: "trend_follow", name: "Trend Follow" },
  { id: "vol_squeeze", name: "Vol Squeeze" },
  { id: "whale_flow", name: "Whale Flow" },
];

export default function BacktestPage() {
  const [windowDays, setWindowDays] = useState<number>(30);
  const [qualityMode, setQualityMode] = useState<boolean>(true);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(
    STRATEGIES_LIST.map((s) => s.id)
  );
  
  // Running state
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    pct: number;
    currentSymbol: string;
    tradesSoFar: number;
  }>({ pct: 0, currentSymbol: "", tradesSoFar: 0 });
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Results & History
  const [report, setReport] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const loadHistory = async () => {
    try {
      const data = await xorrApi.getBacktestRuns();
      setRuns(data);
    } catch (err: any) {
      console.error("Failed to load runs history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStrategyToggle = (id: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunBacktest = async () => {
    if (running) return;
    setError(null);
    setReport(null);
    setRunning(true);
    setProgress({ pct: 0, currentSymbol: "", tradesSoFar: 0 });

    try {
      // Trigger run
      const { runId } = await xorrApi.runBacktest(windowDays, selectedStrategies, qualityMode);
      setCurrentRunId(runId);

      // Start listening to SSE stream
      const API_BASE = process.env.NEXT_PUBLIC_XORR_API || "http://localhost:8000";
      const es = new EventSource(`${API_BASE}/api/stream/backtest/${runId}`);
      eventSourceRef.current = es;

      es.addEventListener("backtest_progress", async (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          setProgress({
            pct: payload.pct,
            currentSymbol: payload.current_symbol || "",
            tradesSoFar: payload.trades_so_far
          });

          if (payload.status === "complete") {
            es.close();
            setRunning(false);
            // Fetch final report
            const finalReport = await xorrApi.getBacktestReport(runId);
            setReport(finalReport);
            loadHistory();
          } else if (payload.status === "failed") {
            es.close();
            setRunning(false);
            setError("Backtest run execution failed in background.");
          }
        } catch (e) {
          console.error("Parsing progress event failed:", e);
        }
      });

      es.addEventListener("error", () => {
        es.close();
        setRunning(false);
        setError("Connection to backtest progress stream lost.");
      });

    } catch (err: any) {
      setError(err.message || "Failed to launch backtest.");
      setRunning(false);
    }
  };

  const handleLoadReport = async (runId: string) => {
    setError(null);
    try {
      const data = await xorrApi.getBacktestReport(runId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to load report.");
    }
  };

  const pnlIsPositive = report && report.total_pnl_pct >= 0;

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] pb-10 pr-2">
      <PageTitle title="Backtest" subtitle="WALK-FORWARD VALIDATION" />

      {/* Configuration Control Panel */}
      <Card>
        <SectionLabel>RUN BACKTEST CONFIGURATION</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          
          {/* Left panel: parameters */}
          <div className="lg:col-span-5 space-y-4">
            {/* Window selector */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-xr-text-dim uppercase tracking-wider block">
                Historical Window
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setWindowDays(days)}
                    className={`py-1.5 px-3 rounded text-xs font-mono border transition-all ${
                      windowDays === days
                        ? "bg-xr-mint/10 border-xr-mint text-xr-mint"
                        : "bg-xr-bg-elev-2 border-xr-border text-xr-text-dim hover:text-xr-text hover:border-xr-text-dim"
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-xr-bg-elev-2/50 border border-xr-border rounded-md">
              <div className="flex flex-col space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-xr-text flex items-center space-x-1.5">
                  <Shield className="h-3.5 w-3.5 text-xr-mint" />
                  <span>Quality Mode</span>
                </span>
                <span className="text-[10px] text-xr-text-dim leading-relaxed">
                  Strict confluence threshold (78), min final confidence (0.72)
                </span>
              </div>
              <button
                onClick={() => setQualityMode((prev) => !prev)}
                className={`w-10 h-5 rounded-full p-0.5 transition-all select-none cursor-pointer ${
                  qualityMode ? "bg-xr-mint" : "bg-xr-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-xr-bg-elev-2 shadow transition-transform ${
                    qualityMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Run Button */}
            <Button
              className="w-full font-mono text-xs py-2 bg-xr-violet text-xr-bg-elev-2 hover:bg-xr-mint hover:text-xr-bg-elev-2 uppercase tracking-wider font-semibold flex items-center justify-center space-x-2 rounded transition-colors"
              onClick={handleRunBacktest}
              disabled={running || selectedStrategies.length === 0}
            >
              {running ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-xr-bg-elev-2" />
                  <span>Running Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 text-xr-bg-elev-2 fill-current" />
                  <span>Execute Walk-Forward</span>
                </>
              )}
            </Button>
          </div>

          {/* Right panel: strategy selection */}
          <div className="lg:col-span-7 space-y-2">
            <label className="font-mono text-xs text-xr-text-dim uppercase tracking-wider block">
              Strategies to Evaluate ({selectedStrategies.length}/8)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STRATEGIES_LIST.map((strat) => {
                const isSelected = selectedStrategies.includes(strat.id);
                return (
                  <button
                    key={strat.id}
                    onClick={() => handleStrategyToggle(strat.id)}
                    className={`p-2.5 rounded text-left border transition-all flex flex-col justify-between h-14 ${
                      isSelected
                        ? "bg-xr-violet/10 border-xr-violet/60 text-xr-violet font-medium"
                        : "bg-xr-bg-elev-2/40 border-xr-border/60 text-xr-text-dim hover:text-xr-text"
                    }`}
                  >
                    <span className="text-[11px] font-sans truncate">{strat.name}</span>
                    <span className="font-mono text-[9px] text-xr-text-faint">
                      {isSelected ? "ACTIVE" : "SHADOW"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Feedback Display */}
      {running && (
        <Card className="border-xr-mint/40 bg-xr-mint/5 animate-pulse">
          <SectionLabel className="text-xr-mint">SIMULATION RUNNING IN BACKGROUND</SectionLabel>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between font-mono text-xs">
              <span>Progress: {progress.pct}%</span>
              <span>Symbol: {progress.currentSymbol || "N/A"}</span>
              <span>Simulated Trades: {progress.tradesSoFar}</span>
            </div>
            {/* Progress bar container */}
            <div className="w-full bg-xr-bg-elev-2 h-1.5 rounded-full overflow-hidden border border-xr-border">
              <div
                className="bg-xr-mint h-full transition-all duration-300"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="border-xr-loss/40 bg-xr-loss/5 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-xr-loss mt-0.5 flex-shrink-0" />
          <div>
            <SectionLabel className="text-xr-loss">EXECUTION EXCEPTION</SectionLabel>
            <p className="text-xs font-mono text-xr-text mt-1">{error}</p>
          </div>
        </Card>
      )}

      {/* Results Panel */}
      {report && (
        <div className="space-y-6">
          
          {/* Row 1: KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <KpiNumber label="TOTAL TRADES" value={report.total_trades} />
            </Card>
            <Card>
              <KpiNumber
                label="WIN RATE"
                value={`${report.win_rate}%`}
                subValue={`${report.wins} wins / ${report.losses} losses`}
              />
            </Card>
            <Card>
              <KpiNumber
                label="EXPECTANCY"
                value={
                  <span className={report.expectancy_r >= 0.3 ? "text-xr-mint" : "text-xr-loss"}>
                    {report.expectancy_r.toFixed(2)} R
                  </span>
                }
              />
            </Card>
            <Card>
              <KpiNumber label="PROFIT FACTOR" value={report.profit_factor.toFixed(2)} />
            </Card>
            <Card>
              <KpiNumber
                label="TOTAL PNL"
                value={
                  <span className={pnlIsPositive ? "text-xr-win" : "text-xr-loss"}>
                    {report.total_pnl_pct}%
                  </span>
                }
              />
            </Card>
            <Card>
              <KpiNumber label="MAX DD" value={`${report.max_drawdown_pct}%`} />
            </Card>
          </div>

          {/* Row 2: Equity curve */}
          <Card>
            <SectionLabel>EQUITY CURVE PROGRESSION</SectionLabel>
            <div className="mt-4">
              <EquityCurve
                data={report.equity_curve.map((pt: any) => ({
                  t: pt.t,
                  equityUsd: pt.equity
                }))}
              />
            </div>
          </Card>

          {/* Row 3: Strategy breakdown & Symbol breakdown tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Strategy Table */}
            <Card className="lg:col-span-6">
              <SectionLabel>PER-STRATEGY METRICS</SectionLabel>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-xr-border text-xr-text-faint pb-2 uppercase tracking-wider text-[10px]">
                      <th className="py-2">Strategy</th>
                      <th className="py-2 text-right">Trades</th>
                      <th className="py-2 text-right">Win Rate</th>
                      <th className="py-2 text-right">Expectancy</th>
                      <th className="py-2 text-right">PnL USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-xr-border/60">
                    {Object.entries(report.by_strategy || {})
                      .sort((a: any, b: any) => b[1].expectancy_r - a[1].expectancy_r)
                      .map(([name, data]: any) => (
                        <tr key={name} className="hover:bg-xr-bg-elev-2/30 transition-colors">
                          <td className="py-2.5 font-sans capitalize">{name.replace("_", " ")}</td>
                          <td className="py-2.5 text-right">{data.trades}</td>
                          <td className="py-2.5 text-right text-xr-text">{data.win_rate}%</td>
                          <td
                            className={`py-2.5 text-right ${
                              data.expectancy_r >= 0 ? "text-xr-mint" : "text-xr-loss"
                            }`}
                          >
                            {data.expectancy_r > 0 ? "+" : ""}
                            {data.expectancy_r}R
                          </td>
                          <td
                            className={`py-2.5 text-right font-semibold ${
                              data.pnl_usd >= 0 ? "text-xr-win" : "text-xr-loss"
                            }`}
                          >
                            ${data.pnl_usd.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Symbol Table */}
            <Card className="lg:col-span-6">
              <SectionLabel>TOP 15 SYMBOLS BY EXPECTANCY</SectionLabel>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-xr-border text-xr-text-faint pb-2 uppercase tracking-wider text-[10px]">
                      <th className="py-2">Symbol</th>
                      <th className="py-2 text-right">Trades</th>
                      <th className="py-2 text-right">Win Rate</th>
                      <th className="py-2 text-right">Expectancy</th>
                      <th className="py-2 text-right">PnL USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-xr-border/60">
                    {Object.entries(report.by_symbol || {})
                      .sort((a: any, b: any) => b[1].expectancy_r - a[1].expectancy_r)
                      .slice(0, 15)
                      .map(([sym, data]: any) => (
                        <tr key={sym} className="hover:bg-xr-bg-elev-2/30 transition-colors">
                          <td className="py-2.5 text-xr-mint font-semibold">{sym}</td>
                          <td className="py-2.5 text-right">{data.trades}</td>
                          <td className="py-2.5 text-right text-xr-text">{data.win_rate}%</td>
                          <td
                            className={`py-2.5 text-right ${
                              data.expectancy_r >= 0 ? "text-xr-mint" : "text-xr-loss"
                            }`}
                          >
                            {data.expectancy_r > 0 ? "+" : ""}
                            {data.expectancy_r}R
                          </td>
                          <td
                            className={`py-2.5 text-right font-semibold ${
                              data.pnl_usd >= 0 ? "text-xr-win" : "text-xr-loss"
                            }`}
                          >
                            ${data.pnl_usd.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

        </div>
      )}

      {/* History Panel */}
      <Card>
        <SectionLabel>HISTORICAL BACKTEST RUNS</SectionLabel>
        <div className="mt-4 overflow-x-auto">
          {loadingHistory ? (
            <div className="flex items-center space-x-2 py-4 justify-center">
              <RefreshCw className="h-4 w-4 animate-spin text-xr-mint" />
              <span className="font-mono text-xs text-xr-text-dim">Retrieving history...</span>
            </div>
          ) : runs.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-xr-text-faint">
              NO PREVIOUS BACKTEST RUNS DETECTED IN DATABASE.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-xr-border text-xr-text-faint pb-2 uppercase tracking-wider text-[10px]">
                  <th className="py-2">Run ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Window</th>
                  <th className="py-2">Quality</th>
                  <th className="py-2 text-right">Trades</th>
                  <th className="py-2 text-right">Win Rate</th>
                  <th className="py-2 text-right">Expectancy</th>
                  <th className="py-2 text-right">PnL %</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-xr-border/60">
                {runs.map((r: any) => (
                  <tr key={r.run_id} className="hover:bg-xr-bg-elev-2/30 transition-colors">
                    <td className="py-2.5 text-xr-text-dim truncate max-w-[120px]" title={r.run_id}>
                      {r.run_id}
                    </td>
                    <td className="py-2.5 text-xr-text-dim">
                      {new Date(r.started_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5">{r.window_days}D</td>
                    <td className="py-2.5">{r.quality_mode ? "ON" : "OFF"}</td>
                    <td className="py-2.5 text-right">{r.total_trades}</td>
                    <td className="py-2.5 text-right">{r.win_rate}%</td>
                    <td
                      className={`py-2.5 text-right ${
                        r.expectancy_r >= 0 ? "text-xr-mint" : "text-xr-loss"
                      }`}
                    >
                      {r.expectancy_r > 0 ? "+" : ""}
                      {r.expectancy_r}R
                    </td>
                    <td
                      className={`py-2.5 text-right font-semibold ${
                        r.total_pnl_pct >= 0 ? "text-xr-win" : "text-xr-loss"
                      }`}
                    >
                      {r.total_pnl_pct > 0 ? "+" : ""}
                      {r.total_pnl_pct}%
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleLoadReport(r.run_id)}
                        className="text-xr-mint hover:underline font-semibold"
                      >
                        Load Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

    </div>
  );
}
