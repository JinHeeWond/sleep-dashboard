"use client";

import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { useLang, type Lang } from "@/lib/lang";
import { POSTURE_LABEL } from "@/lib/i18n";
import { POSTURE_COLOR, type Posture } from "@/lib/types";
import type { PostureDistEntry } from "@/lib/data";

type Guide = { pros: string; cons: string; tips: string[] };

const POSTURE_GUIDE: Record<Lang, Record<Posture, Guide>> = {
  ko: {
    Supine: {
      pros: "척추가 자연스럽게 정렬되고 얼굴 주름이나 안면 비대칭 위험이 낮은 자세예요.",
      cons: "혀와 연구개가 뒤로 처지면서 코골이와 수면 무호흡이 심해질 수 있고, 허리에 부담이 갈 수 있습니다.",
      tips: [
        "베개 높이를 6–10cm로 맞춰 목 곡선을 받쳐주세요",
        "무릎 아래에 얇은 베개를 두면 허리 부담이 줄어듭니다",
        "코골이가 잦다면 측와위(옆으로 누운 자세)를 함께 시도해보세요",
      ],
    },
    Lateral_L: {
      pros: "소화에 도움이 되고 코골이를 줄여줍니다. 임산부에게도 권장되는 자세예요.",
      cons: "왼쪽 어깨와 팔에 압력이 누적되어 어깨 통증으로 이어질 수 있어요.",
      tips: [
        "어깨가 눌리지 않도록 어깨 너비에 맞는 두꺼운 베개를 사용해주세요",
        "양 무릎 사이에 베개를 두면 골반 회전을 막아줍니다",
        "한쪽으로만 오래 자지 않도록 반대 자세도 번갈아 시도해보세요",
      ],
    },
    Lateral_R: {
      pros: "심장에 부담이 적고 편안한 자세예요. 임산부가 아닌 일반 성인에게 무난합니다.",
      cons: "위산 역류 위험이 있고, 오른쪽 어깨에 압력이 누적될 수 있습니다.",
      tips: [
        "취침 전 식사는 2시간 이상 간격을 두세요",
        "어깨 압박을 분산하려면 바디필로우를 시도해보세요",
        "왼쪽 자세와 번갈아 자면 한쪽 부담이 줄어듭니다",
      ],
    },
    Prone: {
      pros: "코골이를 일부 줄여주고, 일부 무호흡 환자에게 완화 효과가 있을 수 있습니다.",
      cons: "목을 한쪽으로 꺾어야 하고 허리가 과신전되어 통증 위험이 큰 자세입니다. 안면 압박과 호흡 제한도 동반돼요.",
      tips: [
        "가능하면 측와위로 전환을 시도해보세요",
        "엎드린 자세를 유지해야 한다면 베개를 아주 얇게 쓰거나 빼는 게 좋아요",
        "이 자세가 30% 이상이면 목/허리 통증 위험이 누적될 수 있습니다",
      ],
    },
    Unknown: {
      pros: "",
      cons: "자세를 정확히 분류하지 못한 구간이 있어요.",
      tips: ["카메라가 침대를 정면에서 잘 비추고 있는지 확인해주세요"],
    },
  },
  en: {
    Supine: {
      pros: "Aligns the spine naturally and avoids facial pressure or asymmetry.",
      cons: "Tongue and soft palate fall back, worsening snoring and sleep apnea. Can also strain the lower back.",
      tips: [
        "Use a 6–10cm pillow that supports the curve of your neck",
        "A thin pillow under the knees reduces lower-back load",
        "If snoring is frequent, try alternating with side-sleeping",
      ],
    },
    Lateral_L: {
      pros: "Helps digestion and reduces snoring. Recommended during pregnancy.",
      cons: "Pressure builds on the left shoulder and arm, which can cause shoulder pain.",
      tips: [
        "Use a pillow thick enough to keep the shoulder unpinched",
        "A pillow between the knees prevents pelvic rotation",
        "Alternate sides so one shoulder doesn't bear all the load",
      ],
    },
    Lateral_R: {
      pros: "Easy on the heart and generally comfortable for non-pregnant adults.",
      cons: "Slightly raises reflux risk and stacks pressure on the right shoulder.",
      tips: [
        "Leave at least 2 hours between dinner and bedtime",
        "Try a body pillow to spread shoulder pressure",
        "Alternate with left-side sleeping to balance load",
      ],
    },
    Prone: {
      pros: "Reduces snoring and may help some apnea cases.",
      cons: "Forces the neck sideways and hyperextends the back — high pain risk. Also restricts breathing.",
      tips: [
        "Shift to side-sleeping when possible",
        "If you must sleep prone, use a very thin pillow or none at all",
        "Above 30% prone time tends to accumulate neck/back pain risk",
      ],
    },
    Unknown: {
      pros: "",
      cons: "Some segments couldn't be classified clearly.",
      tips: ["Check that the camera has a clear front view of the bed"],
    },
  },
};

