import Link from "next/link";
import {
  ArrowUpRight,
  Brain,
  Camera,
  Moon,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostureLegend, PosturePie } from "@/components/posture-pie";
import { PostureTimeline } from "@/components/posture-timeline";
import { ScoreRing } from "@/components/score-ring";
import { Badge, Button, Card, CardTitle, Stat } from "@/components/ui";
import {
  fetchCondition,
  fetchHistory,
  fetchPostureLogs,
  fetchSession,
  todayStr,
} from "@/lib/data";
import { summarizeLogs } from "@/lib/mock-data";
import { formatDate, formatDuration } from "@/lib/utils";

export default async function HomePage() {
  const today = todayStr();
  const [logs, session, history, condition] = await Promise.all([
    fetchPostureLogs(today),
    fetchSession(today),
    fetchHistory(7),
    fetchCondition(today),
  ]);
  const summary = summarizeLogs(logs);
  const avgScore = Math.round(
    history.reduce((s, h) => s + h.score, 0) / Math.max(1, history.length)
  );

  return (
    <>
      <PageHeader
        eyebrow={formatDate(new Date())}
        title="좋은 아침이에요, 희원님 🌤️"
        description="어젯밤 수면 자세 분석 결과예요. 컨디션을 입력하면 더 정확한 인사이트를 받을 수 있어요."
        actions={
          <Link href="/record">
            <Button>
              <Camera className="size-4" />
              오늘 밤 기록 시작
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <Card className="lg:col-span-2">
          <CardTitle hint="지난밤">오늘의 수면 점수</CardTitle>
          <div className="flex items-center gap-8 flex-wrap">
            <ScoreRing score={session.score} />
            <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-y-5 gap-x-8">
              <Stat
                label="총 수면 시간"
                value={formatDuration(session.duration_min).split(" ")[0].replace("시간", "")}
                unit="시간"
                hint={`${session.duration_min % 60}분`}
              />
              <Stat
                label="자세 변화"
                value={session.motion_count}
                unit="회"
                hint="움직임 이벤트"
              />
              <Stat
                label="가장 많은 자세"
                value={
                  summary.distribution.reduce((a, b) =>
                    b.count > a.count ? b : a
                  ).pct
                }
                unit="%"
                hint={`주된 자세: ${
                  ({
                    Supine: "앙와위",
                    Prone: "복와위",
                    Lateral_L: "좌측와위",
                    Lateral_R: "우측와위",
                    Unknown: "미분류",
                  } as const)[
                    summary.distribution.reduce((a, b) =>
                      b.count > a.count ? b : a
                    ).posture
                  ]
                }`}
              />
              <Stat
                label="7일 평균 점수"
                value={avgScore}
                unit="점"
                hint={
                  session.score > avgScore
                    ? `+${session.score - avgScore} 향상`
                    : `${session.score - avgScore} 감소`
                }
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>자세 분포</CardTitle>
          <PosturePie data={summary.distribution} />
          <div className="mt-2">
            <PostureLegend data={summary.distribution} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <Card className="lg:col-span-2">
          <CardTitle hint="00:00 — 07:00">밤 동안의 자세 변화</CardTitle>
          <PostureTimeline logs={logs} />
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-foreground" />
              움직임 감지 이벤트
            </span>
          </div>
        </Card>

        <Card>
          <CardTitle hint={condition ? "기록됨" : "미입력"}>
            기상 컨디션
          </CardTitle>
          {condition ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  개운함
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`flex-1 h-2 rounded-full ${
                        n <= condition.refreshment
                          ? "bg-foreground"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {condition.refreshment}/5
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  통증 부위
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {condition.pain_neck && <Badge color="warn">목</Badge>}
                  {condition.pain_back && <Badge color="warn">허리</Badge>}
                  {condition.pain_shoulder && (
                    <Badge color="warn">어깨</Badge>
                  )}
                  {!condition.pain_neck &&
                    !condition.pain_back &&
                    !condition.pain_shoulder && (
                      <Badge color="ok">통증 없음</Badge>
                    )}
                </div>
              </div>
              <Link
                href="/condition"
                className="text-xs text-foreground/80 hover:text-foreground inline-flex items-center gap-1"
              >
                수정하기 <ArrowUpRight className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                오늘 아침 컨디션을 알려주세요. 자세 데이터와 결합해 패턴을 찾아드려요.
              </p>
              <Link href="/condition">
                <Button variant="secondary" size="sm">
                  컨디션 입력
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <Card className="bg-foreground text-background border-foreground">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-background/60 mb-3">
            <Brain className="size-3.5" /> AI 인사이트
          </div>
          <p className="text-sm leading-relaxed">
            오른쪽으로 누운 자세 비율이 평균보다{" "}
            <span className="font-semibold">12% 높아요.</span> 어깨 통증과 양의
            상관관계가 보입니다. 베개 높이 조절을 시도해보세요.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <TrendingUp className="size-3.5" /> 주간 추세
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {history.map((h) => (
              <div
                key={h.date}
                className="flex-1 rounded-md bg-foreground/80"
                style={{ height: `${h.score}%` }}
                title={`${h.date}: ${h.score}점`}
              />
            ))}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            최근 {history.length}일 점수 추이
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Moon className="size-3.5" /> 다음 단계
          </div>
          <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
            취침 30분 전 알람을 설정하고 분석을 자동으로 시작하세요.
          </p>
          <Link href="/record">
            <Button variant="secondary" size="sm">
              기록 설정
            </Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
