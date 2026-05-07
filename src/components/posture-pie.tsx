"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { POSTURE_COLOR, POSTURE_KO, type Posture } from "@/lib/types";

interface DistEntry {
  posture: Posture;
  count: number;
  pct: number;
}

export function PosturePie({ data }: { data: DistEntry[] }) {
  const filtered = data.filter((d) => d.count > 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="h-64 w-full">
      {mounted && (
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="posture"
            innerRadius={56}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {filtered.map((entry) => (
              <Cell key={entry.posture} fill={POSTURE_COLOR[entry.posture]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e3d6",
              fontSize: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
            formatter={((value: unknown, _name: unknown, item: unknown) => {
              const payload = (item as { payload?: DistEntry } | undefined)?.payload;
              const p = (payload?.posture ?? "Unknown") as Posture;
              return [
                `${value}회 (${payload?.pct ?? 0}%)`,
                POSTURE_KO[p],
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
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li
          key={d.posture}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: POSTURE_COLOR[d.posture] }}
            />
            <span className="font-medium">{POSTURE_KO[d.posture]}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="tabular-nums text-muted-foreground">
              {d.count}회
            </span>
            <span className="tabular-nums font-semibold w-12 text-right">
              {d.pct}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
