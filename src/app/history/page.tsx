import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle, Stat } from "@/components/ui";
import { fetchHistory } from "@/lib/data";
import { HistoryChart } from "./history-chart";

export default async function HistoryPage() {
  const history = await fetchHistory(14);
  const avg = Math.round(
    history.reduce((s, h) => s + h.score, 0) / Math.max(1, history.length)
  );
  const best = history.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = history.reduce((a, b) => (b.score < a.score ? b : a));
  const avgDuration = Math.round(
    history.reduce((s, h) => s + h.duration_min, 0) / Math.max(1, history.length)
  );

  return (
    <>
      <PageHeader
        eyebrow="최근 14일"
        title="수면 이력"
        description="날짜별 점수와 수면 시간을 한눈에 확인하세요. 카드를 눌러 상세 분석으로 이동합니다."
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-5">
        <Card>
          <Stat label="평균 점수" value={avg} unit="점" />
        </Card>
        <Card>
          <Stat
            label="평균 수면 시간"
            value={`${Math.floor(avgDuration / 60)}h${avgDuration % 60}m`}
          />
        </Card>
        <Card>
          <Stat label="최고 점수" value={best.score} unit="점" hint={best.date} />
        </Card>
        <Card>
          <Stat
            label="최저 점수"
            value={worst.score}
            unit="점"
            hint={worst.date}
          />
        </Card>
      </div>

      <Card className="mb-5">
        <CardTitle hint="14일 추이">점수 변화</CardTitle>
        <HistoryChart data={history} />
      </Card>

      <Card>
        <CardTitle>날짜별 기록</CardTitle>
        <ul className="divide-y divide-border -mx-2">
          {history
            .slice()
            .reverse()
            .map((h) => (
              <li key={h.date}>
                <Link
                  href={`/analysis?date=${h.date}`}
                  className="flex items-center justify-between px-2 py-3 hover:bg-muted/60 rounded-xl transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">{h.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.floor(h.duration_min / 60)}시간 {h.duration_min % 60}분 ·
                      움직임 {h.motion_count}회
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${h.score}%` }}
                      />
                    </div>
                    <div className="font-semibold tabular-nums w-10 text-right">
                      {h.score}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
        </ul>
      </Card>
    </>
  );
}
