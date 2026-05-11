"use client";

import Link from "next/link";
import { Camera, Moon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useLang, type Lang } from "@/lib/lang";

const COPY: Record<Lang, {
  badge: string;
  title: string;
  body: string;
  cta: string;
  hint: string;
}> = {
  ko: {
    badge: "아직 데이터 없음",
    title: "수면 기록이 아직 없어요",
    body: "Kinect 카메라로 밤사이 자세를 기록하면 이곳에 분석 결과가 정리됩니다.\n오늘 밤 카메라를 거치해두고 평소처럼 잠들기만 하면 돼요.",
    cta: "기록 시작하기",
    hint: "Python 백엔드(Kinect)가 posture_log 테이블에 데이터를 INSERT 하면 자동으로 표시됩니다.",
  },
  en: {
    badge: "No data yet",
    title: "No sleep records yet",
    body: "Once your Kinect camera captures a night, the analysis will appear here.\nMount the camera, sleep as usual, and check back in the morning.",
    cta: "Start recording",
    hint: "Data appears automatically once Python backend inserts rows into the posture_log table.",
  },
};

export function EmptyState({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang();
  const t = COPY[lang];

  return (
    <Card className={compact ? "" : "py-12"}>
      <div className="max-w-md mx-auto text-center">
        <div className="relative inline-grid place-items-center size-16 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/15 border border-primary-3/20 mb-5">
          <Moon className="size-7 text-primary-3" />
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-accent animate-pulse-soft" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary-3/25 text-[10px] uppercase tracking-[0.18em] text-primary-3 mb-4 font-semibold">
          <span className="size-1.5 rounded-full bg-primary-3" />
          {t.badge}
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-2">
          {t.title}
        </h3>
        <p className="text-sm text-foreground-soft/85 leading-relaxed whitespace-pre-line mb-6">
          {t.body}
        </p>

        <Link href="/record">
          <Button>
            <Camera className="size-4" />
            {t.cta}
          </Button>
        </Link>

        <p className="mt-5 text-[11px] text-muted-foreground/60 leading-relaxed">
          {t.hint}
        </p>
      </div>
    </Card>
  );
}
