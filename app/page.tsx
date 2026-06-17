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
import { OverviewResponse } from "../lib/types";
import { formatMoney, formatPercent } from "../lib/format";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await xorrApi.getOverview();
      setData(res);
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

      {/* Row 2: Equity Chart + Fear & Greed */}
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
