"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SleepSession } from "@/lib/types";

export function HistoryChart({ data }: { data: SleepSession[] }) {
  const series = data.map((d) => ({
    date: d.date.slice(5),
    score: d.score,
    duration: Math.round((d.duration_min / 60) * 10) / 10,
  }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="h-72 -ml-3">
      {mounted && (
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={series}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a2e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1a1a2e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#e7e3d6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b6b7c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#6b6b7c" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e3d6",
              fontSize: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
            formatter={((v: unknown, name: unknown) => [
              name === "score" ? `${v}점` : `${v}시간`,
              name === "score" ? "점수" : "수면",
            ]) as never}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#1a1a2e"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
