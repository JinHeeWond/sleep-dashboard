"use client";

import { useMemo } from "react";
import { POSTURE_COLOR, type Posture, type PostureLog } from "@/lib/types";
import { POSTURE_LABEL } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

// Compress per-minute logs into contiguous posture segments
export function PostureTimeline({ logs }: { logs: PostureLog[] }) {
  const { lang } = useLang();
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const segments = useMemo(() => {
    const regular = logs.filter((l) => l.capture_type === "regular");
    if (regular.length === 0) return [];
    const out: { posture: Posture; start: number; end: number }[] = [];
    let cur = { posture: regular[0].posture, start: regular[0].timestamp, end: regular[0].timestamp };
    for (let i = 1; i < regular.length; i += 1) {
      const r = regular[i];
      if (r.posture === cur.posture) {
        cur.end = r.timestamp;
      } else {
        out.push(cur);
        cur = { posture: r.posture, start: r.timestamp, end: r.timestamp };
      }
    }
    out.push(cur);
    return out;
  }, [logs]);

  const motionEvents = useMemo(
    () => logs.filter((l) => l.capture_type === "motion"),
    [logs]
  );

  if (segments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-12 text-center">
        {lang === "ko" ? "기록된 자세 데이터가 없습니다" : "No posture data recorded yet"}
      </div>
    );
  }

  const start = segments[0].start;
  const end = segments[segments.length - 1].end;
  const total = Math.max(1, end - start);
  const startLabel = new Date(start * 1000);
  const endLabel = new Date(end * 1000);

  return (
    <div className="space-y-3">
      <div className="relative h-12 rounded-full overflow-hidden bg-white/[0.05] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {segments.map((s, i) => {
          const left = ((s.start - start) / total) * 100;
          const width = Math.max(0.5, ((s.end - s.start) / total) * 100);
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: `linear-gradient(180deg, ${POSTURE_COLOR[s.posture]} 0%, ${POSTURE_COLOR[s.posture]}cc 100%)`,
                boxShadow: `0 0 12px ${POSTURE_COLOR[s.posture]}55`,
              }}
              title={`${POSTURE_LABEL[lang][s.posture]} · ${new Date(
                s.start * 1000
              ).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
            />
          );
        })}
        {motionEvents.map((m, i) => {
          const left = ((m.timestamp - start) / total) * 100;
          if (left < 0 || left > 100) return null;
          return (
            <div
              key={`m-${i}`}
              className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-accent ring-2 ring-background shadow-[0_0_8px_rgba(247,212,136,0.8)]"
              style={{ left: `calc(${left}% - 3px)` }}
              title={`${lang === "ko" ? "움직임 감지" : "Motion"} · ${new Date(
                m.timestamp * 1000
              ).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-muted-foreground tabular-nums">
        <span>
          {startLabel.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>
          {lang === "ko"
            ? `${Math.round(total / 60)}분 · 움직임 ${motionEvents.length}회`
            : `${Math.round(total / 60)} min · ${motionEvents.length} motions`}
        </span>
        <span>
          {endLabel.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
