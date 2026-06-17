"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatMoney } from "../../lib/format";

interface EquityPoint {
  t: string;
  equityUsd: number;
}

interface EquityCurveProps {
  data: EquityPoint[];
}

export default function EquityCurve({ data }: EquityCurveProps) {
  // Format dates for XAxis (displays hour or date)
  const formatXAxis = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const formatTooltipDate = (isoString: any) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7AF0C8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#7AF0C8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <XAxis
            dataKey="t"
            tickFormatter={formatXAxis}
            stroke="#5A5A66"
            fontSize={9}
            fontFamily="monospace"
            dy={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#5A5A66"
            fontSize={9}
            fontFamily="monospace"
            tickFormatter={(val) => `$${val.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#11121a",
              border: "1px solid rgba(180, 124, 255, 0.16)",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "11px",
            }}
            labelFormatter={formatTooltipDate}
            formatter={(value: any) => [formatMoney(Number(value)), "Equity"]}
          />
          <Area
            type="monotone"
            dataKey="equityUsd"
            stroke="#7AF0C8"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#equityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
