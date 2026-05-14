"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Calendar, Camera } from "lucide-react";
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
  postureDistDesc: string;
  timelineRange: string;
  timelineTitle: string;
  timelineDesc: string;
  motionEvent: string;
  hubTitle: string;
  hubDesc: string;
  hubRecord: { title: string; desc: string };
  hubAnalysis: { title: string; desc: string };
  hubHistory: { title: string; desc: string };
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
    postureDistDesc: "지난밤 동안 어떤 자세로 얼마나 머물렀는지 시간 비율로 정리했어요.",
    timelineRange: "00:00 — 07:00",
    timelineTitle: "밤 동안의 자세 변화",
    timelineDesc: "잠든 시간부터 깨어난 시간까지, 자세가 어떻게 바뀌었는지 시간 순서대로 표시합니다.",
    motionEvent: "움직임 감지 이벤트",
    hubTitle: "이어서 할 일",
    hubDesc: "다른 화면으로 빠르게 이동할 수 있어요.",
    hubRecord: { title: "수면 기록 시작", desc: "오늘 밤 카메라로 자세를 기록해 보세요." },
    hubAnalysis: { title: "분석 리포트 보기", desc: "지난밤을 더 깊게 — 사진 갤러리와 타임라인까지." },
    hubHistory: { title: "수면 이력 보기", desc: "최근 14일의 자세와 컨디션을 한눈에." },
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
    postureDistDesc: "Time spent in each posture through the night, as a percentage.",
    timelineRange: "00:00 — 07:00",
    timelineTitle: "Posture across the night",
    timelineDesc: "How your posture shifted from when you fell asleep to when you woke up.",
    motionEvent: "Motion-detected events",
    hubTitle: "What's next",
    hubDesc: "Jump to other screens quickly.",
    hubRecord: { title: "Start recording", desc: "Capture posture with the bedside camera tonight." },
    hubAnalysis: { title: "Open analysis", desc: "Dig deeper — photo gallery and timeline." },
    hubHistory: { title: "Browse history", desc: "Last 14 days of posture and morning conditions." },
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

          <div className="mt-6 pt-6 border-t border-white/[0.08]">
            <MorningConditions date={today} initial={condition} bare />
          </div>
        </Card>

        <Card>
          <CardTitle description={t.postureDistDesc}>{t.postureDist}</CardTitle>
          <PosturePie data={distribution} />
          <div className="mt-2">
            <PostureLegend data={distribution} />
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint={t.timelineRange} description={t.timelineDesc}>{t.timelineTitle}</CardTitle>
        <PostureTimeline logs={logs} />
        <div className="mt-5 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_rgba(247,212,136,0.8)]" />
            {t.motionEvent}
          </span>
        </div>
      </Card>

      <div className="mb-2">
        <h3 className="text-base md:text-[17px] font-semibold tracking-tight text-foreground">
          {t.hubTitle}
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground/85">
          {t.hubDesc}
        </p>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-5 mt-3">
        <HubCard href="/record" icon={Camera} title={t.hubRecord.title} desc={t.hubRecord.desc} accent="primary" />
        <HubCard href="/analysis" icon={BarChart3} title={t.hubAnalysis.title} desc={t.hubAnalysis.desc} accent="accent" />
        <HubCard href="/history" icon={Calendar} title={t.hubHistory.title} desc={t.hubHistory.desc} accent="primary-3" />
      </div>
      </>
      )}
    </>
  );
}

function HubCard({
  href,
  icon: Icon,
  title,
  desc,
  accent,
}: {
  href: string;
  icon: typeof Camera;
  title: string;
  desc: string;
  accent: "primary" | "accent" | "primary-3";
}) {
  const accentColor: Record<string, string> = {
    primary: "from-primary/30 to-primary-2/20 text-primary-3",
    accent: "from-accent/25 to-accent/10 text-accent",
    "primary-3": "from-primary-3/25 to-primary/10 text-primary-3",
  };
  return (
    <Link
      href={href}
      className="group relative rounded-3xl p-6 border border-white/10 bg-card/40 backdrop-blur-md hover:border-primary-3/40 hover:bg-card/55 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${accentColor[accent]} opacity-30 blur-3xl group-hover:opacity-50 transition-opacity`}
      />
      <div className={`relative size-12 rounded-2xl bg-gradient-to-br ${accentColor[accent]} grid place-items-center mb-4`}>
        <Icon className="size-5" />
      </div>
      <div className="relative">
        <div className="font-bold text-foreground text-base mb-1.5 group-hover:text-primary-3 transition-colors">
          {title}
        </div>
        <p className="text-sm text-foreground-soft/80 leading-relaxed mb-3">
          {desc}
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-3 group-hover:gap-2.5 transition-all">
          <span>이동</span>
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}
