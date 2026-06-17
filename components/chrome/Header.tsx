"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Copy, Check } from "lucide-react";
import ConnectionPill from "./ConnectionPill";
import ModeToggle from "./ModeToggle";
import { xorrApi } from "../../lib/api";
import { Mode } from "../../lib/types";
import { formatAddress } from "../../lib/format";

interface HeaderProps {
  connected: boolean;
  currentMode: Mode;
  onModeChange: (newMode: Mode) => Promise<void>;
}

export default function Header({ connected, currentMode, onModeChange }: HeaderProps) {
  const pathname = usePathname();
  const [address, setAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAddress() {
      try {
        const data = await xorrApi.getWallet();
        if (data && data.address) {
          setAddress(data.address);
        }
      } catch (err) {
        // fail silently or set defaults
        console.error("Failed to load address:", err);
      }
    }
    loadAddress();
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const navLinks = [
    { name: "Overview", path: "/" },
    { name: "Trades", path: "/trades" },
    { name: "Brain", path: "/brain" },
    { name: "Backtest", path: "/backtest" },
    { name: "Wallet", path: "/wallet" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-xr-bg/80 backdrop-blur-md border-b border-xr-border flex items-center justify-between px-6 select-none">
      {/* Brand logo */}
      <div className="flex items-center space-x-8">
        <Link href="/" className="font-mono text-lg font-bold tracking-wider">
          <span className="text-xr-mint">x</span>
          <span className="text-xr-violet">orr</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex space-x-6">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? pathname === "/"
                : pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-[13px] font-sans transition-all py-1.5 relative ${
                  isActive
                    ? "text-xr-mint font-medium"
                    : "text-xr-text-dim hover:text-xr-text"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-xr-mint" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right panel cluster */}
      <div className="flex items-center space-x-3">
        <ConnectionPill connected={connected} />
        
        <ModeToggle currentMode={currentMode} onModeChange={onModeChange} />

        {address && (
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 bg-xr-bg-elev-2 hover:bg-xr-bg-elev-1 border border-xr-border px-3 py-1.5 rounded-full select-none cursor-pointer text-xs font-mono text-xr-text transition-colors"
          >
            <span>{formatAddress(address)}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-xr-mint" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-xr-text-dim" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
