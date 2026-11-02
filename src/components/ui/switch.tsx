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
  tone?: "auto" | "fixed";
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  tone = "auto",
  className,
}: SwitchProps) {
  const labelTone = tone === "fixed" ? "text-ink-fixed" : "text-ink";
  const descriptionTone = tone === "fixed" ? "text-ink-fixed/60" : "text-muted";

  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4",
        disabled && "opacity-55",
        className,
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-sm font-semibold", labelTone)}>{label}</span>
        {description ? (
          <span className={cn("text-xs leading-relaxed", descriptionTone)}>
            {description}
          </span>
        ) : null}
      </span>
      <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-line-strong transition-colors duration-200 peer-checked:bg-ink-fixed peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 size-6 rounded-full bg-paper shadow-sm transition-[transform,background-color] duration-200 ease-out peer-checked:translate-x-6 peer-checked:bg-lime"
        />
      </span>
    </label>
  );
}
