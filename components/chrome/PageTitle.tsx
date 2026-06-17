import React from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({
  title,
  subtitle = "AUTONOMOUS TRADING AGENT",
}: PageTitleProps) {
  return (
    <div className="flex items-baseline space-x-3 mb-6 select-none">
      <h1 className="text-[28px] font-sans font-medium text-xr-text leading-none">
        {title}
      </h1>
      <span className="text-[11px] font-mono tracking-[0.22em] text-xr-text-dim uppercase leading-none">
        {subtitle}
      </span>
    </div>
  );
}
