import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  footer,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[2rem] bg-surface px-6 py-10 text-center shadow-card",
        className,
      )}
    >
      {icon ? (
        <span className="flex size-14 items-center justify-center rounded-full bg-coral text-ink-fixed ring-2 ring-ink-fixed">
          {icon}
        </span>
      ) : null}
      <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
        {title}
      </h2>
      <p className="max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
      {footer ? <div className="mt-2 w-full">{footer}</div> : null}
    </div>
  );
}
