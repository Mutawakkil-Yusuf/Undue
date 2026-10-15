"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { cn } from "@/lib/utils/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      "input, select, textarea, button, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[88dvh] w-full max-w-lg animate-sheet-in flex-col",
          "rounded-t-sheet border border-line bg-surface shadow-sheet",
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-4">
          <div className="flex flex-col gap-1">
            <span
              aria-hidden="true"
              className="mb-1 h-1 w-9 rounded-full bg-line-strong"
            />
            <h2 className="font-display text-xl text-ink">{title}</h2>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-bone hover:text-ink"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="border-t border-line px-5 py-3 pb-safe">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
