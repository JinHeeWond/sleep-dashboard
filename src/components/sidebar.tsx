"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarHeart,
  Home,
  Moon,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "대시보드", icon: Home },
  { href: "/record", label: "수면 기록", icon: PlayCircle },
  { href: "/analysis", label: "분석 리포트", icon: BarChart3 },
  { href: "/condition", label: "기상 컨디션", icon: CalendarHeart },
  { href: "/history", label: "수면 이력", icon: Activity },
  { href: "/info", label: "자세 가이드", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-foreground text-background grid place-items-center">
            <Moon className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">SleepLab</div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              AI 수면 자세 분석
            </div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-6">
        <div className="rounded-2xl bg-accent p-4">
          <div className="text-xs font-semibold text-accent-foreground/70 uppercase tracking-wider">
            Team 5 · HCI
          </div>
          <div className="text-sm mt-1 font-medium text-accent-foreground">
            Azure Kinect DK + AI
          </div>
          <div className="text-xs mt-2 text-accent-foreground/70 leading-relaxed">
            수면 자세를 분석하고 컨디션과의 상관관계를 시각화합니다.
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="grid grid-cols-6">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
