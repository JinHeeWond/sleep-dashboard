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
import { useLang } from "@/lib/lang";

export function HistoryChart({ data }: { data: SleepSession[] }) {
  const { lang } = useLang();
  const series = data.map((d) => ({
    date: d.date.slice(5),
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
              <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.55} />
                <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="durationLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#f7d488" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#a8a3d4" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 12]}
              tick={{ fontSize: 11, fill: "#a8a3d4" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(26, 22, 69, 0.92)",
                backdropFilter: "blur(12px)",
                fontSize: 12,
                color: "#f5f3ff",
                boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#f5f3ff" }}
              labelStyle={{ color: "#a8a3d4" }}
              formatter={((v: unknown) => {
                if (lang === "ko") {
                  return [`${v}시간`, "수면"];
                }
                return [`${v}h`, "Sleep"];
              }) as never}
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="url(#durationLine)"
              strokeWidth={3}
              fill="url(#durationGrad)"
              activeDot={{ r: 5, fill: "#f7d488", stroke: "#1a1645" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
