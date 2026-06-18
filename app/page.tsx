"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../components/chrome/PageTitle";
import Card from "../components/ui/Card";
import KpiNumber from "../components/ui/KpiNumber";
import SectionLabel from "../components/ui/SectionLabel";
import Button from "../components/ui/Button";
import EquityCurve from "../components/overview/EquityCurve";
import FearGreedGauge from "../components/overview/FearGreedGauge";
import { xorrApi } from "../lib/api";
import { OverviewResponse, Trade } from "../lib/types";
import { formatMoney, formatPercent } from "../lib/format";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import clsx from "clsx";

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [councilHealth, setCouncilHealth] = useState<{ primary: number; verifier: number; fast: number } | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof xorrApi.getHealth>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const [overviewRes, tradesRes, healthRes, sysHealthRes] = await Promise.all([
        xorrApi.getOverview(),
        xorrApi.getTrades("all").catch(e => {
          console.error("Trades fetch failed", e);
          return [] as Trade[];
        }),
        xorrApi.getCouncilHealth().catch(e => {
          console.error("Council health fetch failed", e);
          return null;
        }),
        xorrApi.getHealth().catch(() => null),
      ]);

      setData(overviewRes);
      setTrades(tradesRes);
      setCouncilHealth(healthRes);
      setHealth(sysHealthRes);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
    const interval = setInterval(() => {
      loadOverview();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          LOADING SYSTEM METRICS...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col space-y-4 py-10">
        <PageTitle title="Overview" />
        <Card className="border-xr-loss/40 bg-xr-loss/5 max-w-xl">
          <SectionLabel className="text-xr-loss">SYSTEM FAULT</SectionLabel>
          <p className="text-sm font-mono text-xr-text mb-4">
            Could not establish communication with the Autonomous Trading Agent.
          </p>
          <p className="text-xs font-mono text-xr-text-dim">Error: {error}</p>
          <Button
            variant="outline"
            className="mt-6 font-mono"
            onClick={() => {
              setLoading(true);
              loadOverview();
            }}
          >
            RETRY CONNECTION
          </Button>
        </Card>
      </div>
    );
  }

  const pnlIsPositive = data.pnl.totalUsd >= 0;
  const returnIsPositive = data.portfolio.totalReturnPct >= 0;

  // Calculate today's stats (UTC today)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayTrades = trades.filter(t => {
    const openTime = new Date(t.openedAt);
    return openTime >= todayStart;
  });
  const todayCount = todayTrades.length;
  const todayPnL = todayTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Overview" />
        
        <button
          onClick={() => loadOverview(true)}
          className="flex items-center space-x-1.5 font-mono text-[10px] uppercase tracking-wider text-xr-text-dim hover:text-xr-text transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-xr-mint" : ""}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <Card>
          <KpiNumber
            label="PORTFOLIO VALUE"
            value={formatMoney(data.portfolio.totalUsd)}
            subValue={
              <div className="flex items-center space-x-1 font-mono text-[11px] text-xr-text-dim">
                <span>USDT {formatMoney(data.portfolio.usdt)}</span>
                <span className="text-xr-text-faint">•</span>
                <span className="text-xr-warn">🟡 {data.portfolio.bnb.toFixed(4)} BNB</span>
              </div>
            }
          />
        </Card>

        {/* Total Return / PnL */}
        <Card>
          <KpiNumber
            label="TOTAL PNL"
            value={
              <span className={pnlIsPositive ? "text-xr-win" : "text-xr-loss"}>
                {formatMoney(data.pnl.totalUsd)}
              </span>
            }
            subValue={
              <span className={returnIsPositive ? "text-xr-win" : "text-xr-loss"}>
                {formatPercent(data.portfolio.totalReturnPct)} total return
              </span>
            }
          />
        </Card>

        {/* Win Rate */}
        <Card>
          <KpiNumber
            label="WIN RATE"
            value={`${data.winRate.pct}%`}
            subValue={`${data.winRate.wins} wins / ${data.winRate.losses} losses`}
          />
        </Card>

        {/* Open Positions */}
        <Card>
          <KpiNumber
            label="OPEN POSITIONS"
            value={
              <span className={data.openPositions.count > 0 ? "text-xr-violet animate-pulse font-semibold" : ""}>
                {data.openPositions.count}
              </span>
            }
            subValue={`Monitored every ${data.openPositions.monitoredEverySec}s`}
          />
        </Card>
      </div>

      {/* Row 2: Secondary KPIs & Council Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sim/Live Indicator */}
        <Card className="flex items-center justify-between p-4 min-h-[72px]">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">ENGINE MODE</span>
            <span className={clsx(
              "font-mono text-xs font-bold mt-1 uppercase",
              data.mode === "live" ? "text-xr-loss animate-pulse" : "text-xr-mint"
            )}>
              {data.mode === "live" ? "🔴 LIVE TRADING" : "🟢 SIMULATION"}
            </span>
          </div>
        </Card>

        {/* Today's Trade Count */}
        <Card className="flex items-center justify-between p-4 min-h-[72px]">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">TODAY'S TRADES</span>
            <span className="font-mono text-xs font-semibold text-xr-text mt-1">
              {todayCount} {todayCount === 1 ? "trade" : "trades"}
            </span>
          </div>
        </Card>

        {/* Today's PnL */}
        <Card className="flex items-center justify-between p-4 min-h-[72px]">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">TODAY'S PNL</span>
            <span className={clsx(
              "font-mono text-xs font-semibold mt-1",
              todayPnL > 0 ? "text-xr-win" : todayPnL < 0 ? "text-xr-loss" : "text-xr-text-dim"
            )}>
              {todayPnL > 0 ? "+" : ""}{formatMoney(todayPnL)}
            </span>
          </div>
        </Card>

        {/* Council Health Card */}
        <Card className="flex flex-col justify-center p-4 min-h-[72px]">
          <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint mb-1.5">COUNCIL HEALTH (Last 50)</span>
          <div className="flex items-center justify-between">
            {/* Primary */}
            <div className="flex items-center space-x-1.5">
              <span className={clsx(
                "h-2 w-2 rounded-full",
                councilHealth ? (councilHealth.primary > 0.85 ? "bg-xr-mint" : councilHealth.primary > 0.5 ? "bg-xr-warn" : "bg-xr-loss") : "bg-xr-text-faint"
              )} />
              <div className="flex flex-col">
                <span className="font-mono text-[8px] text-xr-text-dim leading-none">PRI</span>
                <span className="font-mono text-[10px] font-semibold text-xr-text mt-0.5">
                  {councilHealth ? `${Math.round(councilHealth.primary * 100)}%` : "N/A"}
                </span>
              </div>
            </div>

            {/* Verifier */}
            <div className="flex items-center space-x-1.5">
              <span className={clsx(
                "h-2 w-2 rounded-full",
                councilHealth ? (councilHealth.verifier > 0.85 ? "bg-xr-mint" : councilHealth.verifier > 0.5 ? "bg-xr-warn" : "bg-xr-loss") : "bg-xr-text-faint"
              )} />
              <div className="flex flex-col">
                <span className="font-mono text-[8px] text-xr-text-dim leading-none">VER</span>
                <span className="font-mono text-[10px] font-semibold text-xr-text mt-0.5">
                  {councilHealth ? `${Math.round(councilHealth.verifier * 100)}%` : "N/A"}
                </span>
              </div>
            </div>

            {/* Fast */}
            <div className="flex items-center space-x-1.5">
              <span className={clsx(
                "h-2 w-2 rounded-full",
                councilHealth ? (councilHealth.fast > 0.85 ? "bg-xr-mint" : councilHealth.fast > 0.5 ? "bg-xr-warn" : "bg-xr-loss") : "bg-xr-text-faint"
              )} />
              <div className="flex flex-col">
                <span className="font-mono text-[8px] text-xr-text-dim leading-none">FST</span>
                <span className="font-mono text-[10px] font-semibold text-xr-text mt-0.5">
                  {councilHealth ? `${Math.round(councilHealth.fast * 100)}%` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live data feeds + engine liveness (real-time WS price, liquidation tape, watchdog) */}
      <Card className="p-4">
        <SectionLabel>LIVE FEEDS &amp; ENGINE</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {[
            {
              name: "REAL-TIME PRICE FEED",
              sub: "Binance WS · sub-second marks",
              ok: !!health?.wsFeed?.connected,
              detail: health?.wsFeed ? `${health.wsFeed.symbols ?? 0} symbols` : "—",
            },
            {
              name: "LIQUIDATION FEED",
              sub: "Binance forceOrder · cascade signals",
              ok: !!health?.liqFeed?.connected,
              detail: health?.liqFeed ? `${health.liqFeed.symbols_tracked ?? 0} tracked` : "—",
            },
            {
              name: "ENGINE WATCHDOG",
              sub: "self-healing scan + risk loops",
              ok: !!health?.scheduler?.monitor_alive,
              detail: health?.scheduler?.monitor_age_sec != null ? `tick ${health.scheduler.monitor_age_sec}s` : "idle",
            },
          ].map((f) => (
            <div key={f.name} className="flex items-center space-x-2.5 p-2.5 bg-xr-bg-elev-2/50 border border-xr-border rounded-md">
              <span className={clsx("h-2 w-2 rounded-full flex-shrink-0", f.ok ? "bg-xr-mint animate-pulse" : "bg-xr-text-faint")} />
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-[10px] font-semibold text-xr-text uppercase tracking-wider truncate">{f.name}</span>
                <span className="font-mono text-[9px] text-xr-text-faint truncate">{f.sub} · {f.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Row 3: Equity Chart + Fear & Greed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Equity Curve Area Chart */}
        <Card className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <SectionLabel>EQUITY CURVE (14d)</SectionLabel>
            <p className="text-[11px] font-sans text-xr-text-dim mb-4">
              Real-time portfolio value track including active position valuation.
            </p>
          </div>
          <EquityCurve data={data.equityCurve} />
        </Card>

        {/* Fear & Greed Sentiment Gauge */}
        <Card className="lg:col-span-4 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <SectionLabel>MARKET SENTIMENT</SectionLabel>
            <p className="text-[11px] font-sans text-xr-text-dim mb-2">
              Current index from alternative.me API.
            </p>
          </div>
          <FearGreedGauge value={data.fearGreed.value} label={data.fearGreed.label} />
          <div className="bg-xr-bg-elev-2 border border-xr-border rounded-md p-3 text-[11px] font-sans text-xr-text-dim text-left leading-relaxed mt-2 w-full">
            {data.fearGreed.annotation}
          </div>
        </Card>
      </div>

      {/* Row 3: Session Performance & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Session Performance breakdown */}
        <Card className="lg:col-span-6">
          <SectionLabel>SESSION PERFORMANCE</SectionLabel>
          <div className="divide-y divide-xr-border mt-3">
            <div className="flex justify-between items-center py-2.5">
              <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
                COMPETITION (BEP-20 Whitelist)
              </span>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs font-medium text-xr-mint">
                  {data.sessionPerf.competition.winRatePct}% WR
                </span>
                <span className="font-mono text-xs text-xr-text-faint">
                  [{data.sessionPerf.competition.trades} trades]
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2.5">
              <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
                QUALIFIER (Daily Min Trade)
              </span>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs font-medium text-xr-mint">
                  {data.sessionPerf.qualifier.winRatePct}% WR
                </span>
                <span className="font-mono text-xs text-xr-text-faint">
                  [{data.sessionPerf.qualifier.trades} trades]
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Trade Statistics (Best/Worst) */}
        <Card className="lg:col-span-6">
          <SectionLabel>TRADE EXTREMES</SectionLabel>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3 bg-xr-bg-elev-2/50 border border-xr-border rounded-md flex items-center space-x-3">
              <div className="bg-xr-win/10 text-xr-win p-2 rounded-full">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">
                  BEST TRADE PNL
                </span>
                <span className="font-mono text-sm font-semibold text-xr-win mt-0.5">
                  {data.pnl.bestTradeUsd > 0 ? "+" : ""}{formatMoney(data.pnl.bestTradeUsd)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-xr-bg-elev-2/50 border border-xr-border rounded-md flex items-center space-x-3">
              <div className="bg-xr-loss/10 text-xr-loss p-2 rounded-full">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">
                  WORST TRADE PNL
                </span>
                <span className="font-mono text-sm font-semibold text-xr-loss mt-0.5">
                  {formatMoney(data.pnl.worstTradeUsd)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
