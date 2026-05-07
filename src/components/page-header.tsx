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
    <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
