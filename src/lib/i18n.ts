import type { Lang } from "./lang";
import type { Posture } from "./types";

export const POSTURE_LABEL: Record<Lang, Record<Posture, string>> = {
  ko: {
    Supine: "똑바로 (앙와위)",
    Prone: "엎드려 (복와위)",
    Lateral_L: "왼쪽 (좌측와위)",
    Lateral_R: "오른쪽 (우측와위)",
    Unknown: "미분류",
  },
  en: {
    Supine: "On the back (Supine)",
    Prone: "Face down (Prone)",
    Lateral_L: "Left side (Lateral)",
    Lateral_R: "Right side (Lateral)",
    Unknown: "Unknown",
  },
};

export const POSTURE_DESC_I18N: Record<Lang, Record<Posture, string>> = {
  ko: {
    Supine: "천장을 보고 똑바로 누운 자세. 척추 정렬에 좋지만 코골이가 심해질 수 있습니다.",
    Prone: "엎드려 누운 자세. 목과 허리에 부담을 줄 수 있어 권장되지 않습니다.",
    Lateral_L: "왼쪽으로 누운 자세. 소화에 도움이 되며 코골이를 줄여줍니다.",
    Lateral_R: "오른쪽으로 누운 자세. 심장 부담이 적고 편안한 자세입니다.",
    Unknown: "자세 판정이 불가능합니다.",
  },
  en: {
    Supine: "Lying flat on your back. Good for spinal alignment, but can worsen snoring.",
    Prone: "Lying face down. Often hard on the neck and lower back; generally not recommended.",
    Lateral_L: "Lying on your left side. Helps digestion and tends to reduce snoring.",
    Lateral_R: "Lying on your right side. Less load on the heart and comfortable for most.",
    Unknown: "Posture could not be classified.",
  },
};

export function fmtDuration(minutes: number, lang: Lang): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return lang === "ko" ? `${h}시간 ${m}분` : `${h}h ${m}m`;
}

export function fmtDate(date: Date | string | number, lang: Lang): string {
  const d =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function fmtTime(date: Date | string | number, lang: Lang): string {
  const d =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return d.toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const COUNT_UNIT: Record<Lang, string> = { ko: "회", en: "" };
export const HOUR_UNIT: Record<Lang, string> = { ko: "시간", en: "h" };
