import React from "react";
import { LogEntry } from "../../lib/types";

interface LogLineProps {
  entry: LogEntry;
}

export default function LogLine({ entry }: LogLineProps) {
  // Level styling
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "error":
        return "text-xr-loss";
      case "warn":
      case "warning":
        return "text-xr-warn";
      case "debug":
        return "text-xr-text-faint";
      default:
        return "text-xr-text";
    }
  };

  // Helper to parse source tag if present in message (e.g. "[bot] ..." or "[MONITOR] ...")
  let source = "bot";
  let message = entry.msg || "";
  const match = message.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    source = match[1];
    message = match[2];
  }

  // Format timestamp (just HH:MM:SS)
  let timeStr = "";
  if (entry.t) {
    try {
      const parts = entry.t.split("T");
      if (parts.length > 1) {
        timeStr = parts[1].substring(0, 8);
      } else {
        timeStr = entry.t.substring(11, 19);
      }
    } catch {
      timeStr = entry.t;
    }
  }

  return (
    <div className="flex items-start space-x-2 text-[12px] font-mono leading-relaxed py-0.5 select-text hover:bg-xr-bg-elev-1 px-2">
      <span className="text-xr-text-faint shrink-0 select-none">{timeStr}</span>
      <span className="text-xr-mint font-medium shrink-0 select-none">[{source}]</span>
      <span className={`${getLevelColor(entry.level)} break-all`}>{message}</span>
    </div>
  );
}
