"use client";

import React from "react";

interface FearGreedGaugeProps {
  value: number;
  label: string;
}

export default function FearGreedGauge({ value, label }: FearGreedGaugeProps) {
  // Angle math:
  // 0% -> 180 deg (left)
  // 100% -> 0 deg (right)
  const clampedVal = Math.max(0, Math.min(100, value));
  const angleRad = Math.PI - (clampedVal / 100) * Math.PI;
  
  const centerX = 100;
  const centerY = 85;
  const needleLength = 50;
  
  const needleX = centerX + needleLength * Math.cos(angleRad);
  const needleY = centerY - needleLength * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center justify-center p-2 relative">
      <svg viewBox="0 0 200 110" className="w-full max-w-[190px] h-auto">
        <defs>
          <linearGradient id="fngGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F87171" />     {/* Red - Extreme Fear */}
            <stop offset="30%" stopColor="#FBBF24" />    {/* Yellow - Fear */}
            <stop offset="50%" stopColor="#8A8A98" />    {/* Gray - Neutral */}
            <stop offset="70%" stopColor="#60A5FA" />    {/* Blue - Greed */}
            <stop offset="100%" stopColor="#7AF0C8" />   {/* Mint - Extreme Greed */}
          </linearGradient>
        </defs>

        {/* Semicircle Gauge Track */}
        <path
          d="M 20 85 A 80 80 0 0 1 180 85"
          fill="none"
          stroke="url(#fngGradient)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Center needle pivot point */}
        <circle cx={centerX} cy={centerY} r="6" fill="#E6E6EE" />
        
        {/* Needle Line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#E6E6EE"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Score Value text */}
        <text
          x={centerX}
          y={centerY + 20}
          textAnchor="middle"
          fill="#7AF0C8"
          className="font-mono text-lg font-semibold"
        >
          {value}
        </text>

        {/* Label text */}
        <text
          x={centerX}
          y={centerY + 34}
          textAnchor="middle"
          fill="#8A8A98"
          className="font-sans text-[9px] uppercase tracking-wider font-medium"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
