"use client";

import React, { useEffect, useState } from "react";
import Header from "./Header";
import LiveLog from "../engine/LiveLog";
import { Mode } from "../../lib/types";
import { xorrApi } from "../../lib/api";

interface ClientShellProps {
  children: React.ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  const [connected, setConnected] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>("simulation");

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const health = await xorrApi.getHealth();
        setConnected(health.ok);
        
        const overview = await xorrApi.getOverview();
        setCurrentMode(overview.mode);
      } catch (err) {
        setConnected(false);
        console.error("Initialization check failed:", err);
      }
    }
    init();
  }, []);

  // Health poll (every 5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const health = await xorrApi.getHealth();
        setConnected(health.ok);
      } catch {
        setConnected(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Mode change handler
  const handleModeChange = async (newMode: Mode) => {
    try {
      const res = await xorrApi.setMode(newMode);
      if (res && res.success) {
        setCurrentMode(res.mode);
      }
    } catch (err) {
      console.error("Mode change failed:", err);
      throw err;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-xr-bg text-xr-text font-sans">
      <Header
        connected={connected}
        currentMode={currentMode}
        onModeChange={handleModeChange}
      />
      
      {/* Scrollable Main content area */}
      <main className="flex-1 overflow-y-auto px-8 py-6 max-w-[1440px] w-full mx-auto pb-10">
        {children}
      </main>

      {/* Terminal logs panel at the bottom */}
      <LiveLog />
    </div>
  );
}
