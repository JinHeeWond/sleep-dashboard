"use client";

import Link from "next/link";
import { Camera, Moon, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostureLegend, PosturePie } from "@/components/posture-pie";
import { PostureTimeline } from "@/components/posture-timeline";
import { MorningConditions } from "@/components/morning-conditions";
import { EmptyState } from "@/components/empty-state";
import { Button, Card, CardTitle, Stat } from "@/components/ui";
import { useLang, type Lang } from "@/lib/lang";
import { POSTURE_LABEL, fmtDate } from "@/lib/i18n";
import type {
  MorningCondition,
  PostureLog,
  Posture,
  SleepSession,
} from "@/lib/types";

type DistEntry = { posture: Posture; count: number; pct: number };

type Props = {
  logs: PostureLog[];
  session: SleepSession;
  history: SleepSession[];
  distribution: DistEntry[];
  userName: string;
  today: string;
  condition: MorningCondition | null;
};

const COPY: Record<Lang, {
  greeting: (name: string) => string;
  description: string;
  startTonight: string;
  summaryHint: string;
  summaryTitle: string;
  totalSleep: string;
  totalSleepUnit: string;
  totalSleepHint: (m: number) => string;
  postureChange: string;
  postureChangeUnit: string;
  postureChangeHint: string;
  topPosture: string;
  topPostureHint: (label: string) => string;
  weekAvgSleep: string;
  weekAvgSleepHintUp: (m: number) => string;
  weekAvgSleepHintDown: (m: number) => string;
  postureDist: string;
  timelineRange: string;
  timelineTitle: string;
  motionEvent: string;
  weeklyTrend: string;
  weeklyTrendHint: (n: number) => string;
  weeklyTrendTooltip: (date: string, hours: number, mins: number) => string;
  nextStep: string;
  nextStepBody: string;
  nextStepCta: string;
}> = {
  ko: {
    greeting: (name) => `좋은 아침이에요, ${name}님 🌤️`,
    description: "어젯밤 수면 자세 분석 결과예요.",
    startTonight: "오늘 밤 기록 시작",
    summaryHint: "지난밤",
    summaryTitle: "오늘의 수면 요약",
    totalSleep: "총 수면 시간",
    totalSleepUnit: "시간",
    totalSleepHint: (m) => `${m}분`,
    postureChange: "자세 변화",
    postureChangeUnit: "회",
    postureChangeHint: "움직임 이벤트",
    topPosture: "가장 많은 자세",
    topPostureHint: (label) => `주된 자세: ${label}`,
    weekAvgSleep: "7일 평균 수면",
    weekAvgSleepHintUp: (m) => `+${m}분 길어짐`,
    weekAvgSleepHintDown: (m) => `${m}분 짧아짐`,
    postureDist: "자세 분포",
    timelineRange: "00:00 — 07:00",
    timelineTitle: "밤 동안의 자세 변화",
    motionEvent: "움직임 감지 이벤트",
    weeklyTrend: "주간 수면 추세",
    weeklyTrendHint: (n) => `최근 ${n}일 수면 시간`,
    weeklyTrendTooltip: (date, h, m) => `${date}: ${h}시간 ${m}분`,
    nextStep: "다음 단계",
    nextStepBody: "취침 30분 전 알람을 설정하고 분석을 자동으로 시작하세요.",
    nextStepCta: "기록 설정",
  },
  en: {
    greeting: (name) => `Good morning, ${name} 🌤️`,
    description: "Here's last night's posture analysis.",
    startTonight: "Start tonight's recording",
    summaryHint: "Last night",
    summaryTitle: "Tonight's sleep summary",
    totalSleep: "Total sleep",
    totalSleepUnit: "h",
    totalSleepHint: (m) => `${m}m`,
    postureChange: "Posture changes",
    postureChangeUnit: "x",
    postureChangeHint: "Motion events",
    topPosture: "Most-held posture",
    topPostureHint: (label) => `Primary: ${label}`,
    weekAvgSleep: "7-day avg sleep",
    weekAvgSleepHintUp: (m) => `+${m}m longer`,
    weekAvgSleepHintDown: (m) => `${m}m shorter`,
    postureDist: "Posture distribution",
    timelineRange: "00:00 — 07:00",
    timelineTitle: "Posture across the night",
    motionEvent: "Motion-detected events",
    weeklyTrend: "Weekly sleep trend",
    weeklyTrendHint: (n) => `Last ${n}-day sleep duration`,
    weeklyTrendTooltip: (date, h, m) => `${date}: ${h}h ${m}m`,
    nextStep: "Next step",
    nextStepBody: "Set an alarm 30 minutes before bed and let the recorder start automatically.",
    nextStepCta: "Configure recording",
  },
};

