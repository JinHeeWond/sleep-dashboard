import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  variant = "glass",
}: {
  className?: string;
  children: ReactNode;
  variant?: "glass" | "solid" | "feature";
}) {
  const variants: Record<string, string> = {
    glass: "glass-card",
    solid: "bg-card-solid border border-border-strong",
    feature:
      "border border-white/10 bg-gradient-to-br from-[#2a1d6e] via-[#1a1645] to-[#0d0a2c] glow-primary",
  };
  return (
    <div className={cn("relative rounded-3xl p-6", variants[variant], className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  hint,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 mb-5", className)}>
      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
        {children}
      </h3>
      {hint && (
        <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[28px] font-semibold tracking-tight tabular-nums gradient-text">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground/90">{hint}</div>
      )}
    </div>
  );
}

export function Badge({
  children,
  color = "muted",
}: {
  children: ReactNode;
  color?: "muted" | "supine" | "lateral_l" | "lateral_r" | "prone" | "ok" | "warn" | "primary";
}) {
  const colors: Record<string, string> = {
    muted: "bg-white/8 text-foreground-soft border border-white/10",
    primary: "bg-primary/20 text-primary-3 border border-primary/30",
    supine: "bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/25",
    lateral_l: "bg-[#fbbf77]/15 text-[#fbbf77] border border-[#fbbf77]/25",
    lateral_r: "bg-[#f0a4d6]/15 text-[#f0a4d6] border border-[#f0a4d6]/25",
    prone: "bg-[#93b8ff]/15 text-[#93b8ff] border border-[#93b8ff]/25",
    ok: "bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/25",
    warn: "bg-[#f0a4d6]/15 text-[#f0a4d6] border border-[#f0a4d6]/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary:
      "text-white bg-gradient-to-r from-[#8b5cf6] via-[#7c5cf3] to-[#6366f1] hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] disabled:opacity-50",
    secondary:
      "bg-white/8 border border-white/15 text-foreground hover:bg-white/12 backdrop-blur",
    ghost:
      "text-foreground-soft hover:bg-white/8 hover:text-foreground",
    danger:
      "bg-gradient-to-r from-[#ec4899] to-[#f0a4d6] text-white hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(236,72,153,0.55)]",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3.5 text-xs",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-7 text-base",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
