"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui";
import { useLang, type Lang } from "@/lib/lang";

type PostureInfo = {
  ko: { name: string; pros: string; cons: string; target: string };
  en: { name: string; pros: string; cons: string; target: string };
  technical: string;
  color: string;
};

const POSTURES: PostureInfo[] = [
  {
    technical: "Supine",
    color: "#5BBF72",
    ko: { name: "똑바로 (앙와위)", pros: "척추 정렬, 얼굴 주름 예방", cons: "코골이/무호흡 악화, 허리 통증 유발", target: "일반인, 피부 관리 중인 사람" },
    en: { name: "On your back (Supine)", pros: "Spinal alignment, fewer face wrinkles", cons: "Worse snoring/apnea, can cause lower-back pain", target: "Most people, anyone focused on skincare" },
  },
  {
    technical: "Lateral",
    color: "#F4A742",
    ko: { name: "옆으로 (측와위)", pros: "어깨 통증 완화, 코골이 감소", cons: "어깨 압박, 안면 비대칭 유발 가능", target: "노년층, 코골이가 심한 사람" },
    en: { name: "On your side (Lateral)", pros: "Eases shoulder pain, reduces snoring", cons: "Shoulder pressure, possible facial asymmetry", target: "Older adults, heavy snorers" },
  },
  {
    technical: "Fetal",
    color: "#E07BB5",
    ko: { name: "새우잠 (태아형)", pros: "허리 통증 감소, 임산부에게 추천", cons: "관절 뻣뻣함, 깊은 호흡 방해", target: "허리 디스크 환자, 스트레스가 많은 사람" },
    en: { name: "Fetal", pros: "Reduces lower-back pain; recommended in pregnancy", cons: "Stiff joints, restricts deep breathing", target: "People with disc issues or high stress" },
  },
  {
    technical: "Prone",
    color: "#5B8EBF",
    ko: { name: "엎드려 (복와위)", pros: "코골이 감소, 일부 무호흡 완화", cons: "목/허리 통증 유발, 안면 압박", target: "비권장 자세" },
    en: { name: "On your stomach (Prone)", pros: "Reduces snoring, may ease apnea slightly", cons: "Causes neck/back pain, presses the face", target: "Not recommended" },
  },
  {
    technical: "Log",
    color: "#9CC5DB",
    ko: { name: "통나무형 (Log)", pros: "척추 정렬과 호흡 안정", cons: "어깨/엉덩이 압력 집중", target: "사회적 외향형" },
    en: { name: "Log", pros: "Spinal alignment and stable breathing", cons: "Pressure on shoulders and hips", target: "Sociable, outgoing types" },
  },
  {
    technical: "Yearner",
    color: "#DCA8C9",
    ko: { name: "갈망형 (Yearner)", pros: "위산 역류 방지, 호흡 원활", cons: "팔에 혈액순환 저하", target: "결정에 신중한 사람" },
    en: { name: "Yearner", pros: "Prevents acid reflux, smooth breathing", cons: "Reduced circulation in arms", target: "Cautious decision-makers" },
  },
  {
    technical: "Soldier",
    color: "#B6CFA0",
    ko: { name: "군인형 (Soldier)", pros: "척추 건강에 좋음", cons: "코골이 가장 심함", target: "조용하고 내성적인 사람" },
    en: { name: "Soldier", pros: "Good for spinal health", cons: "Heaviest snoring of all positions", target: "Quiet, introverted types" },
  },
  {
    technical: "Starfish",
    color: "#F0C66B",
    ko: { name: "불가사리형 (Starfish)", pros: "어깨 압박 줄임", cons: "어깨 관절에 무리", target: "친구의 말을 잘 들어주는 사람" },
    en: { name: "Starfish", pros: "Reduces shoulder pressure", cons: "Can strain shoulder joints", target: "Great listeners" },
  },
  {
    technical: "Freefall",
    color: "#C8B9DC",
    ko: { name: "자유낙하 (Freefall)", pros: "소화에 도움", cons: "목/허리 부담 가장 큼", target: "충동적인 성격의 사람" },
    en: { name: "Freefall", pros: "Helps digestion", cons: "Heaviest load on neck and back", target: "Impulsive personalities" },
  },
];

