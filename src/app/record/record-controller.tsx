"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { POSTURE_COLOR, type CaptureType, type Posture, type PostureLog } from "@/lib/types";
import { POSTURE_LABEL } from "@/lib/i18n";
import { useLang, type Lang } from "@/lib/lang";
import { createClient } from "@/lib/supabase/client";

const POLL_MS   = 3000;
const STREAM_URL = "http://localhost:8765/stream";

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

const COPY: Record<Lang, {
  status: string; recording: string; idle: string; elapsed: string;
  streamLabel: string; analyzing: string; waiting: string; startHint: string;
  current: string; start: string; pause: string; reset: string;
  regular: string; motion: string;
  events: { hint: string; title: string; empty: string; waiting: string; reg: string; mot: string };
  options: { title: string; hint: string; items: { label: string; value: string; hint: string }[] };
}> = {
  ko: {
    status: "상태", recording: "기록 중", idle: "대기", elapsed: "경과 시간",
    streamLabel: "Azure Kinect Depth Stream",
    analyzing: "실시간 분석 중…",
    waiting: "Kinect 데이터 수신 대기 중… (Windows PC에서 Python 스크립트를 실행하면 표시됩니다)",
    startHint: "기록을 시작하면 Kinect 스트림이 표시됩니다",
    current: "현재",
    start: "기록 시작", pause: "일시 정지", reset: "초기화",
    regular: "정기", motion: "움직임",
    events: {
      hint: "실시간", title: "감지 이벤트",
      empty: "기록을 시작하면 이벤트가 여기 표시됩니다",
      waiting: "Supabase에 새 행이 없습니다. Kinect PC에서 Python 업로더를 확인하세요.",
      reg: "정기", mot: "움직임",
    },
    options: {
      title: "기록 옵션", hint: "설정",
      items: [
        { label: "정기 촬영 간격", value: "60초", hint: "이 간격마다 RGB+뎁스 프레임이 저장됩니다" },
        { label: "움직임 임계값", value: "30", hint: "픽셀 차이가 임계값을 넘으면 이벤트로 기록" },
        { label: "자동 종료", value: "기상 시", hint: "움직임이 5분 이상 지속되면 종료 처리" },
      ],
    },
  },
  en: {
    status: "Status", recording: "Recording", idle: "Idle", elapsed: "Elapsed",
    streamLabel: "Azure Kinect Depth Stream",
    analyzing: "Analyzing in real time…",
    waiting: "Waiting for Kinect data… (run the Python script on the Windows PC)",
    startHint: "Start recording to see the Kinect stream",
    current: "Current",
    start: "Start recording", pause: "Pause", reset: "Reset",
    regular: "Regular", motion: "Motion",
    events: {
      hint: "Live", title: "Detected events",
      empty: "Events will appear here once recording starts",
      waiting: "No new rows in Supabase yet. Check the Python uploader on the Kinect PC.",
      reg: "Regular", mot: "Motion",
    },
    options: {
      title: "Recording options", hint: "Settings",
      items: [
        { label: "Sample interval", value: "60s", hint: "An RGB + depth frame is saved at this interval" },
        { label: "Motion threshold", value: "30", hint: "Pixel diff over the threshold counts as motion" },
        { label: "Auto stop", value: "On wake", hint: "Stops if movement persists for 5+ minutes" },
      ],
    },
  },
};

