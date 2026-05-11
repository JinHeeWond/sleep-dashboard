import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-primary-3 uppercase tracking-[0.18em] mb-3 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary-3 animate-pulse-soft" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-[40px] leading-[1.1] font-semibold tracking-tight gradient-text">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
