"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import { xorrApi } from "../../lib/api";
import { DecisionLogEntry } from "../../lib/types";
import { formatTime, formatDate } from "../../lib/format";
import { ChevronDown, ChevronUp, AlertCircle, RefreshCw, Search } from "lucide-react";
import clsx from "clsx";

export default function BrainPage() {
  const [decisions, setDecisions] = useState<DecisionLogEntry[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<DecisionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedVotes, setExpandedVotes] = useState<Record<string, boolean>>({});

  const loadDecisions = async () => {
    try {
      const res = await xorrApi.getDecisions(100);
      setDecisions(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load decision logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
    const interval = setInterval(loadDecisions, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...decisions];

    // Filter action
    if (actionFilter !== "ALL") {
      result = result.filter(d => d.action.toUpperCase() === actionFilter);
    }

    // Filter query (symbol)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => d.symbol.toLowerCase().includes(q));
    }

    setFilteredDecisions(result);
  }, [decisions, actionFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          LOADING BRAIN ARCHIVE...
        </span>
      </div>
    );
  }

  const actions = ["ALL", "ENTER", "SKIP", "EXIT", "HOLD", "RESIZE", "MODE_CHANGE"];

  return (
    <div className="space-y-6">
      <PageTitle title="Brain" subtitle="AI DECISION LOG" />

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-center gap-6">
        {/* Search */}
        <div className="flex items-center bg-xr-bg border border-xr-border rounded-md px-3 py-1.5 w-full sm:max-w-xs focus-within:border-xr-border-strong transition-colors">
          <Search className="h-4 w-4 text-xr-text-dim mr-2" />
          <input
            type="text"
            placeholder="Search token symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none font-mono text-xs text-xr-text placeholder-xr-text-faint w-full"
          />
        </div>

        {/* Action Filters */}
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">ACTION</span>
          <div className="flex flex-wrap gap-1 bg-xr-bg p-0.5 rounded border border-xr-border">
            {actions.map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={clsx(
                  "font-mono text-[9px] px-2.5 py-1 rounded-sm uppercase transition-colors cursor-pointer",
                  actionFilter === act
                    ? "bg-xr-bg-elev-2 text-xr-mint font-semibold"
                    : "text-xr-text-dim hover:text-xr-text"
                )}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Decisions Timeline */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <Card className="text-center py-12 text-xr-text-faint italic">
            No decisions logged yet. Execute scans to populate the audit trail.
          </Card>
        ) : (
          filteredDecisions.map((entry) => {
            const isExpanded = expandedIds.has(entry.id);
            const isEnter = entry.action === "ENTER";
            const isSkip = entry.action === "SKIP";
            const isExit = entry.action === "EXIT";
            
            return (
              <Card
                key={entry.id}
                className={clsx(
                  "p-0 border overflow-hidden cursor-pointer hover:border-xr-border-strong transition-colors",
                  isExpanded ? "border-xr-border-strong" : "border-xr-border"
                )}
                onClick={() => toggleExpand(entry.id)}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between px-5 py-4 select-none">
                  <div className="flex items-center space-x-4">
                    {/* Timestamp */}
                    <span className="font-mono text-[11px] text-xr-text-dim whitespace-nowrap">
                      {formatDate(entry.t)} {formatTime(entry.t)}
                    </span>
                    
                    {/* Symbol */}
                    <span className="font-mono text-sm font-semibold text-xr-text">
                      {entry.symbol}
                    </span>

                    {/* Action Badge */}
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase tracking-wider border",
                        {
                          "text-xr-mint border-xr-mint/30 bg-xr-mint/5": isEnter,
                          "text-xr-text-dim border-xr-border bg-xr-bg-elev-2": isSkip,
                          "text-xr-violet border-xr-violet/30 bg-xr-violet/5": isExit,
                          "text-xr-info border-xr-info/30 bg-xr-info/5": entry.action === "HOLD",
                          "text-xr-warn border-xr-warn/30 bg-xr-warn/5": entry.action === "RESIZE" || entry.action === "MODE_CHANGE",
                        }
                      )}
                    >
                      {entry.action}
                    </span>

                    {/* Strategy */}
                    <span className="font-sans text-[11px] text-xr-text-dim">
                      {entry.strategy}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Score */}
                    {entry.brainScore > 0 && (
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-xr-text-faint uppercase text-[9px] tracking-wider">SCORE</span>
                        <span className="text-xr-mint font-semibold">{entry.brainScore.toFixed(0)}</span>
                      </div>
                    )}
                    
                    {/* Dropdown Icon */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-xr-text-dim" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-xr-text-dim" />
                    )}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-xr-border/40 bg-[#08090d]/30 space-y-4">
                    {/* Filters Passed/Blocked */}
                    {(entry.filtersPassed.length > 0 || entry.filtersBlocked.length > 0) && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[9px] text-xr-text-faint uppercase tracking-wider">FILTERS</span>
                        
                        {entry.filtersPassed.map((f) => (
                          <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded bg-xr-win/5 border border-xr-win/25 text-xr-win uppercase">
                            ✓ {f}
                          </span>
                        ))}
                        
                        {entry.filtersBlocked.map((f) => (
                          <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded bg-xr-loss/5 border border-xr-loss/25 text-xr-loss uppercase">
                            ✗ {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Confluence Score and Breakdown */}
                    {entry.confluence !== undefined && entry.confluence !== null && (
                      <div className="space-y-1.5">
                        <span className="font-mono text-[9px] text-xr-text-faint uppercase tracking-wider">
                          CONFLUENCE SCORE ({entry.confluence.toFixed(0)}/100)
                        </span>
                        {entry.confluenceBreakdown && Object.keys(entry.confluenceBreakdown).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(entry.confluenceBreakdown).map(([name, val]) => (
                              <div key={name} className="flex items-center space-x-1.5 bg-xr-bg-elev-2/30 border border-xr-border/50 rounded px-2 py-0.5 font-mono text-[10px]">
                                <span className="text-xr-text-dim uppercase">{name.replace(/_/g, " ")}:</span>
                                <span className="text-xr-mint font-semibold">{val.toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* LLM Council Votes */}
                    {entry.council && entry.council.votes && entry.council.votes.length > 0 && (
                      <div className="space-y-3 border-t border-xr-border/30 pt-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-xr-bg-elev-2/45 border border-xr-border/80 rounded-md p-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="font-mono text-[10px] text-xr-text-faint uppercase tracking-wider">LLM COUNCIL DECISION</span>
                            <div className="flex items-center space-x-1.5 font-mono text-xs">
                              <span className="text-xr-text-dim">COUNCIL SCORE:</span>
                              <span className="text-xr-mint font-bold">{(entry.council.councilScore * 100).toFixed(0)}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 font-mono text-xs">
                              <span className="text-xr-text-dim">FINAL CONFIDENCE:</span>
                              <span className="text-xr-violet font-bold">{(entry.council.finalConfidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          
                          {/* Consensus Gauge */}
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[9px] text-xr-text-dim uppercase tracking-wider">
                              CONSENSUS (stddev: {entry.council.consensus.toFixed(2)}):
                            </span>
                            <div className="w-24 bg-xr-bg border border-xr-border h-2 rounded-full overflow-hidden relative">
                              <div
                                className={clsx(
                                  "h-full rounded-full transition-all duration-300",
                                  entry.council.consensus < 0.15 ? "bg-xr-mint" : entry.council.consensus < 0.3 ? "bg-xr-warn" : "bg-xr-loss"
                                )}
                                style={{ width: `${Math.max(0, Math.min(100, (1 - entry.council.consensus) * 100))}%` }}
                              />
                            </div>
                            <span className={clsx(
                              "font-mono text-[9px] uppercase font-semibold",
                              entry.council.consensus < 0.15 ? "text-xr-mint" : entry.council.consensus < 0.3 ? "text-xr-warn" : "text-xr-loss"
                            )}>
                              {entry.council.consensus < 0.15 ? "STRONG" : entry.council.consensus < 0.3 ? "MODERATE" : "WEAK"}
                            </span>
                          </div>
                        </div>

                        {/* Votes Grid/List */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {entry.council.votes.map((vote, idx) => {
                            const isVoteExpanded = expandedVotes[`${entry.id}-${idx}`];
                            return (
                              <div key={idx} className="bg-xr-bg/40 border border-xr-border rounded-md p-3 flex flex-col justify-between space-y-2">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-semibold text-xr-text capitalize">{vote.model}</span>
                                    <span className="font-mono text-[9px] text-xr-text-dim">{vote.latencyMs}ms</span>
                                  </div>
                                  
                                  {/* Score Bar */}
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-[9px] text-xr-text-dim uppercase">SCORE</span>
                                    <div className="flex-1 bg-xr-bg border border-xr-border h-1.5 rounded overflow-hidden">
                                      <div
                                        className="bg-xr-mint h-full"
                                        style={{ width: `${vote.score * 100}%` }}
                                      />
                                    </div>
                                    <span className="font-mono text-xs text-xr-mint font-semibold">{vote.score.toFixed(2)}</span>
                                  </div>

                                  {/* Red Flags if any */}
                                  {vote.redFlags && vote.redFlags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center">
                                      {vote.redFlags.map((flag, fIdx) => (
                                        <span key={fIdx} className="font-mono text-[8px] px-1 py-0.5 rounded bg-xr-loss/10 border border-xr-loss/30 text-xr-loss uppercase">
                                          {flag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Collapsible Reasoning */}
                                  <div 
                                    className="font-mono text-[10px] text-xr-text-dim cursor-pointer bg-xr-bg-elev-2/45 border border-xr-border/40 hover:border-xr-border p-2 rounded transition-colors text-left"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedVotes(prev => ({
                                        ...prev,
                                        [`${entry.id}-${idx}`]: !prev[`${entry.id}-${idx}`]
                                      }));
                                    }}
                                  >
                                    <div className={clsx(
                                      "transition-all duration-200 overflow-hidden leading-relaxed",
                                      isVoteExpanded ? "line-clamp-none" : "line-clamp-2"
                                    )}>
                                      {vote.reasoning}
                                    </div>
                                    <div className="text-[8px] text-xr-text-faint mt-1 flex items-center justify-end">
                                      {isVoteExpanded ? "Collapse" : "Expand"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reasoning Block */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[9px] text-xr-text-faint uppercase tracking-wider">REASONING & JUSTIFICATION</span>
                      <div className="bg-xr-bg-elev-2/50 border border-xr-border rounded-md p-4 font-mono text-[11px] text-xr-text leading-relaxed whitespace-pre-wrap">
                        {entry.reasoning}
                      </div>
                    </div>

                    {/* Market Snapshot mini-table */}
                    {entry.marketSnapshot && Object.keys(entry.marketSnapshot).length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-mono text-[9px] text-xr-text-faint uppercase tracking-wider">MARKET SNAPSHOT</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#08090d]/60 border border-xr-border rounded-md p-3 font-mono text-[10px]">
                          {Object.entries(entry.marketSnapshot).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center pr-3">
                              <span className="text-xr-text-dim uppercase">{key}</span>
                              <span className="text-xr-text font-medium">
                                {typeof value === "number" ? value.toFixed(4) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