const COPY: Record<Lang, {
  eyebrow: (days: number) => string;
  title: string;
  description: string;
  patternTitle: string;
  patternDesc: string;
  mainPosture: string;
  ofTotal: (pct: number) => string;
  breakdownTitle: string;
  guideTitle: string;
  guideHintFor: (label: string) => string;
  prosLabel: string;
  consLabel: string;
  tipsLabel: string;
}> = {
  ko: {
    eyebrow: (d) => `최근 ${d}일 데이터 기반`,
    title: "수면 코칭",
    description: "기록된 자세 데이터를 바탕으로 사용자에게 맞는 인사이트를 정리해드려요.",
    patternTitle: "자세 패턴 요약",
    patternDesc: "지난 2주 동안 어떤 자세로 가장 많이 잤는지 확인해보세요.",
    mainPosture: "가장 많이 잔 자세",
    ofTotal: (pct) => `전체 기록의 ${pct}%`,
    breakdownTitle: "자세별 비율",
    guideTitle: "이 자세, 알아두면 좋아요",
    guideHintFor: (label) => `기준: ${label}`,
    prosLabel: "장점",
    consLabel: "주의할 점",
    tipsLabel: "이번 주 개선 팁",
  },
  en: {
    eyebrow: (d) => `Based on the last ${d} days`,
    title: "Sleep coaching",
    description: "Personalized insights drawn from your recorded posture data.",
    patternTitle: "Posture pattern",
    patternDesc: "See which posture dominated your last two weeks.",
    mainPosture: "Most-held posture",
    ofTotal: (pct) => `${pct}% of all records`,
    breakdownTitle: "Breakdown",
    guideTitle: "Worth knowing about this posture",
    guideHintFor: (label) => `For: ${label}`,
    prosLabel: "Pros",
    consLabel: "Watch out",
    tipsLabel: "Try this week",
  },
};

export function CoachingView({
  distribution,
  days,
}: {
  distribution: PostureDistEntry[];
  days: number;
}) {
  const { lang } = useLang();
  const t = COPY[lang];

  if (distribution.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow={t.eyebrow(days)}
          title={t.title}
          description={t.description}
        />
        <EmptyState />
      </>
    );
  }

  const top = distribution[0];
  const guide = POSTURE_GUIDE[lang][top.posture];

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow(days)}
        title={t.title}
        description={t.description}
      />

      <Card className="mb-5">
        <CardTitle description={t.patternDesc}>{t.patternTitle}</CardTitle>

        <div className="flex flex-col items-center text-center py-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-semibold">
            {t.mainPosture}
          </div>
          <div
            className="text-3xl md:text-4xl font-semibold tracking-tight gradient-text mb-1"
          >
            {POSTURE_LABEL[lang][top.posture]}
          </div>
          <div className="text-sm text-foreground-soft/80">
            {t.ofTotal(top.pct)}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/[0.08]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3 font-semibold">
            {t.breakdownTitle}
          </div>
          <ul className="space-y-2.5">
            {distribution.map((d) => (
              <li key={d.posture}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        background: POSTURE_COLOR[d.posture],
                        boxShadow: `0 0 8px ${POSTURE_COLOR[d.posture]}80`,
                      }}
                    />
                    <span className="font-medium text-foreground-soft">
                      {POSTURE_LABEL[lang][d.posture]}
                    </span>
                  </div>
                  <span className="tabular-nums font-semibold text-foreground">
                    {d.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.pct}%`,
                      background: POSTURE_COLOR[d.posture],
                      boxShadow: `0 0 10px ${POSTURE_COLOR[d.posture]}80`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <CardTitle hint={t.guideHintFor(POSTURE_LABEL[lang][top.posture])}>
          {t.guideTitle}
        </CardTitle>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-300 mb-2 font-semibold">
              <Sparkles className="size-3.5" />
              {t.prosLabel}
            </div>
            <p className="text-sm text-foreground-soft leading-relaxed">
              {guide.pros}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-300 mb-2 font-semibold">
              <AlertTriangle className="size-3.5" />
              {t.consLabel}
            </div>
            <p className="text-sm text-foreground-soft leading-relaxed">
              {guide.cons}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary-3 mb-3 font-semibold">
            <Lightbulb className="size-3.5" />
            {t.tipsLabel}
          </div>
          <ul className="space-y-2.5">
            {guide.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-foreground-soft leading-relaxed"
              >
                <span className="size-5 shrink-0 rounded-full bg-primary/15 border border-primary/30 text-[11px] font-semibold text-primary-3 grid place-items-center tabular-nums mt-0.5">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </>
  );
}
