"use client";

import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle, Stat } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { HistoryChart } from "./history-chart";
import { useLang, type Lang } from "@/lib/lang";
import type { MorningCondition, SleepSession } from "@/lib/types";

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
  durationTrendDesc: string;
  byDate: string;
  hours: string;
  minutes: string;
  motion: string;
  countUnit: string;
  refresh: string;
  painNeck: string;
  painShoulder: string;
  painBack: string;
  noCondition: string;
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
    durationTrendDesc: "최근 14일 동안 매일 잠든 시간(시간 단위)을 곡선으로 보여줍니다.",
    byDate: "날짜별 기록",
    hours: "시간",
    minutes: "분",
    motion: "움직임",
    countUnit: "회",
    refresh: "개운함",
    painNeck: "목",
    painShoulder: "어깨",
    painBack: "허리",
    noCondition: "컨디션 미기록",
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
    durationTrendDesc: "Daily sleep duration (in hours) for the last 14 days.",
    byDate: "Daily records",
    hours: "h",
    minutes: "m",
    motion: "movements",
    countUnit: "x",
    refresh: "Refresh",
    painNeck: "Neck",
    painShoulder: "Shoulder",
    painBack: "Back",
    noCondition: "No entry",
  },
};

export function HistoryView({
  history,
  conditions,
}: {
  history: SleepSession[];
  conditions: Record<string, MorningCondition>;
}) {
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
        <CardTitle hint={t.durationTrendHint} description={t.durationTrendDesc}>{t.durationTrend}</CardTitle>
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
              const cond = conditions[h.date];
              const painLabels: string[] = [];
              if (cond?.pain_neck) painLabels.push(t.painNeck);
              if (cond?.pain_shoulder) painLabels.push(t.painShoulder);
              if (cond?.pain_back) painLabels.push(t.painBack);
              return (
                <li key={h.date}>
                  <Link
                    href={`/analysis?date=${h.date}`}
                    className="flex items-center gap-4 px-3 py-3.5 hover:bg-white/[0.05] rounded-2xl transition-colors group"
                  >
                    <div className="shrink-0 w-28">
                      <div className="font-semibold text-sm text-foreground">
                        {h.date}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {meta}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {cond ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {cond.refreshment ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-foreground-soft">
                              <Coffee className="size-3.5 text-accent" />
                              <span className="text-muted-foreground/80">{t.refresh}</span>
                              <span className="font-semibold tabular-nums text-foreground">{cond.refreshment}</span>
                              <span className="text-muted-foreground/60">/5</span>
                            </span>
                          ) : null}
                          {painLabels.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ec4899]/15 border border-[#ec4899]/30 text-[#f0a4d6] font-medium">
                              {painLabels.join("·")}
                            </span>
                          )}
                          {cond.memo ? (
                            <span className="truncate max-w-[220px] text-muted-foreground/75 italic">
                              “{cond.memo}”
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          {t.noCondition}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
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
