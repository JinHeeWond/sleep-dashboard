"use client";

import { useState, useTransition } from "react";
import { Check, Coffee } from "lucide-react";
import { Card, CardTitle } from "@/components/ui";
import { useLang, type Lang } from "@/lib/lang";
import { saveCondition } from "@/app/dashboard/actions";
import type { MorningCondition } from "@/lib/types";

const COPY: Record<Lang, {
  title: string;
  hint: string;
  refresh: string;
  refreshLabels: [string, string, string, string, string];
  pain: string;
  neck: string;
  shoulder: string;
  back: string;
  memoLabel: string;
  memoPh: string;
  save: string;
  saving: string;
  saved: string;
}> = {
  ko: {
    title: "오늘 아침 컨디션",
    hint: "기록은 본인 계정에만 저장돼요",
    refresh: "개운함",
    refreshLabels: ["최악", "별로", "보통", "좋음", "최고"],
    pain: "통증 부위",
    neck: "목",
    shoulder: "어깨",
    back: "허리",
    memoLabel: "메모 (선택)",
    memoPh: "꿈, 컨디션, 메모…",
    save: "기록 저장",
    saving: "저장 중…",
    saved: "저장됨",
  },
  en: {
    title: "This morning",
    hint: "Saved to your account only",
    refresh: "Refreshment",
    refreshLabels: ["Worst", "Poor", "OK", "Good", "Best"],
    pain: "Pain points",
    neck: "Neck",
    shoulder: "Shoulder",
    back: "Back",
    memoLabel: "Memo (optional)",
    memoPh: "Dreams, notes…",
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
  },
};

export function MorningConditions({
  date,
  initial,
}: {
  date: string;
  initial: MorningCondition | null;
}) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [refresh, setRefresh] = useState<number>(initial?.refreshment ?? 0);
  const [neck, setNeck] = useState(initial?.pain_neck ?? false);
  const [shoulder, setShoulder] = useState(initial?.pain_shoulder ?? false);
  const [back, setBack] = useState(initial?.pain_back ?? false);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    setJustSaved(false);
    startTransition(async () => {
      await saveCondition(formData);
      setJustSaved(true);
    });
  }

  return (
    <Card>
      <CardTitle hint={t.hint}>
        <span className="inline-flex items-center gap-2">
          <Coffee className="size-4 text-accent" />
          {t.title}
        </span>
      </CardTitle>

      <form action={onSubmit} className="space-y-5">
        <input type="hidden" name="date" value={date} />

        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">
            {t.refresh}
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= refresh;
              return (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRefresh(n)}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-br from-accent/80 to-accent text-background shadow-[0_6px_18px_-8px_rgba(247,212,136,0.6)]"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8"
                  }`}
                  aria-pressed={active}
                  aria-label={t.refreshLabels[n - 1]}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="refreshment" value={refresh} />
          {refresh > 0 && (
            <div className="text-[11px] text-foreground-soft/70 mt-1.5">
              {t.refreshLabels[refresh - 1]}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">
            {t.pain}
          </div>
          <div className="flex flex-wrap gap-2">
            <PainChip
              label={t.neck}
              name="pain_neck"
              checked={neck}
              onChange={setNeck}
            />
            <PainChip
              label={t.shoulder}
              name="pain_shoulder"
              checked={shoulder}
              onChange={setShoulder}
            />
            <PainChip
              label={t.back}
              name="pain_back"
              checked={back}
              onChange={setBack}
            />
          </div>
        </div>

        <div>
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
              {t.memoLabel}
            </span>
            <textarea
              name="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t.memoPh}
              rows={2}
              maxLength={500}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-sm text-foreground placeholder:text-muted-foreground/60 backdrop-blur focus:outline-none focus:border-primary-3/50 focus:bg-white/8 transition-colors resize-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full text-sm font-medium tracking-tight bg-gradient-to-r from-primary to-primary-2 text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {justSaved && !pending ? (
            <>
              <Check className="size-4" />
              {t.saved}
            </>
          ) : pending ? (
            t.saving
          ) : (
            t.save
          )}
        </button>
      </form>
    </Card>
  );
}

function PainChip({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all ${
        checked
          ? "bg-gradient-to-r from-[#ec4899]/30 to-[#f0a4d6]/20 border-[#ec4899]/50 text-foreground"
          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/8"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`size-3.5 rounded-full border transition-colors ${
          checked ? "bg-[#ec4899] border-[#ec4899]" : "border-white/30"
        }`}
      />
      {label}
    </label>
  );
}
