"use client";

import { useLang } from "@/lib/lang";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="language"
      className={`inline-flex items-center rounded-full border border-border-strong bg-card/50 backdrop-blur-md p-0.5 text-[11px] font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("ko")}
        aria-pressed={lang === "ko"}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          lang === "ko"
            ? "bg-primary/30 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        한
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          lang === "en"
            ? "bg-primary/30 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
