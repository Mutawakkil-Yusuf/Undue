import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong",
        "bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-ember-soft text-ember-strong">
          {icon}
        </span>
      ) : null}
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
