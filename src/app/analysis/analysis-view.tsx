"use client";

import Link from "next/link";
import { ArrowRight, Film, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostureLegend, PosturePie } from "@/components/posture-pie";
import { PostureTimeline } from "@/components/posture-timeline";
import { Button, Card, CardTitle, Stat } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { useLang, type Lang } from "@/lib/lang";
import { fmtDate } from "@/lib/i18n";
import type { Posture, PostureLog, SleepSession } from "@/lib/types";

type DistEntry = { posture: Posture; count: number; pct: number };

type Props = {
  date: string;
  logs: PostureLog[];
  session: SleepSession;
  distribution: DistEntry[];
  total: number;
};

const COPY: Record<Lang, {
  title: string;
  description: string;
  changeDate: string;
  summaryTitle: string;
  sleepLabel: string;
  regularLabel: string;
  motionLabel: string;
  countUnit: string;
  postureDist: string;
  records: (n: number) => string;
  timelineHint: string;
  timelineTitle: string;
  timelapse: string;
  timelapseTitle: string;
  timelapseHint: string;
  timelapseDownload: string;
  prescriptionLabel: string;
  prescription: Record<Posture, string>;
  insightsTitle: string;
  insights: { emoji: string; title: string; body: string }[];
}> = {
  ko: {
    title: "수면 분석 리포트",
    description: "밤새 자세 분포와 변화를 정리해 보여드립니다.",
    changeDate: "다른 날짜 보기",
    summaryTitle: "수면 요약",
    sleepLabel: "수면",
    regularLabel: "정기",
    motionLabel: "움직임",
    countUnit: "회",
    postureDist: "자세 분포",
    records: (n) => `${n}개 기록`,
    timelineHint: "시간대별",
    timelineTitle: "자세 변화 타임라인",
    timelapse: "타임랩스",
    timelapseTitle: "30초 요약 영상",
    timelapseHint: "Python 사이드에서 mp4 업로드 시 표시",
    timelapseDownload: "영상 다운로드",
    prescriptionLabel: "자세 가이드",
    prescription: {
      Prone: "엎드린 자세 비율이 높습니다. 목에 부담이 큰 자세이니 베개를 얇게 사용하거나 옆으로 자도록 시도해보세요.",
      Lateral_R: "오른쪽으로 누운 자세가 가장 많아요. 한쪽으로 오래 누우면 어깨에 압력이 쌓이니 바디필로우로 분산을 권장합니다.",
      Lateral_L: "왼쪽으로 누운 자세는 소화에 좋습니다. 어깨가 눌리지 않도록 양 무릎 사이에 베개를 두세요.",
      Supine: "똑바로 누운 자세(앙와위)가 가장 많아요. 코골이가 잦다면 베개 높이를 조금 높여 호흡을 편하게 해보세요.",
      Unknown: "자세 데이터가 부족합니다. 카메라 각도를 확인해보세요.",
    },
    insightsTitle: "인사이트 카드",
    insights: [
      { emoji: "🛏️", title: "베개 높이", body: "측와위 비율이 60% 이상이라면 어깨 너비에 맞는 6-10cm 높이의 베개가 척추 정렬에 도움이 됩니다." },
      { emoji: "🌬️", title: "호흡 안정", body: "코골이 위험을 낮추려면 머리를 약간 높이고 옆으로 누우세요. 측와위는 기도 폐쇄를 줄여줍니다." },
      { emoji: "💪", title: "측면 압력 분산", body: "한쪽으로 오래 누우면 그쪽 어깨에 압력이 쌓입니다. 무릎 사이 쿠션으로 골반 회전을 막아주세요." },
    ],
  },
  en: {
    title: "Sleep analysis report",
    description: "A roundup of how your posture moved through the night.",
    changeDate: "Pick another date",
    summaryTitle: "Sleep summary",
    sleepLabel: "Sleep",
    regularLabel: "Regular",
    motionLabel: "Motion",
    countUnit: "x",
    postureDist: "Posture distribution",
    records: (n) => `${n} records`,
    timelineHint: "By hour",
    timelineTitle: "Posture timeline",
    timelapse: "Timelapse",
    timelapseTitle: "30-second summary",
    timelapseHint: "Shown once the Python side uploads an mp4",
    timelapseDownload: "Download video",
    prescriptionLabel: "Posture tip",
    prescription: {
      Prone: "You spent a lot of time face-down. That tends to strain the neck — try a thinner pillow or shifting onto your side.",
      Lateral_R: "Right-side sleeping was the most common. Long stretches on one side stack pressure on that shoulder — a body pillow helps spread the load.",
      Lateral_L: "Left-side sleeping helps digestion. Keep a pillow between your knees so your shoulders don't get pinched.",
      Supine: "Back-sleeping dominated. If snoring is frequent, raise the pillow slightly to ease your airway.",
      Unknown: "Not enough posture data — double-check the camera angle.",
    },
    insightsTitle: "Insight cards",
    insights: [
      { emoji: "🛏️", title: "Pillow height", body: "If side-sleeping is over 60%, a 6–10cm pillow matched to your shoulder width helps spinal alignment." },
      { emoji: "🌬️", title: "Steady breathing", body: "To reduce snoring risk, raise your head a touch and sleep on your side — lateral postures keep the airway open." },
      { emoji: "💪", title: "Side pressure relief", body: "Long stretches on one side stack pressure on that shoulder. A cushion between the knees prevents pelvic rotation." },
    ],
  },
};

