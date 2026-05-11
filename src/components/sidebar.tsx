"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Home,
  Moon,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/lang";
import { LanguageToggle } from "@/components/language-toggle";
import { UserCard } from "@/components/user-card";

const NAV = [
  {
    href: "/dashboard",
    icon: Home,
    label: { ko: "대시보드", en: "Dashboard" },
  },
  {
    href: "/record",
    icon: PlayCircle,
    label: { ko: "수면 기록", en: "Record" },
  },
  {
    href: "/analysis",
    icon: BarChart3,
    label: { ko: "분석 리포트", en: "Analytics" },
  },
  {
    href: "/history",
    icon: Activity,
    label: { ko: "수면 이력", en: "History" },
  },
  {
    href: "/info",
    icon: BookOpen,
    label: { ko: "자세 가이드", en: "Posture Guide" },
  },
] as const;

const SIDEBAR_COPY: Record<Lang, { sub: string; team: string; tagline: string; tech: string }> = {
  ko: {
    sub: "AI Posture Analysis",
    team: "Team 5 · HCI",
    tagline: "밤새 수면 자세를 자동으로 분석하고 시각화합니다.",
    tech: "Azure Kinect DK + AI",
  },
  en: {
    sub: "AI Posture Analysis",
    team: "Team 5 · HCI",
    tagline: "Automatically analyze and visualize sleep posture through the night.",
    tech: "Azure Kinect DK + AI",
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { lang } = useLang();
  const copy = SIDEBAR_COPY[lang];
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-gradient-to-b from-[#15123a]/80 to-[#0b0a1f]/80 backdrop-blur-xl">
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] grid place-items-center shadow-[0_10px_30px_-10px_rgba(139,92,246,0.8)] group-hover:scale-105 transition-transform">
              <Moon className="size-5 text-white" />
            </div>
            <Sparkles className="size-3 text-accent absolute -top-0.5 -right-0.5 animate-pulse-soft" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight tracking-tight gradient-text">
              SleepLab
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight tracking-wider uppercase mt-0.5">
              {copy.sub}
            </div>
          </div>
        </Link>
      </div>
      <div className="px-4 mb-3">
        <LanguageToggle className="w-full justify-center" />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-primary/25 to-primary-2/15 text-foreground border border-primary/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-primary-3 to-primary" />
              )}
              <Icon className={cn("size-4", active && "text-primary-3")} />
              <span className="font-medium">{label[lang]}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-6 space-y-3">
        <UserCard />
        <div className="relative overflow-hidden rounded-3xl p-5 border border-white/10 bg-gradient-to-br from-[#2a1d6e] via-[#1a1645] to-[#0d0a2c]">
          <div
            aria-hidden
            className="absolute -top-6 -right-6 size-24 rounded-full bg-accent/20 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-8 -left-8 size-28 rounded-full bg-primary/30 blur-2xl"
          />
          <div className="relative">
            <div className="text-[10px] font-semibold text-accent/90 uppercase tracking-[0.18em]">
              {copy.team}
            </div>
            <div className="text-sm mt-1.5 font-semibold text-foreground">
              {copy.tech}
            </div>
            <div className="text-[11px] mt-2 text-muted-foreground leading-relaxed">
              {copy.tagline}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-3xl border border-white/10 bg-[#15123a]/85 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                active ? "text-primary-3" : "text-muted-foreground"
              )}
            >
              <Icon className="size-[18px]" />
              <span className="font-medium">{label[lang]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
