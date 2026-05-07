import Link from "next/link";
import { ArrowRight, Film, Lightbulb, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostureLegend, PosturePie } from "@/components/posture-pie";
import { PostureTimeline } from "@/components/posture-timeline";
import { ScoreRing } from "@/components/score-ring";
import { Badge, Button, Card, CardTitle, Stat } from "@/components/ui";
import {
  fetchCondition,
  fetchPostureLogs,
  fetchSession,
  todayStr,
} from "@/lib/data";
import { summarizeLogs } from "@/lib/mock-data";
import { POSTURE_KO } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface SearchParams {
  searchParams?: Promise<{ date?: string }>;
}

export default async function AnalysisPage({ searchParams }: SearchParams) {
  const params = (await searchParams) ?? {};
  const date = params.date ?? todayStr();

  const [logs, session, condition] = await Promise.all([
    fetchPostureLogs(date),
    fetchSession(date),
    fetchCondition(date),
  ]);
  const summary = summarizeLogs(logs);
  const top = summary.distribution.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <>
      <PageHeader
        eyebrow={formatDate(date)}
        title="수면 분석 리포트"
        description="자세 분포와 통증 데이터를 결합해 개인 맞춤형 인사이트를 만들어드려요."
        actions={
          <Link href="/history">
            <Button variant="secondary" size="sm">
              다른 날짜 보기 <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-5 mb-5">
        <Card className="lg:col-span-2">
          <CardTitle>전체 점수</CardTitle>
          <div className="flex items-center justify-around">
            <ScoreRing score={session.score} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="수면" value={`${Math.floor(session.duration_min / 60)}h${session.duration_min % 60}m`} />
            <Stat label="정기" value={session.regular_count} unit="회" />
            <Stat label="움직임" value={session.motion_count} unit="회" />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle hint={`${summary.total}개 기록`}>자세 분포</CardTitle>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <PosturePie data={summary.distribution} />
            <PostureLegend data={summary.distribution} />
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint="시간대별">자세 변화 타임라인</CardTitle>
        <PostureTimeline logs={logs} />
      </Card>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <Card>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Film className="size-3.5" />
            타임랩스
          </div>
          <div className="aspect-video rounded-2xl bg-muted grid place-items-center text-center">
            <div>
              <Film className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <div className="text-sm text-muted-foreground">30초 요약 영상</div>
              <div className="text-[11px] text-muted-foreground/70">
                Python 사이드에서 mp4 업로드 시 표시
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full">
            영상 다운로드
          </Button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Target className="size-3.5" />
            오늘의 컨디션
          </div>
          {condition ? (
            <div className="space-y-3">
              <div className="text-sm">
                개운함{" "}
                <span className="font-semibold tabular-nums">
                  {condition.refreshment}/5
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {condition.pain_neck && <Badge color="warn">목 통증</Badge>}
                {condition.pain_back && <Badge color="warn">허리 통증</Badge>}
                {condition.pain_shoulder && (
                  <Badge color="warn">어깨 통증</Badge>
                )}
                {!condition.pain_neck &&
                  !condition.pain_back &&
                  !condition.pain_shoulder && (
                    <Badge color="ok">통증 없음</Badge>
                  )}
              </div>
              <Link
                href="/condition"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                컨디션 수정 <ArrowRight className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              컨디션 미입력
            </div>
          )}
        </Card>

        <Card className="bg-foreground text-background border-foreground">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-background/60 mb-3">
            <Lightbulb className="size-3.5" />
            처방
          </div>
          <p className="text-sm leading-relaxed">
            {top.posture === "Prone"
              ? "엎드린 자세 비율이 높습니다. 목에 부담이 큰 자세이니 베개를 얇게 사용하거나 옆으로 자도록 시도해보세요."
              : top.posture === "Lateral_R"
              ? "오른쪽으로 누운 자세가 가장 많아요. 어깨 통증이 있다면 바디필로우로 어깨 압력을 분산시키는 걸 권장합니다."
              : top.posture === "Lateral_L"
              ? "왼쪽으로 누운 자세는 소화에 좋습니다. 어깨가 눌리지 않도록 양 무릎 사이에 베개를 두세요."
              : "앙와위가 가장 많아요. 코골이가 잦다면 베개 높이를 조금 높여 호흡을 편하게 해보세요."}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>인사이트 카드</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSIGHTS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-muted/60 p-5 hover:bg-muted transition-colors"
            >
              <div className="text-xl mb-2">{card.emoji}</div>
              <div className="text-sm font-semibold mb-1">{card.title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

const INSIGHTS = [
  {
    emoji: "🛏️",
    title: "베개 높이",
    body: "측와위 비율이 60% 이상이라면 어깨 너비에 맞는 6-10cm 높이의 베개가 척추 정렬에 도움이 됩니다.",
  },
  {
    emoji: "🌬️",
    title: "호흡 안정",
    body: "코골이 위험을 낮추려면 머리를 약간 높이고 옆으로 누우세요. 측와위는 기도 폐쇄를 줄여줍니다.",
  },
  {
    emoji: "💪",
    title: "어깨 통증",
    body: "한쪽으로 오래 누우면 해당 어깨에 압력이 쌓입니다. 무릎 사이 쿠션으로 골반 회전을 막아주세요.",
  },
];
