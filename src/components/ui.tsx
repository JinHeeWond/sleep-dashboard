import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-card border border-border p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]",
        className
      )}
    >
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
    <div className={cn("flex items-baseline justify-between gap-3 mb-4", className)}>
      <h3 className="text-base font-semibold tracking-tight">{children}</h3>
      {hint && (
        <span className="text-xs text-muted-foreground">{hint}</span>
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
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

export function Badge({
  children,
  color = "muted",
}: {
  children: ReactNode;
  color?: "muted" | "supine" | "lateral_l" | "lateral_r" | "prone" | "ok" | "warn";
}) {
  const colors: Record<string, string> = {
    muted: "bg-muted text-foreground",
    supine: "bg-[#5BBF72]/15 text-[#2f8a48]",
    lateral_l: "bg-[#F4A742]/15 text-[#a86b14]",
    lateral_r: "bg-[#E07BB5]/15 text-[#9a3a73]",
    prone: "bg-[#5B8EBF]/15 text-[#1f578a]",
    ok: "bg-[#5BBF72]/15 text-[#2f8a48]",
    warn: "bg-[#E07BB5]/15 text-[#9a3a73]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
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
      "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50",
    secondary:
      "bg-card border border-border text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-[#E07BB5] text-white hover:bg-[#c25994]",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
