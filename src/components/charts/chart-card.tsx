import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ChartCardProps {
  label: string;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  label,
  title,
  description,
  action,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
            {label}
          </h2>
          <p className="font-display text-xl leading-tight font-extrabold tracking-[-0.04em] text-ink">
            {title}
          </p>
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
