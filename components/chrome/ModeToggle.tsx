"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Zap } from "lucide-react";
import { Mode } from "../../lib/types";

interface ModeToggleProps {
  currentMode: Mode;
  onModeChange: (newMode: Mode) => Promise<void>;
}

export default function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetMode: Mode = currentMode === "simulation" ? "live" : "simulation";

  const handleToggleClick = () => {
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onModeChange(targetMode);
    } catch (err) {
      console.error("Failed to change mode:", err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggleClick}
        className="flex items-center space-x-1.5 bg-xr-bg-elev-2 hover:bg-xr-bg-elev-1 border border-xr-border px-3 py-1.5 rounded-full select-none cursor-pointer transition-colors"
      >
        {currentMode === "simulation" ? (
          <>
            <Sun className="h-3.5 w-3.5 text-xr-warn" />
            <span className="text-xs font-mono font-medium tracking-wide text-xr-text uppercase">
              SIMULATION
            </span>
          </>
        ) : (
          <>
            <Zap className="h-3.5 w-3.5 text-xr-mint fill-xr-mint" />
            <span className="text-xs font-mono font-medium tracking-wide text-xr-mint uppercase font-semibold">
              LIVE MODE
            </span>
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="bg-xr-bg-elev-1 border border-xr-border-strong p-6 rounded-lg max-w-md w-full shadow-2xl mx-4"
              >
                <h3 className="text-lg font-sans font-medium text-xr-text mb-2 flex items-center">
                  {targetMode === "live" ? (
                    <>
                      <Zap className="h-5 w-5 text-xr-mint fill-xr-mint mr-2" />
                      Confirm Live Mode Promotion
                    </>
                  ) : (
                    <>
                      <Sun className="h-5 w-5 text-xr-warn mr-2" />
                      Switch to Simulation Mode
                    </>
                  )}
                </h3>
                <p className="text-sm text-xr-text-dim mb-6 font-sans leading-relaxed">
                  {targetMode === "live" ? (
                    <span className="text-xr-loss font-semibold">
                      WARNING: This will authorize real PancakeSwap swaps on BNB Smart Chain mainnet using your local self-custody keys. Verify gas limits and whitelists.
                    </span>
                  ) : (
                    "This will stop live execution and roll back to paper trading. Open positions will continue to be monitored but no new capital will be risked."
                  )}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-mono border border-xr-border text-xr-text-dim hover:text-xr-text rounded-md cursor-pointer transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleConfirm}
                    className={`px-4 py-2 text-xs font-mono font-semibold rounded-md cursor-pointer transition-colors ${
                      targetMode === "live"
                        ? "bg-xr-mint hover:bg-xr-mint-dim text-xr-bg"
                        : "bg-xr-warn hover:bg-amber-500 text-xr-bg"
                    }`}
                  >
                    {loading ? "PROMOTING..." : "CONFIRM SWITCH"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
