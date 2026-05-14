"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { POSTURE_COLOR, type Posture } from "@/lib/types";
import { POSTURE_LABEL } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

interface DistEntry {
  posture: Posture;
  count: number;
  pct: number;
}

export function PosturePie({ data }: { data: DistEntry[] }) {
  const filtered = data.filter((d) => d.count > 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { lang } = useLang();
  return (
    <div className="h-64 w-full relative">
      <div
        aria-hidden
        className="absolute inset-6 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-primary/40 via-transparent to-accent/30 pointer-events-none"
      />
      {mounted && (
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="posture"
            innerRadius={58}
            outerRadius={94}
            paddingAngle={3}
            stroke="rgba(11,10,31,0.6)"
            strokeWidth={2}
          >
            {filtered.map((entry) => (
              <Cell key={entry.posture} fill={POSTURE_COLOR[entry.posture]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(26, 22, 69, 0.92)",
              backdropFilter: "blur(12px)",
              fontSize: 14,
              color: "#f5f3ff",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            }}
            itemStyle={{ color: "#f5f3ff" }}
            labelStyle={{ color: "#a8a3d4" }}
            formatter={((value: unknown, _name: unknown, item: unknown) => {
              const payload = (item as { payload?: DistEntry } | undefined)?.payload;
              const p = (payload?.posture ?? "Unknown") as Posture;
              const unit = lang === "ko" ? "회" : "x";
              return [
                `${value}${unit} (${payload?.pct ?? 0}%)`,
                POSTURE_LABEL[lang][p],
              ];
            }) as never}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}

export function PostureLegend({ data }: { data: DistEntry[] }) {
  const { lang } = useLang();
  const unit = lang === "ko" ? "회" : "x";
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li
          key={d.posture}
          className="flex items-center justify-between text-sm px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="size-2.5 rounded-full shadow-[0_0_10px_currentColor]"
              style={{
                background: POSTURE_COLOR[d.posture],
                color: POSTURE_COLOR[d.posture],
              }}
            />
            <span className="font-medium text-foreground-soft">
              {POSTURE_LABEL[lang][d.posture]}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="tabular-nums text-muted-foreground text-sm">
              {d.count}{unit}
            </span>
            <span className="tabular-nums font-semibold w-12 text-right text-foreground">
              {d.pct}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
