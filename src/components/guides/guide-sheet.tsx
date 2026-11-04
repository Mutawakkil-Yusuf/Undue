"use client";

import { useEffect, useRef } from "react";
import { Mascot } from "@/components/brand/mascot";
import { CategoryIcon, categoryColor } from "@/components/ui/category-icon";
import { SwipeButton } from "@/components/ui/swipe-button";
import {
  ArrowLeftIcon,
  ClockIcon,
  ExternalLinkIcon,
  MobileIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { catalogReportUrl } from "@/lib/catalog";
import { formatMonthYear } from "@/lib/domain/format";
import { getCategory } from "@/lib/domain/schema";
import type { CatalogEntry } from "@/lib/catalog/schema";
import { cn } from "@/lib/utils/cn";

const GENERIC_STEPS = [
  "Open your account settings",
  "Find billing or subscriptions",
  "Cancel and keep the receipt",
];

function cleanStep(value: string): string {
  return value
    .replace(/^[-•\s]+/, "")
    .replace(/[.\s]+$/, "")
    .trim();
}

export function guideSteps(note: string): string[] {
  const normalized = note.replace(/\s*->\s*/g, " → ");
  const parts = normalized
    .split(/\s*(?:→|\.\s+|;\s*)\s*/)
    .map(cleanStep)
    .filter((part) => part.length > 2);

  if (parts.length >= 2) {
    return parts.slice(0, 3);
  }
  return GENERIC_STEPS;
}

interface GuideSheetProps {
  entry: CatalogEntry | null;
  onClose: () => void;
  onTrack: (entry: CatalogEntry) => void;
}

export function GuideSheet({ entry, onClose, onTrack }: GuideSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!entry) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusableSelector =
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

    function getFocusable(): HTMLElement[] {
      return Array.from(
        panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
    }

    const focusTimer = window.setTimeout(() => getFocusable()[0]?.focus(), 60);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
      window.clearTimeout(focusTimer);
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [entry]);

  if (!entry) {
    return null;
  }

  const steps = guideSteps(entry.cancelNote);
  const accent = categoryColor(entry.category);
  const mascotColor =
    entry.category === "other" ? "var(--color-lime)" : "var(--color-paper)";
  const inApp = entry.category === "mobile" || entry.category === "finance";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink-fixed/50 backdrop-blur-[3px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.name} cancellation guide`}
        className="relative z-10 flex h-full w-full max-w-3xl animate-sheet-in flex-col overflow-y-auto bg-dark text-paper sm:h-auto sm:max-h-[90dvh] sm:rounded-[2rem]"
      >
        <header className="relative shrink-0 px-5 pt-safe-4 pb-7 sm:px-7 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex size-11 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/15"
            >
              <ArrowLeftIcon width={20} height={20} />
            </button>
            <button
              type="button"
              onClick={() => onTrack(entry)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lavender px-5 text-sm font-bold text-ink-fixed transition-transform duration-200 active:scale-95"
            >
              <PlusIcon width={17} height={17} />
              Track it
            </button>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="font-display text-[clamp(2.1rem,10vw,2.6rem)] leading-[0.86] font-extrabold tracking-[-0.06em] text-balance sm:text-5xl">
                {entry.name}
              </h1>
              <p className="text-sm font-medium text-paper/55">
                {getCategory(entry.category).label} · about 2 minutes
              </p>
            </div>
            <Mascot
              variant="happy"
              color={mascotColor}
              size={88}
              className="hidden shrink-0 animate-float min-[360px]:block"
            />
          </div>
        </header>

        <div
          className="flex flex-1 flex-col gap-5 rounded-t-[2rem] px-5 pt-6 pb-safe-8 text-ink-fixed sm:rounded-t-[2rem] sm:px-7"
          style={{ background: accent }}
        >
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/45 px-3.5 py-2 text-xs font-bold">
              <ClockIcon width={15} height={15} />
              Takes 2 min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/45 px-3.5 py-2 text-xs font-bold">
              {inApp ? (
                <MobileIcon width={15} height={15} />
              ) : (
                <CategoryIcon category={entry.category} width={15} height={15} />
              )}
              {inApp ? "In app or USSD" : "On the web"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em]">
              Cancel in {steps.length} steps
            </h2>
            <ol className="flex flex-col gap-2">
              {steps.map((step, index) => (
                <li
                  key={`${step}-${index}`}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-paper px-4 py-3.5 shadow-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-fixed text-sm font-bold text-paper">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-snug font-semibold">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-start gap-3 rounded-[1.25rem] bg-paper/45 px-4 py-3.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-fixed/10">
              <ClockIcon width={15} height={15} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold tracking-wide uppercase">
                Before you cancel
              </span>
              <p className="text-sm leading-snug font-medium text-ink-fixed/80">
                {entry.cancelNote}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-2">
            {entry.cancelUrl ? (
              <SwipeButton
                label="Swipe to open cancel page"
                onComplete={() => {
                  window.open(entry.cancelUrl ?? "", "_blank", "noopener");
                }}
              />
            ) : (
              <div
                className={cn(
                  "flex min-h-14 items-center justify-center rounded-full bg-ink-fixed/15 px-5 text-center text-sm font-semibold text-ink-fixed/60",
                )}
              >
                No direct link saved — follow the steps above
              </div>
            )}
            <div className="mt-3 flex flex-col items-center gap-1 text-center text-[11px] font-medium text-ink-fixed/55">
              <span>
                Last checked {formatMonthYear(entry.lastVerified)} · reference notes, not
                legal advice.
              </span>
              <a
                href={catalogReportUrl(entry)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1 font-bold underline decoration-ink-fixed/30 underline-offset-2"
              >
                Report a wrong link
                <ExternalLinkIcon width={13} height={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
