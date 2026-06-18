"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../components/chrome/PageTitle";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import Button from "../../components/ui/Button";
import { xorrApi } from "../../lib/api";
import { WalletResponse } from "../../lib/types";
import { formatMoney, formatAddress } from "../../lib/format";
import { Copy, Check, QrCode, RefreshCw, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const loadWallet = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const res = force ? await xorrApi.refreshWallet() : await xorrApi.getWallet();
      setWallet(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch wallet info.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleCopy = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 h-full justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 text-xr-mint animate-spin" />
        <span className="font-mono text-xs text-xr-text-dim uppercase tracking-wider">
          POLLING ON-CHAIN LEDGER...
        </span>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="space-y-6">
        <PageTitle title="Wallet" subtitle="SELF-CUSTODIAL · BNB CHAIN" />
        <Card className="border-xr-loss/40 bg-xr-loss/5 max-w-xl">
          <SectionLabel className="text-xr-loss">RPC FAULT</SectionLabel>
          <p className="text-sm font-mono text-xr-text mb-4">
            Could not communicate with BNB chain RPC nodes or TWAK daemon.
          </p>
          <p className="text-xs font-mono text-xr-text-dim">Error: {error}</p>
          <Button variant="outline" className="mt-6 font-mono" onClick={() => loadWallet(true)}>
            RETRY RPC CALL
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate gas percentage for display meter
  // Threshold: 0.005 BNB
  const bnbBalance = wallet.balances.find((b) => b.symbol === "BNB")?.amount || 0.0;
  const gasThreshold = wallet.gasThresholdBnb;
  // Cap percentage at 100
  const gasPct = Math.min(100, (bnbBalance / gasThreshold) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Wallet" subtitle="SELF-CUSTODIAL · BNB CHAIN" />
        
        <button
          onClick={() => loadWallet(true)}
          disabled={refreshing}
          className="flex items-center space-x-1.5 font-mono text-[10px] uppercase tracking-wider text-xr-text-dim hover:text-xr-text transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-xr-mint" : ""}`} />
          <span>ON-CHAIN REFRESH</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Address, QR, and Warnings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Wallet Address Card */}
          <Card className="space-y-4">
            <SectionLabel>AGENT WALLET DETAILS</SectionLabel>
            
            <div className="flex flex-col space-y-1.5">
              <span className="text-[10px] font-sans text-xr-text-dim uppercase">Active Network</span>
              <span className="font-mono text-xs font-semibold text-xr-mint uppercase tracking-wider">
                {wallet.network}
              </span>
            </div>

            <div className="flex flex-col space-y-1.5">
              <span className="text-[10px] font-sans text-xr-text-dim uppercase">Decrypted Address</span>
              <div className="flex items-center justify-between bg-xr-bg border border-xr-border rounded-md px-3 py-2">
                <span className="font-mono text-xs text-xr-text break-all select-all pr-2">
                  {wallet.address}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-xr-text-dim hover:text-xr-text transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-xr-mint" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* QR Deposit Toggle */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowQr(!showQr)}
                className="flex items-center space-x-1.5 w-full justify-center"
              >
                <QrCode className="h-4 w-4 text-xr-mint" />
                <span>{showQr ? "HIDE DEPOSIT QR" : "SHOW DEPOSIT QR"}</span>
              </Button>
            </div>

            {/* Deposit QR (animated expand) */}
            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 bg-[#08090d]/60 border border-xr-border rounded-md animate-fade-in text-center">
                <div className="relative p-1 bg-white rounded-lg shadow-inner mb-3">
                  {/* Local PNG base64 QR from the server response */}
                  <img
                    src={wallet.qrPngBase64}
                    alt="Deposit Address QR"
                    className="w-48 h-48 block"
                  />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint block">
                  Send USDT or BNB on BSC only.<br />
                  Other chains will be lost permanently.
                </span>
              </div>
            )}
          </Card>

          {/* Real on-chain self-custody wallet — fund this to go live */}
          <Card className="space-y-3 border-xr-mint/30">
            <div className="flex items-center justify-between">
              <SectionLabel className="text-xr-mint">ON-CHAIN AGENT WALLET · FUND HERE</SectionLabel>
              <span className="font-mono text-[9px] uppercase tracking-wider text-xr-text-faint">
                {wallet.onchain?.gasOk ? "LIVE-READY" : "NEEDS FUNDING"}
              </span>
            </div>
            <p className="text-[11px] text-xr-text-dim leading-relaxed">
              {wallet.simulation
                ? "The balances on the right are the SIMULATED paper portfolio. The real self-custody wallet below holds actual funds — deposit BNB (gas) + USDT (trading) to this address, then switch to LIVE."
                : "Real on-chain balances of the self-custody agent wallet, signing locally on BNB Chain."}
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-xr-bg border border-xr-border rounded-md px-3 py-2 flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-xr-text-faint">BNB (gas)</span>
                <span className="text-sm text-xr-text font-semibold">{wallet.onchain?.bnb?.toFixed(5) ?? "0.00000"}</span>
                <span className="text-[10px] text-xr-text-dim">{formatMoney(wallet.onchain?.bnbUsd ?? 0)}</span>
              </div>
              <div className="bg-xr-bg border border-xr-border rounded-md px-3 py-2 flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-xr-text-faint">USDT (trading)</span>
                <span className="text-sm text-xr-text font-semibold">{(wallet.onchain?.usdt ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-xr-text-dim">{formatMoney(wallet.onchain?.usdt ?? 0)}</span>
              </div>
            </div>
          </Card>

          {/* Gas Reserve Check */}
          <Card className={clsx("border", wallet.gasOk ? "border-xr-border" : "border-xr-loss/40 bg-xr-loss/5")}>
            <div className="flex items-start space-x-3">
              <div className={clsx("p-2 rounded-full shrink-0", wallet.gasOk ? "bg-xr-win/10 text-xr-win" : "bg-xr-loss/10 text-xr-loss")}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 w-full">
                <SectionLabel className={wallet.gasOk ? "text-xr-text-dim" : "text-xr-loss"}>
                  GAS HEALTH RESERVES
                </SectionLabel>
                <p className="text-xs text-xr-text-dim leading-relaxed">
                  {wallet.gasOk
                    ? "Gas balance is healthy. Agent has sufficient reserves for PancakeSwap swap execution."
                    : "Gas warning: BNB balance is below execution safety threshold. Deposit BNB to avoid transaction failures."}
                </p>
                
                {/* Meter */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between font-mono text-[9px] text-xr-text-faint">
                    <span>{bnbBalance.toFixed(5)} BNB</span>
                    <span>THRESHOLD: {gasThreshold} BNB</span>
                  </div>
                  <div className="w-full h-1.5 bg-xr-bg border border-xr-border rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        wallet.gasOk ? "bg-xr-mint" : "bg-xr-loss"
                      )}
                      style={{ width: `${gasPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Balance Grid */}
        <div className="lg:col-span-7">
          <Card className="p-0 overflow-hidden h-full flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-xr-border">
                <SectionLabel>{wallet.simulation ? "SIMULATED PORTFOLIO (PAPER)" : "ASSET BALANCE LEDGER"}</SectionLabel>
                <p className="text-[11px] font-sans text-xr-text-dim mt-1">
                  {wallet.simulation
                    ? "Paper-trading portfolio used in simulation mode. The real fundable wallet is shown on the left."
                    : "On-chain assets in the agent wallet. Whitelisted assets with balances are displayed."}
                </p>
              </div>

              <div className="divide-y divide-xr-border/40 font-mono text-xs">
                {wallet.balances.map((b) => (
                  <div
                    key={b.symbol}
                    className="flex justify-between items-center px-5 py-3 hover:bg-xr-bg-elev-2/20 transition-colors"
                  >
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-xr-text">{b.symbol}</span>
                      {b.contract && (
                        <span className="text-[10px] text-xr-text-faint">
                          {formatAddress(b.contract)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-0.5">
                      <span className="text-xr-text font-semibold">
                        {b.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 5,
                        })}
                      </span>
                      <span className="text-[10px] text-xr-text-dim">
                        {formatMoney(b.usd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-5 py-4 bg-[#08090d]/40 border-t border-xr-border text-center">
              <span className="font-mono text-[10px] text-xr-text-faint uppercase tracking-wider block">
                Total Account Valuation: {formatMoney(wallet.balances.reduce((acc, curr) => acc + curr.usd, 0))}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
