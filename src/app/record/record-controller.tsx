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
import { POSTURE_COLOR, POSTURE_KO, type Posture } from "@/lib/types";

const POSTURES: Posture[] = ["Supine", "Lateral_L", "Lateral_R", "Prone"];

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function RecordController() {
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
    // simulate sampling — every 5s draw an event
    const sample = setInterval(() => {
      const isMotion = Math.random() > 0.7;
      const next = POSTURES[Math.floor(Math.random() * POSTURES.length)];
      setPosture(next);
      const time = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
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
  }, [recording]);

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
            <div className="text-xs text-muted-foreground">상태</div>
            <div className="flex items-center gap-2 mt-1">
              {recording ? (
                <>
                  <span className="size-2 rounded-full bg-[#E07BB5] animate-pulse" />
                  <span className="font-semibold">기록 중</span>
                </>
              ) : (
                <>
                  <Circle className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">대기</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">경과 시간</div>
            <div className="font-mono text-2xl tabular-nums mt-1">
              {fmt(elapsed)}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-muted aspect-video grid place-items-center mb-6 overflow-hidden relative">
          <div className="text-center">
            <Camera className="size-10 mx-auto text-muted-foreground/60 mb-3" />
            <div className="text-sm text-muted-foreground">
              Azure Kinect Depth Stream
            </div>
            <div className="text-[11px] text-muted-foreground/70 mt-1">
              {recording ? "실시간 분석 중…" : "기록을 시작하면 미리보기가 표시됩니다"}
            </div>
          </div>
          {recording && (
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ background: POSTURE_COLOR[posture] }}
            >
              현재: {POSTURE_KO[posture]}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!recording ? (
            <Button size="lg" onClick={() => setRecording(true)}>
              <PlayCircle className="size-5" />
              기록 시작
            </Button>
          ) : (
            <Button size="lg" variant="danger" onClick={() => setRecording(false)}>
              <PauseCircle className="size-5" />
              일시 정지
            </Button>
          )}
          {(elapsed > 0 || events.length > 0) && (
            <Button size="lg" variant="secondary" onClick={reset}>
              초기화
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> 정기 {regularCount}회
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5" /> 움직임 {motionCount}회
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle hint="실시간">감지 이벤트</CardTitle>
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground py-12 text-center">
            기록을 시작하면 이벤트가 여기 표시됩니다
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
                  <span className="font-medium">{POSTURE_KO[e.posture]}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge color={e.kind === "motion" ? "warn" : "muted"}>
                    {e.kind === "motion" ? "움직임" : "정기"}
                  </Badge>
                  <span className="font-mono tabular-nums">{e.time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="lg:col-span-3">
        <CardTitle hint="설정">기록 옵션</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <OptionRow
            label="정기 촬영 간격"
            value="60초"
            hint="이 간격마다 RGB+뎁스 프레임이 저장됩니다"
          />
          <OptionRow
            label="움직임 임계값"
            value="30"
            hint="픽셀 차이가 임계값을 넘으면 이벤트로 기록"
          />
          <OptionRow
            label="자동 종료"
            value="기상 시"
            hint="움직임이 5분 이상 지속되면 종료 처리"
          />
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
    <div className="rounded-2xl bg-muted/60 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
