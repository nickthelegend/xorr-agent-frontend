import React from "react";
import clsx from "clsx";

interface KpiNumberProps {
  value: React.ReactNode;
  label: string;
  subValue?: React.ReactNode;
  className?: string;
}

export default function KpiNumber({ value, label, subValue, className }: KpiNumberProps) {
  return (
    <div className={clsx("flex flex-col select-none", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-xr-text-faint pb-1.5">
        {label}
      </span>
      <span className="font-mono text-2xl lg:text-3xl font-semibold text-xr-mint tracking-tight">
        {value}
      </span>
      {subValue && (
        <span className="text-[11px] font-sans text-xr-text-dim mt-1.5">
          {subValue}
        </span>
      )}
    </div>
  );
}
