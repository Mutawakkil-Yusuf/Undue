import type { ReactNode } from "react";

interface ChartCardProps {
  label: string;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  children: ReactNode;
}

export function ChartCard({
  label,
  title,
  description,
  action,
  children,
}: ChartCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
            {label}
          </h2>
          <p className="font-display text-lg text-ink">{title}</p>
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
