"use client";

import React from "react";

interface ConnectionPillProps {
  connected: boolean;
}

export default function ConnectionPill({ connected }: ConnectionPillProps) {
  return (
    <div className="flex items-center space-x-2 bg-xr-bg-elev-2 border border-xr-border px-3 py-1.5 rounded-full select-none">
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-xr-mint animate-pulse" : "bg-xr-loss"
        }`}
      />
      <span className="text-xs font-mono font-medium tracking-wide uppercase">
        {connected ? (
          <span className="text-xr-text">ONLINE</span>
        ) : (
          <span className="text-xr-text-dim">OFFLINE</span>
        )}
      </span>
    </div>
  );
}
