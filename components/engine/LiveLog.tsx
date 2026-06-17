"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSSE } from "../../lib/sse";
import { LogEntry } from "../../lib/types";
import LogLine from "./LogLine";

export default function LiveLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNewLog = (entry: LogEntry) => {
    setLogs((prev) => {
      // Keep only last 200 logs
      const combined = [...prev, entry];
      if (combined.length > 200) {
        return combined.slice(combined.length - 200);
      }
      return combined;
    });
  };

  const { connected } = useSSE<LogEntry>("/api/stream/log", "log", handleNewLog);

  // Auto-scroll logic
  useEffect(() => {
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  // Click to pause auto-scroll for 10s
  const handlePanelClick = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      onClick={handlePanelClick}
      className="w-full h-40 bg-[#0d0e15] border-t border-xr-border flex flex-col shrink-0 relative select-none cursor-pointer"
    >
      {/* Log Header / Status strip */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#08090d] border-b border-xr-border text-[10px] font-mono tracking-wider text-xr-text-dim uppercase">
        <span>ENGINE CONSOLE LOGS</span>
        
        <div className="flex items-center space-x-2">
          {isPaused && (
            <span className="bg-xr-warn/25 text-xr-warn border border-xr-warn/40 px-2 py-0.5 rounded-sm animate-pulse text-[9px] font-semibold">
              SCROLL PAUSED
            </span>
          )}

          {!connected && (
            <span className="bg-xr-violet/25 text-xr-violet border border-xr-violet/40 px-2 py-0.5 rounded-sm animate-pulse text-[9px] font-semibold">
              RECONNECTING...
            </span>
          )}

          <span className="text-xr-text-faint">
            {connected ? "LIVE FEED ACTIVE" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-2 font-mono scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="text-[12px] font-mono text-xr-text-faint px-4 py-1 italic select-none">
            {connected ? "Awaiting engine logs..." : "Connection offline. Logs unavailable."}
          </div>
        ) : (
          logs.map((entry, idx) => (
            <LogLine key={`${entry.t}-${idx}`} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
