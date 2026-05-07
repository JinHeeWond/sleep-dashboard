"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, Card, CardTitle } from "@/components/ui";
import { saveCondition } from "@/lib/data";
import type { MorningCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

const REFRESHMENT_LABELS = ["매우 피곤", "피곤", "보통", "개운", "매우 개운"];
const REFRESHMENT_EMOJI = ["😩", "😕", "😐", "🙂", "😄"];
const PAIN_AREAS: Array<{ key: "pain_neck" | "pain_back" | "pain_shoulder"; label: string; icon: string }> = [
  { key: "pain_neck", label: "목", icon: "🦴" },
  { key: "pain_back", label: "허리", icon: "🪑" },
  { key: "pain_shoulder", label: "어깨", icon: "💪" },
];

export function ConditionForm({
  date,
  initial,
}: {
  date: string;
  initial: MorningCondition | null;
}) {
  const [refreshment, setRefreshment] = useState<MorningCondition["refreshment"]>(
    initial?.refreshment ?? 3
  );
  const [pain, setPain] = useState({
    pain_neck: initial?.pain_neck ?? false,
    pain_back: initial?.pain_back ?? false,
    pain_shoulder: initial?.pain_shoulder ?? false,
  });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<
    { ok: boolean; via: "supabase" | "local"; error?: string } | null
  >(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveCondition({ date, refreshment, ...pain, notes });
      setResult(r);
      if (r.ok) setTimeout(() => setResult(null), 4000);
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2 space-y-8">
        <div>
          <CardTitle hint={`${refreshment}/5`}>오늘 아침 얼마나 개운한가요?</CardTitle>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = refreshment === n;
              return (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRefreshment(n as MorningCondition["refreshment"])}
                  className={cn(
                    "rounded-2xl border py-4 px-2 text-center transition-all",
                    active
                      ? "border-foreground bg-foreground text-background scale-[1.02]"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <div className="text-2xl">{REFRESHMENT_EMOJI[n - 1]}</div>
                  <div
                    className={cn(
                      "text-[11px] mt-1.5",
                      active ? "text-background/80" : "text-muted-foreground"
                    )}
                  >
                    {REFRESHMENT_LABELS[n - 1]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <CardTitle>통증이 있는 부위가 있나요?</CardTitle>
          <div className="grid grid-cols-3 gap-3">
            {PAIN_AREAS.map((area) => {
              const active = pain[area.key];
              return (
                <button
                  type="button"
                  key={area.key}
                  onClick={() =>
                    setPain((p) => ({ ...p, [area.key]: !p[area.key] }))
                  }
                  className={cn(
                    "rounded-2xl border py-5 px-4 transition-all flex items-center gap-3",
                    active
                      ? "border-[#E07BB5] bg-[#E07BB5]/10"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <span className="text-2xl">{area.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{area.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {active ? "통증 있음" : "탭하여 선택"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <CardTitle>메모 (선택)</CardTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 새벽 3시쯤 목이 아파서 깼어요"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                저장 중…
              </>
            ) : (
              <>저장하기</>
            )}
          </Button>
          {result?.ok && (
            <span className="text-sm text-[#2f8a48] inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              {result.via === "supabase"
                ? "Supabase에 저장됨"
                : "로컬에 저장됨 (Supabase 미연결)"}
            </span>
          )}
          {result && !result.ok && (
            <span className="text-sm text-[#9a3a73]">
              저장 실패: {result.error}
            </span>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>왜 입력하나요?</CardTitle>
        <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <li>
            • 자세 데이터와 통증 부위의{" "}
            <span className="text-foreground font-medium">상관관계</span>를
            계산합니다.
          </li>
          <li>
            • 일주일 이상의 데이터가 모이면{" "}
            <span className="text-foreground font-medium">개인화된 처방</span>이
            제공됩니다.
          </li>
          <li>
            • 같은 자세 비율이라도{" "}
            <span className="text-foreground font-medium">개운함</span>이 낮은
            날을 찾아냅니다.
          </li>
        </ul>
        <div className="mt-6 rounded-2xl bg-accent p-4 text-xs text-accent-foreground/80 leading-relaxed">
          입력 데이터는 본인 계정에만 저장되며 분석 외 용도로 사용되지
          않습니다.
        </div>
      </Card>
    </form>
  );
}
