"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import Button from "../../components/ui/Button";
import { xorrApi } from "../../lib/api";
import { Trade } from "../../lib/types";
import { formatMoney, formatPercent, formatDuration, formatTime, formatAddress } from "../../lib/format";
import { Copy, Check, ExternalLink, Download, Search, RefreshCw } from "lucide-react";
import clsx from "clsx";

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [windowFilter, setWindowFilter] = useState<string>("ALL");
  const [strategyFilter, setStrategyFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadTrades = async () => {
    try {
      // Fetch open positions first
      const openTrades = await xorrApi.getOpenTrades();
      // Fetch historical trades
      const histTrades = await xorrApi.getTrades("all");
      
      // Merge: open positions might already be in history, de-dupe
      const openIds = new Set(openTrades.map(t => t.id));
      const histFiltered = histTrades.filter(t => !openIds.has(t.id));
      
      const combined = [...openTrades, ...histFiltered];
      // Sort combined by opened_at descending
      combined.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      
      setTrades(combined);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve trades history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter application
  useEffect(() => {
    let result = [...trades];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(t => t.status.toUpperCase() === statusFilter);
    }

    // Window filter
    if (windowFilter !== "ALL") {
      result = result.filter(t => t.window.toUpperCase() === windowFilter);
    }

    // Strategy filter
    if (strategyFilter !== "ALL") {
      result = result.filter(t => t.strategy.toLowerCase().includes(strategyFilter.toLowerCase()));
    }

    // Search query (symbol or address)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t => t.symbol.toLowerCase().includes(q) || t.contract.toLowerCase().includes(q)
      );
    }

    setFilteredTrades(result);
  }, [trades, statusFilter, windowFilter, strategyFilter, searchQuery]);

  const handleCopy = async (address: string, id: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleExportCSV = () => {
    // Redirects browser to trigger native download stream
    const API_BASE = process.env.NEXT_PUBLIC_XORR_API || "http://localhost:8000";
    window.open(`${API_BASE}/api/trades/export.csv`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          LOADING ORDER LEDGER...
        </span>
      </div>
    );
  }

  const uniqueStrategies = ["ALL", "MOMENTUM", "FIB", "CAPITULATION", "NEWS"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle title="Trades" subtitle="OPEN POSITIONS + HISTORY" />
        
        <Button
          variant="outline-mint"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span>EXPORT CSV</span>
        </Button>
      </div>

      {/* Filter Chips Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Search Input */}
          <div className="flex items-center bg-xr-bg border border-xr-border rounded-md px-3 py-1.5 w-full sm:max-w-xs focus-within:border-xr-border-strong transition-colors">
            <Search className="h-4 w-4 text-xr-text-dim mr-2" />
            <input
              type="text"
              placeholder="Search symbol or contract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-mono text-xs text-xr-text placeholder-xr-text-faint w-full"
            />
          </div>

          {/* Window Filter */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">WINDOW</span>
            <div className="flex space-x-1 bg-xr-bg p-0.5 rounded border border-xr-border">
              {["ALL", "COMPETITION", "QUALIFIER"].map((w) => (
                <button
                  key={w}
                  onClick={() => setWindowFilter(w)}
                  className={clsx(
                    "font-mono text-[9px] px-2.5 py-1 rounded-sm uppercase transition-colors cursor-pointer",
                    windowFilter === w
                      ? "bg-xr-bg-elev-2 text-xr-mint font-semibold"
                      : "text-xr-text-dim hover:text-xr-text"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">STATUS</span>
            <div className="flex space-x-1 bg-xr-bg p-0.5 rounded border border-xr-border">
              {["ALL", "OPEN", "WIN", "LOSS"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "font-mono text-[9px] px-2.5 py-1 rounded-sm uppercase transition-colors cursor-pointer",
                    statusFilter === s
                      ? "bg-xr-bg-elev-2 text-xr-mint font-semibold"
                      : "text-xr-text-dim hover:text-xr-text"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Filter */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">STRATEGY</span>
            <div className="flex space-x-1 bg-xr-bg p-0.5 rounded border border-xr-border">
              {uniqueStrategies.map((strat) => (
                <button
                  key={strat}
                  onClick={() => setStrategyFilter(strat)}
                  className={clsx(
                    "font-mono text-[9px] px-2.5 py-1 rounded-sm uppercase transition-colors cursor-pointer",
                    strategyFilter === strat
                      ? "bg-xr-bg-elev-2 text-xr-mint font-semibold"
                      : "text-xr-text-dim hover:text-xr-text"
                  )}
                >
                  {strat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Trades Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-xr-border bg-xr-bg-elev-2/40 text-[9px] font-mono uppercase tracking-widest text-xr-text-faint h-10 px-4">
                <th className="px-4 font-normal">TIME</th>
                <th className="px-4 font-normal">SYMBOL</th>
                <th className="px-4 font-normal">STATUS</th>
                <th className="px-4 font-normal text-right">INVESTED</th>
                <th className="px-4 font-normal text-right">PNL</th>
                <th className="px-4 font-normal text-right">PNL %</th>
                <th className="px-4 font-normal text-right">HOLD</th>
                <th className="px-4 font-normal text-right">ENTRY MC</th>
                <th className="px-4 font-normal text-right">EXIT MC</th>
                <th className="px-4 font-normal text-center">SCORE</th>
                <th className="px-4 font-normal">EXIT REASON</th>
                <th className="px-4 font-normal">WINDOW</th>
                <th className="px-4 font-normal">CONTRACT</th>
                <th className="px-4 font-normal text-center">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-xr-border/40 font-mono text-[11px]">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-xr-text-faint italic">
                    No matching trades found in ledger.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isWin = t.status === "win";
                  const isLoss = t.status === "loss";
                  const isOpen = t.status === "open";
                  
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-xr-bg-elev-2/20 transition-colors h-9"
                    >
                      {/* TIME */}
                      <td className="px-4 text-xr-text-dim whitespace-nowrap">
                        {formatTime(t.openedAt)}
                      </td>
                      
                      {/* SYMBOL */}
                      <td className="px-4 font-semibold text-xr-text whitespace-nowrap">
                        {t.symbol}
                      </td>
                      
                      {/* STATUS */}
                      <td className="px-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase tracking-wider border",
                            {
                              "text-xr-mint border-xr-mint/30 bg-xr-mint/5": isWin,
                              "text-xr-loss border-xr-loss/30 bg-xr-loss/5": isLoss,
                              "text-xr-violet border-xr-violet/30 bg-xr-violet/5 animate-pulse": isOpen,
                              "text-xr-text-dim border-xr-border bg-xr-bg-elev-2": t.status === "breakeven",
                            }
                          )}
                        >
                          {t.status}
                        </span>
                      </td>
                      
                      {/* INVESTED */}
                      <td className="px-4 text-right whitespace-nowrap text-xr-text">
                        {formatMoney(t.invested)}
                      </td>
                      
                      {/* PNL */}
                      <td
                        className={clsx(
                          "px-4 text-right whitespace-nowrap font-medium",
                          isWin && "text-xr-win",
                          isLoss && "text-xr-loss",
                          isOpen && "text-xr-text-dim"
                        )}
                      >
                        {isOpen ? "—" : `${t.pnlUsd > 0 ? "+" : ""}${formatMoney(t.pnlUsd)}`}
                      </td>
                      
                      {/* PNL % */}
                      <td
                        className={clsx(
                          "px-4 text-right whitespace-nowrap font-medium",
                          isWin && "text-xr-win",
                          isLoss && "text-xr-loss",
                          isOpen && "text-xr-text-dim"
                        )}
                      >
                        {isOpen ? "—" : formatPercent(t.pnlPct)}
                      </td>
                      
                      {/* HOLD */}
                      <td className="px-4 text-right text-xr-text-dim whitespace-nowrap">
                        {isOpen ? formatDuration(t.holdMinutes) : formatDuration(t.holdMinutes)}
                      </td>
                      
                      {/* ENTRY MC */}
                      <td className="px-4 text-right text-xr-text-dim whitespace-nowrap">
                        {t.entryMarketCap ? `$${(t.entryMarketCap / 1e6).toFixed(1)}M` : "—"}
                      </td>
                      
                      {/* EXIT MC */}
                      <td className="px-4 text-right text-xr-text-dim whitespace-nowrap">
                        {t.exitMarketCap ? `$${(t.exitMarketCap / 1e6).toFixed(1)}M` : "—"}
                      </td>
                      
                      {/* SCORE */}
                      <td className="px-4 text-center text-xr-mint font-semibold whitespace-nowrap">
                        {t.score ? t.score.toFixed(0) : "—"}
                      </td>
                      
                      {/* EXIT REASON */}
                      <td className="px-4 text-xr-text-dim whitespace-nowrap">
                        {t.exitReason ? (
                          <span className="text-[10px] tracking-wide bg-xr-bg-elev-2 px-1.5 py-0.5 rounded border border-xr-border uppercase">
                            {t.exitReason}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      
                      {/* WINDOW */}
                      <td className="px-4 text-xr-text-faint whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider">
                        {t.window}
                      </td>
                      
                      {/* CONTRACT */}
                      <td className="px-4 text-xr-text-dim whitespace-nowrap">
                        <button
                          onClick={() => handleCopy(t.contract, t.id)}
                          className="flex items-center space-x-1.5 hover:text-xr-mint transition-colors cursor-pointer"
                        >
                          <span>{formatAddress(t.contract)}</span>
                          {copiedId === t.id ? (
                            <Check className="h-3 w-3 text-xr-mint" />
                          ) : (
                            <Copy className="h-3 w-3 text-xr-text-faint" />
                          )}
                        </button>
                      </td>
                      
                      {/* TX LINKS */}
                      <td className="px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {t.txOpen && (
                            <a
                              href={`https://bscscan.com/tx/${t.txOpen}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xr-text-dim hover:text-xr-mint transition-colors"
                              title="View Buy Tx"
                            >
                              buy
                            </a>
                          )}
                          {t.txClose && (
                            <>
                              <span className="text-xr-text-faint">/</span>
                              <a
                                href={`https://bscscan.com/tx/${t.txClose}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xr-text-dim hover:text-xr-mint transition-colors"
                                title="View Sell Tx"
                              >
                                sell
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
