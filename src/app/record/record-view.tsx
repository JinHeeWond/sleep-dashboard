"use client";

import { PageHeader } from "@/components/page-header";
import { RecordController } from "./record-controller";
import { useLang, type Lang } from "@/lib/lang";

const COPY: Record<Lang, { eyebrow: string; title: string; description: string }> = {
  ko: {
    eyebrow: "Live",
    title: "수면 기록",
    description: "잠자리에 들기 전 기록을 시작하세요. Azure Kinect가 자세를 자동으로 추적합니다.",
  },
  en: {
    eyebrow: "Live",
    title: "Sleep recording",
    description: "Start the recorder before bed. Azure Kinect tracks your posture automatically.",
  },
};

export function RecordView({ userId }: { userId: string }) {
  const { lang } = useLang();
  const t = COPY[lang];
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <RecordController userId={userId} />
    </>
  );
}
