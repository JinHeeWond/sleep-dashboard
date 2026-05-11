"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { POSTURE_COLOR, type Posture } from "@/lib/types";
import { POSTURE_LABEL } from "@/lib/i18n";
import { useLang, type Lang } from "@/lib/lang";

const POSTURES: Posture[] = ["Supine", "Lateral_L", "Lateral_R", "Prone"];

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

const COPY: Record<Lang, {
  status: string;
  recording: string;
  idle: string;
  elapsed: string;
  streamLabel: string;
  realtimeAnalyzing: string;
  startToPreview: string;
  current: string;
  start: string;
  pause: string;
  reset: string;
  regular: string;
  motion: string;
  events: { hint: string; title: string; empty: string; regularBadge: string; motionBadge: string };
  options: {
    title: string;
    hint: string;
    items: { label: string; value: string; hint: string }[];
  };
}> = {
  ko: {
    status: "상태",
    recording: "기록 중",
    idle: "대기",
    elapsed: "경과 시간",
    streamLabel: "Azure Kinect Depth Stream",
    realtimeAnalyzing: "실시간 분석 중…",
    startToPreview: "기록을 시작하면 미리보기가 표시됩니다",
    current: "현재",
    start: "기록 시작",
    pause: "일시 정지",
    reset: "초기화",
    regular: "정기",
    motion: "움직임",
    events: { hint: "실시간", title: "감지 이벤트", empty: "기록을 시작하면 이벤트가 여기 표시됩니다", regularBadge: "정기", motionBadge: "움직임" },
    options: {
      title: "기록 옵션",
      hint: "설정",
      items: [
        { label: "정기 촬영 간격", value: "60초", hint: "이 간격마다 RGB+뎁스 프레임이 저장됩니다" },
        { label: "움직임 임계값", value: "30", hint: "픽셀 차이가 임계값을 넘으면 이벤트로 기록" },
        { label: "자동 종료", value: "기상 시", hint: "움직임이 5분 이상 지속되면 종료 처리" },
      ],
    },
  },
  en: {
    status: "Status",
    recording: "Recording",
    idle: "Idle",
    elapsed: "Elapsed",
    streamLabel: "Azure Kinect Depth Stream",
    realtimeAnalyzing: "Analyzing in real time…",
    startToPreview: "Start recording to see the preview",
    current: "Current",
    start: "Start recording",
    pause: "Pause",
    reset: "Reset",
    regular: "Regular",
    motion: "Motion",
    events: { hint: "Live", title: "Detected events", empty: "Events will appear here once recording starts", regularBadge: "Regular", motionBadge: "Motion" },
    options: {
      title: "Recording options",
      hint: "Settings",
      items: [
        { label: "Sample interval", value: "60s", hint: "An RGB + depth frame is saved at this interval" },
        { label: "Motion threshold", value: "30", hint: "Pixel diff over the threshold counts as motion" },
        { label: "Auto stop", value: "On wake", hint: "Stops if movement persists for 5+ minutes" },
      ],
    },
  },
};

export function RecordController() {
  const { lang } = useLang();
  const t = COPY[lang];
  const countUnit = lang === "ko" ? "회" : "x";

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [posture, setPosture] = useState<Posture>("Supine");
  const [regularCount, setRegularCount] = useState(0);
  const [motionCount, setMotionCount] = useState(0);
  const [events, setEvents] = useState<
    { time: string; kind: "regular" | "motion"; posture: Posture }[]
  >([]);

  useEffect(() => {
    if (!recording) return;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    const sample = setInterval(() => {
      const isMotion = Math.random() > 0.7;
      const next = POSTURES[Math.floor(Math.random() * POSTURES.length)];
      setPosture(next);
      const time = new Date().toLocaleTimeString(
        lang === "ko" ? "ko-KR" : "en-US",
        { hour: "2-digit", minute: "2-digit", second: "2-digit" }
      );
      if (isMotion) setMotionCount((c) => c + 1);
      else setRegularCount((c) => c + 1);
      setEvents((evs) => {
        const kind: "motion" | "regular" = isMotion ? "motion" : "regular";
        return [{ time, kind, posture: next }, ...evs].slice(0, 12);
      });
    }, 2200);
    return () => {
      clearInterval(tick);
      clearInterval(sample);
    };
  }, [recording, lang]);

  const reset = () => {
    setRecording(false);
    setElapsed(0);
    setRegularCount(0);
    setMotionCount(0);
    setEvents([]);
  };

  return (
    <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-muted-foreground">{t.status}</div>
            <div className="flex items-center gap-2 mt-1">
              {recording ? (
                <>
                  <span className="size-2 rounded-full bg-[#f0a4d6] shadow-[0_0_10px_rgba(240,164,214,0.9)] animate-pulse" />
                  <span className="font-semibold gradient-text">{t.recording}</span>
                </>
              ) : (
                <>
                  <Circle className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.idle}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{t.elapsed}</div>
            <div className="font-mono text-2xl tabular-nums mt-1">
              {fmt(elapsed)}
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl aspect-video grid place-items-center mb-6 overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a1645] via-[#15123a] to-[#0d0a2c]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.35), transparent 50%), radial-gradient(circle at 75% 80%, rgba(247,212,136,0.18), transparent 55%)",
            }}
          />
          <div className="relative text-center">
            <div className="size-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 grid place-items-center backdrop-blur">
              <Camera className="size-6 text-primary-3" />
            </div>
            <div className="text-sm font-medium text-foreground-soft">
              {t.streamLabel}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {recording ? t.realtimeAnalyzing : t.startToPreview}
            </div>
          </div>
          {recording && (
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur shadow-lg"
              style={{
                background: `${POSTURE_COLOR[posture]}cc`,
                boxShadow: `0 0 20px ${POSTURE_COLOR[posture]}80`,
              }}
            >
              {t.current}: {POSTURE_LABEL[lang][posture]}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!recording ? (
            <Button size="lg" onClick={() => setRecording(true)}>
              <PlayCircle className="size-5" />
              {t.start}
            </Button>
          ) : (
            <Button size="lg" variant="danger" onClick={() => setRecording(false)}>
              <PauseCircle className="size-5" />
              {t.pause}
            </Button>
          )}
          {(elapsed > 0 || events.length > 0) && (
            <Button size="lg" variant="secondary" onClick={reset}>
              {t.reset}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> {t.regular} {regularCount}{countUnit}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5" /> {t.motion} {motionCount}{countUnit}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle hint={t.events.hint}>{t.events.title}</CardTitle>
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground py-12 text-center">
            {t.events.empty}
          </div>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {events.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-2 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: POSTURE_COLOR[e.posture] }}
                  />
                  <span className="font-medium">{POSTURE_LABEL[lang][e.posture]}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge color={e.kind === "motion" ? "warn" : "muted"}>
                    {e.kind === "motion" ? t.events.motionBadge : t.events.regularBadge}
                  </Badge>
                  <span className="font-mono tabular-nums">{e.time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="lg:col-span-3">
        <CardTitle hint={t.options.hint}>{t.options.title}</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.options.items.map((row) => (
            <OptionRow key={row.label} label={row.label} value={row.value} hint={row.hint} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function OptionRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 backdrop-blur">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-semibold mt-1.5 text-foreground">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
        {hint}
      </div>
    </div>
  );
}