export function RecordController({ userId }: { userId: string }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const unit = lang === "ko" ? "회" : "x";

  const [recording, setRecording]  = useState(false);
  const [streamOk, setStreamOk]    = useState(false);
  const [streamKey, setStreamKey]  = useState(0);
  const [startTs, setStartTs]      = useState<number | null>(null);
  const [elapsed, setElapsed]      = useState(0);
  const [posture, setPosture]      = useState<Posture | null>(null);
  const [regularCount, setRegular] = useState(0);
  const [motionCount, setMotion]   = useState(0);
  const [events, setEvents]        = useState<{ time: string; kind: CaptureType; posture: Posture }[]>([]);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    if (!recording || startTs === null) return;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);

    const sb = createClient();
    let canceled = false;

    async function poll() {
      const { data, error } = await sb
        .from("posture_log")
        .select("timestamp,posture,capture_type")
        .eq("user_id", userId)
        .gt("timestamp", lastSeenRef.current)
        .order("timestamp", { ascending: true })
        .limit(200);

      if (canceled || error || !data || data.length === 0) return;

      for (const row of data as Pick<PostureLog, "timestamp" | "posture" | "capture_type">[]) {
        if (row.timestamp > lastSeenRef.current) lastSeenRef.current = row.timestamp;
        setPosture(row.posture);
        if (row.capture_type === "motion") setMotion((c) => c + 1);
        else setRegular((c) => c + 1);
        const time = new Date(row.timestamp * 1000).toLocaleTimeString(
          lang === "ko" ? "ko-KR" : "en-US",
          { hour: "2-digit", minute: "2-digit", second: "2-digit" }
        );
        setEvents((evs) =>
          [{ time, kind: row.capture_type, posture: row.posture }, ...evs].slice(0, 12)
        );
      }
    }

    poll();
    const sample = setInterval(poll, POLL_MS);
    return () => { canceled = true; clearInterval(tick); clearInterval(sample); };
  }, [recording, startTs, userId, lang]);

  async function setSession(status: "recording" | "paused" | "idle") {
    console.log("[setSession] 호출됨 →", status, "userId:", userId);
    const sb = createClient();
    const res = await sb.from("recording_sessions").upsert(
      {
        user_id:    userId,
        status,
        started_at: status === "recording" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    console.log("[setSession] 결과 →", res);
  }

  const start = () => {
    lastSeenRef.current = Math.floor(Date.now() / 1000) - 1;
    setStartTs(Math.floor(Date.now() / 1000));
    setRecording(true);
    setStreamOk(false);           // 리셋 → img 재연결 트리거
    setStreamKey((k) => k + 1);  // key 변경 → img 강제 리마운트
    setSession("recording");
  };

  const reset = () => {
    setRecording(false); setStartTs(null);
    setElapsed(0); setRegular(0); setMotion(0);
    setEvents([]); setPosture(null);
    lastSeenRef.current = 0;
    setSession("idle");
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
            <div className="font-mono text-2xl tabular-nums mt-1">{fmt(elapsed)}</div>
          </div>
        </div>

        <div className="relative rounded-3xl aspect-video mb-6 overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a1645] via-[#15123a] to-[#0d0a2c]">
          {/* Kinect 라이브 스트림 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={streamKey}
            src={STREAM_URL}
            alt="Kinect stream"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: streamOk ? "block" : "none" }}
            onLoad={() => setStreamOk(true)}
            onError={() => setStreamOk(false)}
          />

          {/* 스트림 없을 때 플레이스홀더 */}
          {!streamOk && (
            <>
              <div
                aria-hidden
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.35), transparent 50%), radial-gradient(circle at 75% 80%, rgba(247,212,136,0.18), transparent 55%)",
                }}
              />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="size-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 grid place-items-center backdrop-blur">
                    <Camera className="size-6 text-primary-3" />
                  </div>
                  <div className="text-sm font-medium text-foreground-soft">{t.streamLabel}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {recording ? t.waiting : t.startHint}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 자세 배지 (스트림 위 오버레이) */}
          {recording && posture && (
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur shadow-lg"
              style={{ background: `${POSTURE_COLOR[posture]}cc`, boxShadow: `0 0 20px ${POSTURE_COLOR[posture]}80` }}
            >
              {t.current}: {POSTURE_LABEL[lang][posture]}
            </div>
          )}

          {/* 스트림 연결 표시 */}
          {streamOk && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] text-green-400 font-medium">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!recording ? (
            <Button size="lg" onClick={start}>
              <PlayCircle className="size-5" /> {t.start}
            </Button>
          ) : (
            <Button size="lg" variant="danger" onClick={() => { setRecording(false); setSession("paused"); }}>
              <PauseCircle className="size-5" /> {t.pause}
            </Button>
          )}
          {(elapsed > 0 || events.length > 0) && (
            <Button size="lg" variant="secondary" onClick={reset}>{t.reset}</Button>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> {t.regular} {regularCount}{unit}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5" /> {t.motion} {motionCount}{unit}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle hint={t.events.hint}>{t.events.title}</CardTitle>
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground py-12 text-center">
            {recording ? t.events.waiting : t.events.empty}
          </div>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {events.map((e, i) => (
              <li key={i} className="flex items-center justify-between px-2 py-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full" style={{ background: POSTURE_COLOR[e.posture] }} />
                  <span className="font-medium">{POSTURE_LABEL[lang][e.posture]}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge color={e.kind === "motion" ? "warn" : "muted"}>
                    {e.kind === "motion" ? t.events.mot : t.events.reg}
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
            <div key={row.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.label}</div>
              <div className="text-xl font-semibold mt-1.5 text-foreground">{row.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{row.hint}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
