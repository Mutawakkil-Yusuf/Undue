"use client";

import { Mascot, type MascotVariant } from "@/components/brand/mascot";
import { MoneyText } from "@/components/ui/money-text";
import { ArrowRightIcon, ArrowUpRightIcon } from "@/components/ui/icons";
import type { CancelWindow } from "@/lib/domain/cancel-by";
import { formatCountdown, formatDate, formatDaysUntil } from "@/lib/domain/format";
import type { Subscription } from "@/lib/domain/schema";
import type { UrgencyLevel } from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";

type DeadlineTone = "coral" | "yellow" | "lime" | "cream";

const TONE_BY_URGENCY: Record<UrgencyLevel, DeadlineTone> = {
  today: "coral",
  urgent: "coral",
  missed: "coral",
  soon: "yellow",
  safe: "lime",
  past: "cream",
};

const TONE_CLASSES: Record<DeadlineTone, string> = {
  coral: "bg-coral",
  yellow: "bg-yellow",
  lime: "bg-lime",
  cream: "bg-paper-soft",
};

const MASCOT_BY_URGENCY: Record<UrgencyLevel, MascotVariant> = {
  today: "alarmed",
  urgent: "alarmed",
  missed: "alarmed",
  soon: "calm",
  safe: "happy",
  past: "sleepy",
};

const MASCOT_COLOR: Record<DeadlineTone, string> = {
  coral: "var(--color-yellow)",
  yellow: "var(--color-paper)",
  lime: "var(--color-yellow)",
  cream: "var(--color-lime)",
};

function urgencyPill(window: CancelWindow): string {
  switch (window.urgency) {
    case "today":
      return "Last day today";
    case "missed":
      return "Window passed";
    case "past":
      return "Renewed";
    case "urgent":
    case "soon":
    case "safe":
      return `${formatCountdown(window.daysUntilCancelBy)} left`;
  }
}

function chargeLine(window: CancelWindow): string {
  if (window.daysUntilRenewal < 0) {
    return "charge date has passed";
  }
  return `charges ${formatDaysUntil(window.daysUntilRenewal)}`;
}

interface DeadlineHeroProps {
  subscription: Subscription;
  window: CancelWindow;
  onSelect: (subscription: Subscription) => void;
}

export function DeadlineHero({ subscription, window, onSelect }: DeadlineHeroProps) {
  const tone = TONE_BY_URGENCY[window.urgency];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2.25rem] p-6 text-ink-fixed shadow-card transition-transform duration-300 ease-out hover:-translate-y-0.5 sm:p-8",
        TONE_CLASSES[tone],
      )}
    >
      <div className="relative z-10 flex flex-col items-start gap-5">
        <div className="flex w-full items-start justify-between gap-4">
          <span className="inline-flex items-center rounded-full bg-ink-fixed px-3.5 py-1.5 text-xs font-bold tracking-wide text-paper">
            {urgencyPill(window)}
          </span>
          <button
            type="button"
            onClick={() => onSelect(subscription)}
            aria-label={`Open ${subscription.name}`}
            className="flex size-11 items-center justify-center rounded-full bg-ink-fixed text-paper transition-transform duration-200 group-hover:rotate-6 active:scale-90"
          >
            <ArrowUpRightIcon width={21} height={21} />
          </button>
        </div>

        <div className="flex max-w-[78%] flex-col gap-2 sm:max-w-[68%]">
          <h2 className="font-display text-[2.75rem] leading-[0.86] font-extrabold tracking-[-0.065em] text-balance sm:text-5xl">
            {subscription.name}
          </h2>
          <p className="text-sm font-semibold text-ink-fixed/75 sm:text-base">
            <MoneyText amount={subscription.amount} currency={subscription.currency} /> ·{" "}
            {chargeLine(window)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelect(subscription)}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-5 text-sm font-bold text-ink-fixed shadow-sm transition-transform duration-200 hover:gap-3 active:scale-[0.97]"
        >
          How to cancel
          <ArrowRightIcon width={18} height={18} />
        </button>
      </div>

      <div className="pointer-events-none absolute -right-2 -bottom-4 z-0 hidden opacity-95 min-[360px]:block sm:right-6 sm:-bottom-5">
        <Mascot
          variant={MASCOT_BY_URGENCY[window.urgency]}
          color={MASCOT_COLOR[tone]}
          size={150}
          className="drop-shadow-[0_18px_18px_rgba(25,23,19,0.12)] sm:size-[180px]"
        />
      </div>
    </article>
  );
}

interface DeadlineCardProps {
  subscription: Subscription;
  window: CancelWindow;
  onSelect: (subscription: Subscription) => void;
  className?: string;
}

export function DeadlineCard({
  subscription,
  window,
  onSelect,
  className,
}: DeadlineCardProps) {
  const tone = TONE_BY_URGENCY[window.urgency];

  return (
    <button
      type="button"
      onClick={() => onSelect(subscription)}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-[1.75rem] p-5 text-left text-ink-fixed shadow-card transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.99] sm:p-6",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-display text-2xl leading-none font-extrabold tracking-[-0.05em] sm:text-[1.7rem]">
          {subscription.name}
        </span>
        <span className="truncate text-xs font-semibold text-ink-fixed/65 sm:text-sm">
          Last day {formatDate(window.cancelBy)}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="inline-flex items-center rounded-full bg-ink-fixed px-3 py-1.5 text-xs font-bold text-paper">
          {window.urgency === "today"
            ? "Today"
            : window.urgency === "missed" || window.urgency === "past"
              ? "Passed"
              : formatCountdown(window.daysUntilCancelBy)}
        </span>
        <MoneyText
          amount={subscription.amount}
          currency={subscription.currency}
          className="text-sm font-bold"
        />
      </div>
    </button>
  );
}