const COPY: Record<Lang, {
  eyebrow: string;
  title: string;
  description: string;
  primaryTitle: string;
  secondaryTitle: string;
  th: { pose: string; pros: string; cons: string; target: string };
  rowLabels: { pros: string; cons: string; target: string };
}> = {
  ko: {
    eyebrow: "가이드",
    title: "수면 자세 종류",
    description: "자세별 특징과 장단점을 알아두면 분석 결과를 더 잘 이해할 수 있어요.",
    primaryTitle: "분석 시스템이 분류하는 4가지 기본 자세",
    secondaryTitle: "그 외 자세 유형",
    th: { pose: "자세", pros: "장점", cons: "단점", target: "추천 대상" },
    rowLabels: { pros: "장점", cons: "단점", target: "추천 대상" },
  },
  en: {
    eyebrow: "Guide",
    title: "Sleep posture types",
    description: "Knowing each posture and its trade-offs makes the analysis easier to read.",
    primaryTitle: "Four primary postures the system classifies",
    secondaryTitle: "Other posture types",
    th: { pose: "Posture", pros: "Pros", cons: "Cons", target: "Best for" },
    rowLabels: { pros: "Pros", cons: "Cons", target: "Best for" },
  },
};

export default function InfoPage() {
  const { lang } = useLang();
  const t = COPY[lang];

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      <Card className="mb-5">
        <CardTitle>{t.primaryTitle}</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POSTURES.slice(0, 4).map((p) => {
            const v = p[lang];
            return (
              <div
                key={p.technical}
                className="relative rounded-2xl p-5 border border-white/10 bg-white/[0.03] backdrop-blur overflow-hidden hover:bg-white/[0.06] transition-colors"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                  style={{
                    background: `linear-gradient(180deg, ${p.color}, ${p.color}55)`,
                    boxShadow: `0 0 14px ${p.color}80`,
                  }}
                />
                <div className="flex items-baseline justify-between mb-3 pl-2">
                  <div>
                    <div className="font-semibold text-foreground">{v.name}</div>
                    <div className="text-[11px] text-muted-foreground tracking-wider uppercase mt-0.5">
                      {p.technical}
                    </div>
                  </div>
                  <div
                    className="size-3 rounded-full shadow-[0_0_10px_currentColor]"
                    style={{ background: p.color, color: p.color }}
                  />
                </div>
                <Row label={t.rowLabels.pros} body={v.pros} tone="ok" />
                <Row label={t.rowLabels.cons} body={v.cons} tone="warn" />
                <Row label={t.rowLabels.target} body={v.target} tone="muted" />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>{t.secondaryTitle}</CardTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-3 font-medium">{t.th.pose}</th>
                <th className="px-3 py-3 font-medium">{t.th.pros}</th>
                <th className="px-3 py-3 font-medium">{t.th.cons}</th>
                <th className="px-3 py-3 font-medium">{t.th.target}</th>
              </tr>
            </thead>
            <tbody>
              {POSTURES.slice(4).map((p) => {
                const v = p[lang];
                return (
                  <tr
                    key={p.technical}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-3 py-3.5 align-top">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{p.technical}</div>
                    </td>
                    <td className="px-3 py-3.5 align-top text-muted-foreground">
                      {v.pros}
                    </td>
                    <td className="px-3 py-3.5 align-top text-muted-foreground">
                      {v.cons}
                    </td>
                    <td className="px-3 py-3.5 align-top text-muted-foreground">
                      {v.target}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Row({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone: "ok" | "warn" | "muted";
}) {
  const colors = {
    ok: "text-[#6ee7b7]",
    warn: "text-[#f0a4d6]",
    muted: "text-muted-foreground",
  } as const;
  return (
    <div className="flex gap-2 text-xs leading-relaxed mt-1.5 pl-2">
      <span className={`${colors[tone]} font-medium w-14 shrink-0`}>{label}</span>
      <span className="text-foreground-soft">{body}</span>
    </div>
  );
}
