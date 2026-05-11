"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle, Stat } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { HistoryChart } from "./history-chart";
import { useLang, type Lang } from "@/lib/lang";
import type { SleepSession } from "@/lib/types";

const COPY: Record<Lang, {
  eyebrow: string;
  title: string;
  description: string;
  avgDuration: string;
  longest: string;
  shortest: string;
  motionAvg: string;
  motionUnit: string;
  durationTrendHint: string;
  durationTrend: string;
  byDate: string;
  hours: string;
  minutes: string;
  motion: string;
  countUnit: string;
}> = {
  ko: {
    eyebrow: "최근 14일",
    title: "수면 이력",
    description: "날짜별 수면 시간을 한눈에 확인하세요. 카드를 눌러 상세 분석으로 이동합니다.",
    avgDuration: "평균 수면 시간",
    longest: "가장 길었던 밤",
    shortest: "가장 짧았던 밤",
    motionAvg: "평균 움직임",
    motionUnit: "회",
    durationTrendHint: "14일 추이",
    durationTrend: "수면 시간 변화",
    byDate: "날짜별 기록",
    hours: "시간",
    minutes: "분",
    motion: "움직임",
    countUnit: "회",
  },
  en: {
    eyebrow: "Last 14 days",
    title: "Sleep history",
    description: "Scan durations day by day. Tap a row to open the detailed analysis.",
    avgDuration: "Avg sleep",
    longest: "Longest night",
    shortest: "Shortest night",
    motionAvg: "Avg motion",
    motionUnit: "x",
    durationTrendHint: "14-day trend",
    durationTrend: "Sleep duration over time",
    byDate: "Daily records",
    hours: "h",
    minutes: "m",
    motion: "movements",
    countUnit: "x",
  },
};

export function HistoryView({ history }: { history: SleepSession[] }) {
  const { lang } = useLang();
  const t = COPY[lang];

  if (history.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
        />
        <EmptyState />
      </>
    );
  }

  const longest = history.reduce((a, b) =>
    b.duration_min > a.duration_min ? b : a
  );
  const shortest = history.reduce((a, b) =>
    b.duration_min < a.duration_min ? b : a
  );
  const avgDuration = Math.round(
    history.reduce((s, h) => s + h.duration_min, 0) / Math.max(1, history.length)
  );
  const avgMotion = Math.round(
    history.reduce((s, h) => s + h.motion_count, 0) / Math.max(1, history.length)
  );
  const maxDuration = Math.max(...history.map((h) => h.duration_min), 1);

  const fmtHM = (mins: number) =>
    lang === "ko"
      ? `${Math.floor(mins / 60)}h${mins % 60}m`
      : `${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-5">
        <Card>
          <Stat label={t.avgDuration} value={fmtHM(avgDuration)} />
        </Card>
        <Card>
          <Stat label={t.longest} value={fmtHM(longest.duration_min)} hint={longest.date} />
        </Card>
        <Card>
          <Stat label={t.shortest} value={fmtHM(shortest.duration_min)} hint={shortest.date} />
        </Card>
        <Card>
          <Stat label={t.motionAvg} value={avgMotion} unit={t.motionUnit} />
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint={t.durationTrendHint}>{t.durationTrend}</CardTitle>
        <HistoryChart data={history} />
      </Card>

      <Card>
        <CardTitle>{t.byDate}</CardTitle>
        <ul className="divide-y divide-border -mx-2">
          {history
            .slice()
            .reverse()
            .map((h) => {
              const hours = Math.floor(h.duration_min / 60);
              const mins = h.duration_min % 60;
              const meta =
                lang === "ko"
                  ? `${t.motion} ${h.motion_count}${t.countUnit}`
                  : `${h.motion_count} ${t.motion}`;
              return (
                <li key={h.date}>
                  <Link
                    href={`/analysis?date=${h.date}`}
                    className="flex items-center justify-between px-3 py-3.5 hover:bg-white/[0.05] rounded-2xl transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {h.date}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {meta}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary via-primary-3 to-accent shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                          style={{ width: `${(h.duration_min / maxDuration) * 100}%` }}
                        />
                      </div>
                      <div className="font-semibold tabular-nums w-16 text-right gradient-text">
                        {hours}{t.hours}{mins}{t.minutes}
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary-3 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      </Card>
    </>
  );
}