export function DashboardView({
  logs,
  session,
  history,
  distribution,
  userName,
  today,
  condition,
}: Props) {
  const { lang } = useLang();
  const t = COPY[lang];
  const hasLogs = logs.length > 0;
  const avgDurationMin = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.duration_min, 0) / history.length)
    : 0;
  const avgDurationH = Math.floor(avgDurationMin / 60);
  const avgDurationM = avgDurationMin % 60;
  const top = distribution.reduce((a, b) => (b.count > a.count ? b : a));
  const totalH = Math.floor(session.duration_min / 60);
  const totalM = session.duration_min % 60;
  const maxDuration = Math.max(...history.map((h) => h.duration_min), 1);

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(new Date(), lang)}
        title={t.greeting(userName)}
        description={t.description}
        actions={
          <Link href="/record">
            <Button>
              <Camera className="size-4" />
              {t.startTonight}
            </Button>
          </Link>
        }
      />

      {!hasLogs && (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
          <div className="lg:col-span-2">
            <EmptyState />
          </div>
          <MorningConditions date={today} initial={condition} />
        </div>
      )}

      {hasLogs && (
      <>
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <Card className="lg:col-span-2">
          <CardTitle hint={t.summaryHint}>{t.summaryTitle}</CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
            <Stat
              label={t.totalSleep}
              value={totalH}
              unit={t.totalSleepUnit}
              hint={t.totalSleepHint(totalM)}
            />
            <Stat
              label={t.postureChange}
              value={session.motion_count}
              unit={t.postureChangeUnit}
              hint={t.postureChangeHint}
            />
            <Stat
              label={t.topPosture}
              value={top.pct}
              unit="%"
              hint={t.topPostureHint(POSTURE_LABEL[lang][top.posture])}
            />
            <Stat
              label={t.weekAvgSleep}
              value={`${avgDurationH}h${avgDurationM}m`}
              hint={
                session.duration_min >= avgDurationMin
                  ? t.weekAvgSleepHintUp(session.duration_min - avgDurationMin)
                  : t.weekAvgSleepHintDown(session.duration_min - avgDurationMin)
              }
            />
          </div>
        </Card>

        <Card>
          <CardTitle>{t.postureDist}</CardTitle>
          <PosturePie data={distribution} />
          <div className="mt-2">
            <PostureLegend data={distribution} />
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint={t.timelineRange}>{t.timelineTitle}</CardTitle>
        <PostureTimeline logs={logs} />
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_rgba(247,212,136,0.8)]" />
            {t.motionEvent}
          </span>
        </div>
      </Card>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <div className="lg:col-span-2">
          <MorningConditions date={today} initial={condition} />
        </div>
        <Card>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3 font-semibold">
            <Moon className="size-3.5 text-accent" /> {t.nextStep}
          </div>
          <p className="text-sm leading-relaxed mb-4 text-foreground-soft">
            {t.nextStepBody}
          </p>
          <Link href="/record">
            <Button variant="secondary" size="sm">
              {t.nextStepCta}
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4 font-semibold">
          <TrendingUp className="size-3.5" /> {t.weeklyTrend}
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {history.map((h) => {
            const hours = Math.floor(h.duration_min / 60);
            const mins = h.duration_min % 60;
            return (
              <div
                key={h.date}
                className="flex-1 rounded-full bg-gradient-to-t from-primary-2/60 via-primary/80 to-primary-3 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                style={{ height: `${(h.duration_min / maxDuration) * 100}%` }}
                title={t.weeklyTrendTooltip(h.date, hours, mins)}
              />
            );
          })}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {t.weeklyTrendHint(history.length)}
        </div>
      </Card>
      </>
      )}
    </>
  );
}
