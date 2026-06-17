"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import Button from "../../components/ui/Button";
import { xorrApi } from "../../lib/api";
import { SettingsPayload } from "../../lib/types";
import { RefreshCw, Save, RotateCcw } from "lucide-react";
import clsx from "clsx";

export default function SettingsPage() {
  const [dbSettings, setDbSettings] = useState<SettingsPayload | null>(null);
  const [formSettings, setFormSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const res = await xorrApi.getSettings();
      setDbSettings(res);
      setFormSettings(JSON.parse(JSON.stringify(res))); // clone
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load engine settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          POLLING AGENT REGISTRY...
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
          <Button variant="outline" className="mt-6 font-mono" onClick={loadSettings}>
            RETRY CONFIG POLL
          </Button>
        </Card>
      </div>
    );
  }

  // Check for unsaved changes
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
    
    // Construct diff payload to send to backend
    const diff: Partial<SettingsPayload> = {};
    for (const key of unsavedKeys) {
      diff[key] = formSettings[key] as any;
    }

    try {
      const updated = await xorrApi.saveSettings(diff);
      setDbSettings(updated);
      setFormSettings(JSON.parse(JSON.stringify(updated)));
      
      setSuccessMsg("Settings updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to commit settings updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      <PageTitle title="Settings" subtitle="RISK & ENGINE KNOBS" />

      {successMsg && (
        <div className="bg-xr-win/10 border border-xr-win/30 text-xr-win font-mono text-xs px-4 py-3 rounded-md animate-fade-in">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Sizing & Schedulers */}
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
                onChange={(e) => handleFieldChange("baseTradeSizeUsd", floatValue(e.target.value))}
                className="w-full accent-xr-mint bg-xr-bg h-1.5 rounded-lg border border-xr-border appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Entry capital allocated for standard risk modifiers. Default $2.00 USDT.
              </span>
            </div>
          </Card>

          {/* Slippage & Deviation Knobs */}
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
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Maximum price deviation tolerated on standard spot swaps (in bps). Default 150 bps (1.5%).
              </span>
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
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Expanded tolerance for high-volatility news catalyst entries. Default 300 bps (3.0%).
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Drawdown, Filters, LLM */}
        <div className="space-y-6">
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
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Drawdown threshold where the sizing ladder begins scaling down. Default 20%.
              </span>
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
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Drawdown percentage where the agent trips the emergency kill switch. Default 25%.
              </span>
            </div>
          </Card>

          {/* Filters & Toggles */}
          <Card className="space-y-4">
            <SectionLabel>FILTER OVERLAYS</SectionLabel>

            {/* Vedic Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-xr-border/40">
              <div className="flex flex-col space-y-0.5">
                <span className="font-mono text-xs text-xr-text">Enable Vedic Timing Filter</span>
                <span className="text-[10px] font-sans text-xr-text-dim">
                  Gates entries during Saturn Hora, bad Nakshatras, and lunar volatility windows.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formSettings.enableVedicFilter}
                onChange={(e) => handleFieldChange("enableVedicFilter", e.target.checked)}
                className="h-4 w-4 rounded border-xr-border text-xr-mint bg-xr-bg focus:ring-xr-mint shrink-0 cursor-pointer"
              />
            </div>

            {/* News Catalyst Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-xr-border/40">
              <div className="flex flex-col space-y-0.5">
                <span className="font-mono text-xs text-xr-text">Enable News Catalyst Strategy</span>
                <span className="text-[10px] font-sans text-xr-text-dim">
                  Listens to public Binance listing articles to ride launch breakouts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formSettings.enableNewsCatalyst}
                onChange={(e) => handleFieldChange("enableNewsCatalyst", e.target.checked)}
                className="h-4 w-4 rounded border-xr-border text-xr-mint bg-xr-bg focus:ring-xr-mint shrink-0 cursor-pointer"
              />
            </div>

            {/* CEX Deviation */}
            <div className="flex justify-between items-center text-xs font-mono pt-1">
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
          </Card>

          {/* LLM Client Settings */}
          <Card className="space-y-4">
            <SectionLabel>BRAIN DECISION ENGINE</SectionLabel>
            
            <div className="flex flex-col space-y-2">
              <span className="font-mono text-xs text-xr-text">Groq Inference Model</span>
              <select
                value={formSettings.groqModel}
                onChange={(e) => handleFieldChange("groqModel", e.target.value)}
                className="bg-xr-bg-elev-2 border border-xr-border rounded-md px-3 py-2 text-xs font-mono text-xr-text outline-none focus:border-xr-border-strong cursor-pointer"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                <option value="llama3-70b-8192">llama3-70b-8192</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
              <span className="text-[10px] text-xr-text-faint font-sans block">
                Model configured for signal confluence annotation. Falls back if key is invalid.
              </span>
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

function floatValue(val: string): number {
  const f = parseFloat(val);
  return isNaN(f) ? 2.0 : f;
}
