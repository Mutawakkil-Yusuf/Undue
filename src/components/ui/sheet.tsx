"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { CloseIcon } from "./icons";
import { cn } from "@/lib/utils/cn";

type SheetTone = "surface" | "lime" | "dark" | "cream";
type SheetSize = "md" | "lg" | "full";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  description?: string | undefined;
  ariaLabel?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  tone?: SheetTone;
  size?: SheetSize;
  padded?: boolean;
  className?: string;
  bodyClassName?: string;
  footerPadded?: boolean;
  footerClassName?: string;
}

const TONE_CLASSES: Record<SheetTone, string> = {
  surface: "bg-surface text-ink",
  lime: "bg-lime text-ink-fixed",
  dark: "bg-dark text-paper",
  cream: "bg-bone text-ink",
};

const SIZE_CLASSES: Record<SheetSize, string> = {
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  full: "sm:max-w-3xl",
};

const CLOSE_CLASSES: Record<SheetTone, string> = {
  surface: "bg-ink/5 text-ink hover:bg-ink/10",
  lime: "bg-ink-fixed/10 text-ink-fixed hover:bg-ink-fixed/15",
  dark: "bg-paper/10 text-paper hover:bg-paper/15",
  cream: "bg-ink/5 text-ink hover:bg-ink/10",
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  children,
  footer,
  header,
  tone = "surface",
  size = "md",
  padded = true,
  className,
  bodyClassName,
  footerPadded = true,
  footerClassName,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startY: number; lastY: number; active: boolean }>({
    startY: 0,
    lastY: 0,
    active: false,
  });

  const requestClose = useCallback(() => {
    setDragY(0);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusableSelector =
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

    function getFocusable(): HTMLElement[] {
      return Array.from(
        panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
    }

    window.setTimeout(() => getFocusable()[0]?.focus(), 60);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !panel?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [open, requestClose]);

  if (!open) {
    return null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      (event.target as HTMLElement).closest(
        "button, a, input, select, textarea, [role='button']",
      )
    ) {
      return;
    }
    dragState.current = { startY: event.clientY, lastY: 0, active: true };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current.active) {
      return;
    }
    const delta = Math.max(0, event.clientY - dragState.current.startY);
    dragState.current.lastY = delta;
    setDragY(delta);
  }

  function handlePointerUp() {
    if (!dragState.current.active) {
      return;
    }
    const delta = dragState.current.lastY;
    dragState.current.active = false;
    setIsDragging(false);
    if (delta > 110) {
      requestClose();
      return;
    }
    setDragY(0);
  }

  function handlePointerCancel() {
    dragState.current.active = false;
    setIsDragging(false);
    setDragY(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className="absolute inset-0 animate-fade-in bg-ink-fixed/45 backdrop-blur-[3px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : (ariaLabel ?? "Dialog")}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full animate-sheet-in flex-col overflow-hidden",
          "rounded-t-[2rem] shadow-sheet sm:max-h-[88dvh] sm:rounded-[2rem]",
          TONE_CLASSES[tone],
          SIZE_CLASSES[size],
          className,
        )}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging
            ? "none"
            : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        >
          <div className="flex justify-center pt-3 pb-1">
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-11 rounded-full",
                tone === "dark" ? "bg-paper/25" : "bg-ink-fixed/20",
              )}
            />
          </div>

          {header ?? (
            <div className="flex items-start justify-between gap-4 px-5 pt-1 pb-2 sm:px-7">
              <div className="flex min-w-0 flex-col gap-1">
                {title ? (
                  <h2
                    id={titleId}
                    className="font-display text-3xl leading-[0.98] font-extrabold tracking-[-0.05em]"
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p
                    className={cn(
                      "text-sm",
                      tone === "dark" ? "text-paper/65" : "text-ink-fixed/60",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close"
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  CLOSE_CLASSES[tone],
                )}
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 overflow-y-auto overscroll-contain",
            padded ? "px-5 pb-5 sm:px-7" : "p-0",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              "shrink-0",
              footerPadded
                ? "px-5 pt-3 pb-safe-3 sm:px-7 sm:pb-safe-5"
                : "border-0",
              footerPadded
                ? tone === "dark"
                  ? "border-t border-paper/10"
                  : "border-t border-ink-fixed/10"
                : undefined,
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
