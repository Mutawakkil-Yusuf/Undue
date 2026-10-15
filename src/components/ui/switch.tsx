"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 rounded-field border border-line bg-surface px-3.5 py-3",
        disabled && "opacity-60",
        className,
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description ? <span className="text-xs text-muted">{description}</span> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-[var(--color-ember)]"
      />
    </label>
  );
}
