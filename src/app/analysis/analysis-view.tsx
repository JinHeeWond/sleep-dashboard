"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Film, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostureLegend, PosturePie } from "@/components/posture-pie";
import { PostureTimeline } from "@/components/posture-timeline";
import { Button, Card, CardTitle, Stat } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { useLang, type Lang } from "@/lib/lang";
import { fmtDate } from "@/lib/i18n";
import { POSTURE_COLOR, POSTURE_KO, type Posture, type PostureLog, type SleepSession } from "@/lib/types";

type DistEntry = { posture: Posture; count: number; pct: number };

type Props = {
  date: string;
  logs: PostureLog[];
  session: SleepSession;
  distribution: DistEntry[];
  total: number;
  timelapseUrl: string | null;
  timelapseSec: number | null;
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
  postureDistDesc: string;
  records: (n: number) => string;
  timelineHint: string;
  timelineTitle: string;
  timelineDesc: string;
  galleryTitle: string;
  galleryDesc: string;
  galleryUnit: string;
  galleryEmpty: string;
  timelapse: string;
  timelapseTitle: string;
  timelapseHint: string;
  timelapseDownload: string;
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
    postureDistDesc: "이 날 밤 어떤 자세로 얼마나 잤는지 비율로 정리했어요.",
    records: (n) => `${n}개 기록`,
    timelineHint: "시간대별",
    timelineTitle: "자세 변화 타임라인",
    timelineDesc: "시간 순으로 자세가 어떻게 바뀌었는지 보여줍니다. 점은 움직임 감지 시점입니다.",
    galleryTitle: "자세 사진 갤러리",
    galleryDesc: "기록 중 카메라가 캡처한 자세 스냅샷을 모아 보여드립니다.",
    galleryUnit: "장",
    galleryEmpty: "아직 업로드된 사진이 없어요",
    timelapse: "타임랩스",
    timelapseTitle: "30초 요약 영상",
    timelapseHint: "캡처가 완료된 뒤 영상이 준비되면 여기에 표시됩니다",
    timelapseDownload: "영상 다운로드",
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
    postureDistDesc: "Time spent in each posture through this night, as a percentage.",
    records: (n) => `${n} records`,
    timelineHint: "By hour",
    timelineTitle: "Posture timeline",
    timelineDesc: "How your posture shifted across the night. Dots mark detected motion events.",
    galleryTitle: "Posture photo gallery",
    galleryDesc: "Snapshots captured by the camera throughout the night.",
    galleryUnit: "photos",
    galleryEmpty: "No photos uploaded yet",
    timelapse: "Timelapse",
    timelapseTitle: "30-second summary",
    timelapseHint: "Shown once the video summary is ready",
    timelapseDownload: "Download video",
  },
};

export function AnalysisView({
  date,
  logs,
  session,
  distribution,
  total,
  timelapseUrl,
  timelapseSec,
}: Props) {
  const { lang } = useLang();
  const t = COPY[lang];
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-timelapse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const data = await res.json();
        setGenError(data.error ?? "생성 실패");
      } else {
        router.refresh();
      }
    } catch {
      setGenError("네트워크 오류");
    } finally {
      setGenerating(false);
    }
  }

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
          <CardTitle hint={t.records(total)} description={t.postureDistDesc}>{t.postureDist}</CardTitle>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <PosturePie data={distribution} />
            <PostureLegend data={distribution} />
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint={t.timelineHint} description={t.timelineDesc}>{t.timelineTitle}</CardTitle>
        <PostureTimeline logs={logs} />
      </Card>

      {(() => {
        const snapshots = logs.filter((l) => l.image_path?.startsWith("http"));
        const locale = lang === "ko" ? "ko-KR" : "en-US";
        return (
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

            <Card>
              <CardTitle
                hint={`${snapshots.length}${t.galleryUnit}`}
                description={t.galleryDesc}
              >
                {t.galleryTitle}
              </CardTitle>
              {snapshots.length === 0 ? (
                <div className="relative aspect-video rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1645] to-[#0d0a2c] grid place-items-center text-center overflow-hidden">
                  <div className="relative">
                    <div className="size-12 mx-auto mb-2 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                      <ImageIcon className="size-5 text-primary-3" />
                    </div>
                    <div className="text-sm text-foreground-soft font-medium">
                      {t.galleryEmpty}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {snapshots.map((log, i) => (
                    <a
                      key={i}
                      href={log.image_path!}
                      target="_blank"
                      rel="noreferrer"
                      className="group block"
                    >
                      <div
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border bg-white/5 transition-all group-hover:ring-2 group-hover:ring-primary-3/60"
                        style={{ borderColor: `${POSTURE_COLOR[log.posture]}50` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={log.image_path!}
                          alt={POSTURE_KO[log.posture]}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div
                          className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
                          style={{
                            background: `linear-gradient(to top, ${POSTURE_COLOR[log.posture]}55, transparent)`,
                          }}
                        />
                        <span
                          className="absolute bottom-1.5 left-2 text-[10px] font-semibold tabular-nums text-white drop-shadow"
                        >
                          {new Date(log.timestamp * 1000).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      <Card className="mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
          <Film className="size-3.5" />
          {t.timelapse}
          {timelapseSec && (
            <span className="ml-auto text-primary-3 font-semibold">
              {Math.round(timelapseSec)}s
            </span>
          )}
        </div>
        <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden bg-black">
          {timelapseUrl ? (
            <video
              src={timelapseUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : (
            <>
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 bg-gradient-to-br from-[#1a1645] to-[#0d0a2c]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.4), transparent 55%), radial-gradient(circle at 75% 75%, rgba(247,212,136,0.18), transparent 55%)",
                }}
              />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="size-12 mx-auto mb-2 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                    <Film className="size-5 text-primary-3" />
                  </div>
                  <div className="text-sm text-foreground-soft font-medium">{t.timelapseTitle}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.timelapseHint}</div>
                </div>
              </div>
            </>
          )}
        </div>
        {genError && (
          <p className="mt-3 text-[11px] text-red-400 text-center">{genError}</p>
        )}
        <div className="mt-4 flex gap-2">
          {timelapseUrl && (
            <a href={timelapseUrl} download target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                {t.timelapseDownload}
              </Button>
            </a>
          )}
          <Button
            variant={timelapseUrl ? "ghost" : "primary"}
            size="sm"
            className={timelapseUrl ? "" : "w-full"}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <><Loader2 className="size-3.5 animate-spin" /> 생성 중…</>
              : timelapseUrl
                ? <><RefreshCw className="size-3.5" /> 재생성</>
                : <><Film className="size-3.5" /> 타임랩스 생성</>
            }
          </Button>
        </div>
      </Card>
    </>
  );
}
