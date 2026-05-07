import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui";

const POSTURES = [
  {
    ko: "똑바로 (앙와위)",
    en: "Supine",
    color: "#5BBF72",
    pros: "척추 정렬, 얼굴 주름 예방",
    cons: "코골이/무호흡 악화, 허리 통증 유발",
    target: "일반인, 피부 관리 중인 사람",
  },
  {
    ko: "옆으로 (측와위)",
    en: "Lateral",
    color: "#F4A742",
    pros: "어깨 통증 완화, 코골이 감소",
    cons: "어깨 압박, 안면 비대칭 유발 가능",
    target: "노년층, 코골이가 심한 사람",
  },
  {
    ko: "새우잠 (태아형)",
    en: "Fetal",
    color: "#E07BB5",
    pros: "허리 통증 감소, 임산부에게 추천",
    cons: "관절 뻣뻣함, 깊은 호흡 방해",
    target: "허리 디스크 환자, 스트레스가 많은 사람",
  },
  {
    ko: "엎드려 (복와위)",
    en: "Prone",
    color: "#5B8EBF",
    pros: "코골이 감소, 일부 무호흡 완화",
    cons: "목/허리 통증 유발, 안면 압박",
    target: "비권장 자세",
  },
  {
    ko: "통나무형 (Log)",
    en: "Log",
    color: "#9CC5DB",
    pros: "척추 정렬과 호흡 안정",
    cons: "어깨/엉덩이 압력 집중",
    target: "사회적 외향형",
  },
  {
    ko: "갈망형 (Yearner)",
    en: "Yearner",
    color: "#DCA8C9",
    pros: "위산 역류 방지, 호흡 원활",
    cons: "팔에 혈액순환 저하",
    target: "결정에 신중한 사람",
  },
  {
    ko: "군인형 (Soldier)",
    en: "Soldier",
    color: "#B6CFA0",
    pros: "척추 건강에 좋음",
    cons: "코골이 가장 심함",
    target: "조용하고 내성적인 사람",
  },
  {
    ko: "불가사리형 (Starfish)",
    en: "Starfish",
    color: "#F0C66B",
    pros: "어깨 압박 줄임",
    cons: "어깨 관절에 무리",
    target: "친구의 말을 잘 들어주는 사람",
  },
  {
    ko: "자유낙하 (Freefall)",
    en: "Freefall",
    color: "#C8B9DC",
    pros: "소화에 도움",
    cons: "목/허리 부담 가장 큼",
    target: "충동적인 성격의 사람",
  },
];

export default function InfoPage() {
  return (
    <>
      <PageHeader
        eyebrow="가이드"
        title="수면 자세 종류"
        description="자세별 특징과 장단점을 알아두면 분석 결과를 더 잘 이해할 수 있어요."
      />

      <Card className="mb-5">
        <CardTitle>분석 시스템이 분류하는 4가지 기본 자세</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POSTURES.slice(0, 4).map((p) => (
            <div
              key={p.en}
              className="rounded-2xl p-5 border border-border bg-card"
              style={{ borderLeft: `4px solid ${p.color}` }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <div className="font-semibold">{p.ko}</div>
                  <div className="text-xs text-muted-foreground">{p.en}</div>
                </div>
                <div
                  className="size-3 rounded-full"
                  style={{ background: p.color }}
                />
              </div>
              <Row label="장점" body={p.pros} tone="ok" />
              <Row label="단점" body={p.cons} tone="warn" />
              <Row label="추천 대상" body={p.target} tone="muted" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>그 외 자세 유형</CardTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-3 font-medium">자세</th>
                <th className="px-3 py-3 font-medium">장점</th>
                <th className="px-3 py-3 font-medium">단점</th>
                <th className="px-3 py-3 font-medium">추천 대상</th>
              </tr>
            </thead>
            <tbody>
              {POSTURES.slice(4).map((p) => (
                <tr
                  key={p.en}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-3 py-3.5 align-top">
                    <div className="font-medium">{p.ko}</div>
                    <div className="text-xs text-muted-foreground">{p.en}</div>
                  </td>
                  <td className="px-3 py-3.5 align-top text-muted-foreground">
                    {p.pros}
                  </td>
                  <td className="px-3 py-3.5 align-top text-muted-foreground">
                    {p.cons}
                  </td>
                  <td className="px-3 py-3.5 align-top text-muted-foreground">
                    {p.target}
                  </td>
                </tr>
              ))}
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
    ok: "text-[#2f8a48]",
    warn: "text-[#9a3a73]",
    muted: "text-muted-foreground",
  } as const;
  return (
    <div className="flex gap-2 text-xs leading-relaxed mt-1.5">
      <span className={`${colors[tone]} font-medium w-14 shrink-0`}>{label}</span>
      <span className="text-foreground/80">{body}</span>
    </div>
  );
}
