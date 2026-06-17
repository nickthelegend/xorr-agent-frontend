"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import Button from "../../components/ui/Button";
import { xorrApi } from "../../lib/api";
import { SettingsPayload } from "../../lib/types";
import { RefreshCw, Save, RotateCcw, Shield, Activity, Settings, HelpCircle } from "lucide-react";
import clsx from "clsx";

const STRATEGIES_LIST = [
  { id: "momentum_pullback", name: "Momentum Pullback", key: "enableStrategyMomentumPullback" },
  { id: "fib_golden_pocket", name: "Fib Golden Pocket", key: "enableStrategyFibGoldenPocket" },
  { id: "capitulation", name: "Capitulation Wick", key: "enableStrategyCapitulation" },
  { id: "news_catalyst", name: "News Catalyst", key: "enableStrategyNewsCatalyst" },
  { id: "mean_reversion", name: "Mean Reversion", key: "enableStrategyMeanReversion" },
  { id: "trend_follow", name: "Trend Follow", key: "enableStrategyTrendFollow" },
  { id: "vol_squeeze", name: "Vol Squeeze", key: "enableStrategyVolSqueeze" },
  { id: "whale_flow", name: "Whale Flow", key: "enableStrategyWhaleFlow" },
];

export default function SettingsPage() {
  const [dbSettings, setDbSettings] = useState<SettingsPayload | null>(null);
  const [formSettings, setFormSettings] = useState<SettingsPayload | null>(null);
  
  // V2 stats
  const [learningStats, setLearningStats] = useState<any | null>(null);
  const [councilHealth, setCouncilHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Council weights local state (weights are managed locally for UX sliders summing to 1.0)
  const [primaryWeight, setPrimaryWeight] = useState<number>(0.45);
  const [verifierWeight, setVerifierWeight] = useState<number>(0.35);
  const [fastWeight, setFastWeight] = useState<number>(0.20);

  const loadData = async () => {
    try {
      const res = await xorrApi.getSettings();
      setDbSettings(res);
      setFormSettings(JSON.parse(JSON.stringify(res))); // clone
      
      const stats = await xorrApi.getLearningStats();
      setLearningStats(stats);
      
      const health = await xorrApi.getCouncilHealth();
      setCouncilHealth(health);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load settings registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWeightChange = (model: "primary" | "verifier" | "fast", newVal: number) => {
    if (model === "primary") {
      setPrimaryWeight(newVal);
      const remaining = 1.0 - newVal;
      const sumOthers = verifierWeight + fastWeight;
      if (sumOthers > 0) {
        setVerifierWeight((verifierWeight / sumOthers) * remaining);
        setFastWeight((fastWeight / sumOthers) * remaining);
      } else {
        setVerifierWeight(remaining / 2);
        setFastWeight(remaining / 2);
      }
    } else if (model === "verifier") {
      setVerifierWeight(newVal);
      const remaining = 1.0 - newVal;
      const sumOthers = primaryWeight + fastWeight;
      if (sumOthers > 0) {
        setPrimaryWeight((primaryWeight / sumOthers) * remaining);
        setFastWeight((fastWeight / sumOthers) * remaining);
      } else {
        setPrimaryWeight(remaining / 2);
        setFastWeight(remaining / 2);
      }
    } else {
      setFastWeight(newVal);
      const remaining = 1.0 - newVal;
      const sumOthers = primaryWeight + verifierWeight;
      if (sumOthers > 0) {
        setPrimaryWeight((primaryWeight / sumOthers) * remaining);
        setVerifierWeight((verifierWeight / sumOthers) * remaining);
      } else {
        setPrimaryWeight(remaining / 2);
        setVerifierWeight(remaining / 2);
      }
    }
  };

  const handleStrategyToggleInstant = async (name: string, currentVal: boolean) => {
    try {
      // Instant commit override
      await xorrApi.toggleStrategy(name, !currentVal);
      // Update form state directly
      const key = STRATEGIES_LIST.find((s) => s.id === name)?.key as keyof SettingsPayload;
      if (key && formSettings) {
        handleFieldChange(key, !currentVal);
      }
      // Reload states
      const stats = await xorrApi.getLearningStats();
      setLearningStats(stats);
      setSuccessMsg(`Strategy ${name.replace("_", " ")} status updated.`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setError(`Failed to toggle strategy: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          POLLING AGENT REGISTRY & STATE STATS...
        </span>
      </div>
    );
  }

  if (error || !dbSettings || !formSettings) {
    return (
      <div className="space-y-6">
        <PageTitle title="Settings" subtitle="RISK & ENGINE KNOBS" />
        <Card className="border-xr-loss/40 bg-xr-loss/5 max-w-xl">
          <SectionLabel className="text-xr-loss">REGISTRY FAULT</SectionLabel>
          <p className="text-sm font-mono text-xr-text mb-4">
            Could not read system knobs from local config daemon.
          </p>
          <p className="text-xs font-mono text-xr-text-dim">Error: {error}</p>
          <Button variant="outline" className="mt-6 font-mono" onClick={loadData}>
            RETRY CONFIG POLL
          </Button>
        </Card>
      </div>
    );
  }

  const unsavedKeys = (Object.keys(dbSettings) as Array<keyof SettingsPayload>).filter(
    (key) => dbSettings[key] !== formSettings[key]
  );
  
  const hasChanges = unsavedKeys.length > 0;

  const handleFieldChange = (key: keyof SettingsPayload, value: any) => {
    setFormSettings((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const handleDiscard = () => {
    setFormSettings(JSON.parse(JSON.stringify(dbSettings)));
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    if (!formSettings || !hasChanges) return;
    setSaving(true);
    setSuccessMsg(null);
    
    const diff: Partial<SettingsPayload> = {};
    for (const key of unsavedKeys) {
      diff[key] = formSettings[key] as any;
    }

    try {
      const updated = await xorrApi.saveSettings(diff);
      setDbSettings(updated);
      setFormSettings(JSON.parse(JSON.stringify(updated)));
      
      setSuccessMsg("Settings knobs updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to commit settings updates.");
    } finally {
      setSaving(false);
    }
  };

  const primaryStatus = councilHealth?.primary > 0.0;
  const verifierStatus = councilHealth?.verifier > 0.0;
  const fastStatus = councilHealth?.fast > 0.0;

  return (
    <div className="space-y-6 pb-20 relative overflow-y-auto max-h-[calc(100vh-4rem)] pr-2">
      <PageTitle title="Settings" subtitle="RISK & ENGINE KNOBS" />

      {successMsg && (
        <div className="bg-xr-win/10 border border-xr-win/30 text-xr-win font-mono text-xs px-4 py-3 rounded-md animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Quality Mode Banner Toggle */}
      <Card className="border-xr-violet/40 bg-xr-violet/5 flex items-center justify-between p-4">
        <div className="flex flex-col space-y-1">
          <span className="font-mono text-sm font-semibold uppercase tracking-wider text-xr-violet flex items-center space-x-2">
            <Shield className="h-4.5 w-4.5 text-xr-mint" />
            <span>Quality Mode (Tighter Filters Overlay)</span>
          </span>
          <span className="text-xs text-xr-text-dim max-w-2xl">
            Reduces trades to premium setups. Increases confluence threshold to 78, minimum LLM council confidence to 0.72, and forces trailing stop locks.
          </span>
        </div>
        <button
          onClick={() => handleFieldChange("qualityMode", !formSettings.qualityMode)}
          className={`w-12 h-6 rounded-full p-0.5 transition-all select-none cursor-pointer ${
            formSettings.qualityMode ? "bg-xr-mint" : "bg-xr-border"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-xr-bg-elev-2 shadow transition-transform ${
              formSettings.qualityMode ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Sizing, Slippage, Drawdown */}
        <div className="space-y-6">
          {/* Sizing Controls */}
          <Card className="space-y-5">
            <SectionLabel>SCANNING & SIZING</SectionLabel>

            {/* Scan Cadence */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Scan Interval</span>
                <span className="text-xr-mint font-semibold">{formSettings.scanIntervalSec} seconds</span>
              </div>
              <input
                type="range"
                min="60"
                max="600"
                step="30"
                value={formSettings.scanIntervalSec}
                onChange={(e) => handleFieldChange("scanIntervalSec", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Time interval between strategy evaluation cycles. Default 180s.
              </span>
            </div>

            {/* Max Concurrent */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Max Concurrent Positions</span>
                <span className="text-xr-mint font-semibold">{formSettings.maxConcurrentPositions} slots</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={formSettings.maxConcurrentPositions}
                onChange={(e) => handleFieldChange("maxConcurrentPositions", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Maximum allowed active swaps simultaneously. Default 3.
              </span>
            </div>

            {/* Base Sizing */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Base Sizing Amount</span>
                <span className="text-xr-mint font-semibold">${formSettings.baseTradeSizeUsd} USDT</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="50.0"
                step="0.5"
                value={formSettings.baseTradeSizeUsd}
                onChange={(e) => handleFieldChange("baseTradeSizeUsd", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Entry capital allocated for standard risk modifiers. Default $2.00 USDT.
              </span>
            </div>
          </Card>

          {/* Slippage Knobs */}
          <Card className="space-y-5">
            <SectionLabel>SLIPPAGE PROTECTION</SectionLabel>

            {/* Spot Slippage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Spot Swaps Slippage Limit</span>
                <span className="text-xr-mint font-semibold">{(formSettings.slippageBpsSpot / 100).toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={formSettings.slippageBpsSpot}
                onChange={(e) => handleFieldChange("slippageBpsSpot", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* News Slippage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">News Catalyst Slippage Limit</span>
                <span className="text-xr-mint font-semibold">{(formSettings.slippageBpsNews / 100).toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={formSettings.slippageBpsNews}
                onChange={(e) => handleFieldChange("slippageBpsNews", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>
            
            {/* CEX Deviation BPS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">CEX Glitch Shield Limit</span>
                <span className="text-xr-mint font-semibold">{formSettings.cexDeviationBps} bps</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={formSettings.cexDeviationBps}
                onChange={(e) => handleFieldChange("cexDeviationBps", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>
          </Card>

          {/* Drawdown Limits */}
          <Card className="space-y-5">
            <SectionLabel>DRAWDOWN SAFEGUARDS</SectionLabel>

            {/* Max Drawdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Drawdown Sizing Degradation</span>
                <span className="text-xr-mint font-semibold">{formSettings.maxDrawdownPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={formSettings.maxDrawdownPct}
                onChange={(e) => handleFieldChange("maxDrawdownPct", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* Kill Drawdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-xr-text">Emergency Halt Threshold</span>
                <span className="text-xr-loss font-semibold">{formSettings.killDrawdownPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={formSettings.killDrawdownPct}
                onChange={(e) => handleFieldChange("killDrawdownPct", Number(e.target.value))}
                className="w-full accent-xr-loss bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Strategy Toggles & Brain council */}
        <div className="space-y-6">
          
          {/* Strategy Toggles */}
          <Card>
            <SectionLabel>ACTIVE STRATEGY ALLOCATORS</SectionLabel>
            <p className="text-[11px] font-sans text-xr-text-dim mb-4 leading-relaxed">
              Arbiter auto-kill suspends strategies with negative expectancy (&lt;0R over 20 trades). Toggling switches force-enables them back.
            </p>
            
            <div className="divide-y divide-xr-border">
              {STRATEGIES_LIST.map((strat) => {
                const isEnabled = formSettings[strat.key as keyof SettingsPayload] as boolean;
                const stats = learningStats?.strategies[strat.id];
                const expectancy = stats?.expectancy ?? 0.0;
                const suspended = stats?.suspended ?? false;
                
                return (
                  <div key={strat.id} className="flex justify-between items-center py-2.5">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-medium text-xr-text">
                          {strat.name}
                        </span>
                        {suspended && (
                          <span className="h-1.5 w-1.5 rounded-full bg-xr-loss animate-ping" title="Suspended by Arbiter" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[10px] text-xr-text-dim">
                        <span>Exp:</span>
                        <span className={expectancy >= 0.0 ? "text-xr-mint" : "text-xr-loss"}>
                          {expectancy >= 0.0 ? "+" : ""}{expectancy.toFixed(2)}R
                        </span>
                        <span>•</span>
                        <span>Size Mult:</span>
                        <span className="text-xr-violet font-semibold">{(stats?.weight ?? 1.0).toFixed(2)}x</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStrategyToggleInstant(strat.id, isEnabled)}
                      className={`w-9 h-4.5 rounded-full p-0.5 transition-all select-none cursor-pointer ${
                        isEnabled ? "bg-xr-mint" : "bg-xr-border"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-xr-bg-elev-2 shadow transition-transform ${
                          isEnabled ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* LLM Council sliders */}
          <Card className="space-y-5">
            <SectionLabel>GROQ COUNCIL VOTING SYSTEM</SectionLabel>

            {/* Availability dots */}
            <div className="flex items-center space-x-4 p-2.5 bg-xr-bg-elev-2 border border-xr-border rounded-md text-[11px] font-mono">
              <span className="text-xr-text-dim">Availability:</span>
              <div className="flex items-center space-x-1.5">
                <span className={`h-2 w-2 rounded-full ${primaryStatus ? "bg-xr-mint" : "bg-xr-loss"}`} />
                <span className="text-xr-text">Primary</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-2 w-2 rounded-full ${verifierStatus ? "bg-xr-mint" : "bg-xr-loss"}`} />
                <span className="text-xr-text">Verifier</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-2 w-2 rounded-full ${fastStatus ? "bg-xr-mint" : "bg-xr-loss"}`} />
                <span className="text-xr-text">Fast</span>
              </div>
            </div>

            {/* Model select */}
            <div className="flex flex-col space-y-2">
              <span className="font-mono text-xs text-xr-text">Base Groq Model</span>
              <select
                value={formSettings.groqModel}
                onChange={(e) => handleFieldChange("groqModel", e.target.value)}
                className="bg-xr-bg-elev-2 border border-xr-border rounded-md px-3 py-2 text-xs font-mono text-xr-text outline-none focus:border-xr-border-strong cursor-pointer"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
              </select>
            </div>

            {/* Primary Weight Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>Primary Weight (Llama-3.3)</span>
                <span className="text-xr-mint font-semibold">{Math.round(primaryWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={primaryWeight}
                onChange={(e) => handleWeightChange("primary", parseFloat(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* Verifier Weight Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>Verifier Weight (DeepSeek-R1)</span>
                <span className="text-xr-mint font-semibold">{Math.round(verifierWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={verifierWeight}
                onChange={(e) => handleWeightChange("verifier", parseFloat(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* Fast Weight Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>Fast Weight (Llama-8B)</span>
                <span className="text-xr-mint font-semibold">{Math.round(fastWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={fastWeight}
                onChange={(e) => handleWeightChange("fast", parseFloat(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* Confluence threshold */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>Confluence Threshold Gating</span>
                <span className="text-xr-mint font-semibold">{formSettings.confluenceThreshold} score</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="1"
                value={formSettings.confluenceThreshold}
                onChange={(e) => handleFieldChange("confluenceThreshold", Number(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>

            {/* Council min final confidence */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>Council Confidence Gating</span>
                <span className="text-xr-mint font-semibold">{Math.round(formSettings.councilMinFinalConfidence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.85"
                step="0.05"
                value={formSettings.councilMinFinalConfidence}
                onChange={(e) => handleFieldChange("councilMinFinalConfidence", parseFloat(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
            </div>
          </Card>
        </div>

      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0c0d12]/95 backdrop-blur-md border-t border-xr-border-strong flex items-center justify-between px-8 z-50 animate-slide-up">
          <div className="flex items-center space-x-2 font-mono text-xs text-xr-warn">
            <span>⚠️ {unsavedKeys.length} unsaved knob modification(s)</span>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={handleDiscard}
              className="flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>DISCARD</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center space-x-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "SAVING..." : "SAVE CHANGES"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