export function AnalysisView({
  date,
  logs,
  session,
  distribution,
  total,
}: Props) {
  const { lang } = useLang();
  const t = COPY[lang];

  if (logs.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow={fmtDate(date, lang)}
          title={t.title}
          description={t.description}
          actions={
            <Link href="/history">
              <Button variant="secondary" size="sm">
                {t.changeDate} <ArrowRight className="size-4" />
              </Button>
            </Link>
          }
        />
        <EmptyState />
      </>
    );
  }

  const top = distribution.reduce((a, b) => (b.count > a.count ? b : a));
  const sleepStr = `${Math.floor(session.duration_min / 60)}h${session.duration_min % 60}m`;

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(date, lang)}
        title={t.title}
        description={t.description}
        actions={
          <Link href="/history">
            <Button variant="secondary" size="sm">
              {t.changeDate} <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-5 mb-5">
        <Card className="lg:col-span-2">
          <CardTitle>{t.summaryTitle}</CardTitle>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase font-medium mb-2">
              {t.sleepLabel}
            </div>
            <div className="text-[44px] font-semibold tracking-tight tabular-nums leading-none gradient-text">
              {sleepStr}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-center">
            <Stat label={t.regularLabel} value={session.regular_count} unit={t.countUnit} />
            <Stat label={t.motionLabel} value={session.motion_count} unit={t.countUnit} />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle hint={t.records(total)}>{t.postureDist}</CardTitle>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <PosturePie data={distribution} />
            <PostureLegend data={distribution} />
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint={t.timelineHint}>{t.timelineTitle}</CardTitle>
        <PostureTimeline logs={logs} />
      </Card>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 mb-5">
        <Card>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Film className="size-3.5" />
            {t.timelapse}
          </div>
          <div className="relative aspect-video rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1645] to-[#0d0a2c] grid place-items-center text-center overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.4), transparent 55%), radial-gradient(circle at 75% 75%, rgba(247,212,136,0.18), transparent 55%)",
              }}
            />
            <div className="relative">
              <div className="size-12 mx-auto mb-2 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                <Film className="size-5 text-primary-3" />
              </div>
              <div className="text-sm text-foreground-soft font-medium">{t.timelapseTitle}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t.timelapseHint}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full">
            {t.timelapseDownload}
          </Button>
        </Card>

        <Card variant="feature" className="overflow-hidden">
          <div
            aria-hidden
            className="absolute -bottom-12 -right-12 size-36 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent/90 mb-3 font-semibold">
            <Lightbulb className="size-3.5" />
            {t.prescriptionLabel}
          </div>
          <p className="relative text-sm leading-relaxed text-foreground-soft">
            {t.prescription[top.posture]}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>{t.insightsTitle}</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.insights.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:bg-white/[0.07] hover:border-white/15 transition-all backdrop-blur"
            >
              <div className="text-2xl mb-2.5">{card.emoji}</div>
              <div className="text-sm font-semibold mb-1.5 text-foreground">
                {card.title}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
