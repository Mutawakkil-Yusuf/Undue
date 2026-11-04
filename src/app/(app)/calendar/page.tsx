"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mascot } from "@/components/brand/mascot";
import { useAppData } from "@/components/providers/app-data-provider";
import { useSubscriptionDetail } from "@/components/subscriptions/subscription-detail-sheet";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { useSubscriptions } from "@/lib/db/hooks";
import { computeCancelWindow, type CancelWindow } from "@/lib/domain/cancel-by";
import { addDays, formatIsoDate, parseIsoDate, todayIso } from "@/lib/domain/date";
import {
  formatCountdown,
  formatDate,
  formatMonthShort,
  formatMonthYear,
} from "@/lib/domain/format";
import { summarizeSpend } from "@/lib/domain/spend";
import { getEffectiveAmount } from "@/lib/domain/subscription";
import type { Subscription } from "@/lib/domain/schema";
import {
  compareUrgency,
  getUrgencyPresentation,
  type UrgencyLevel,
} from "@/lib/domain/urgency";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils/cn";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const BADGE_TONE: Record<UrgencyLevel, string> = {
  today: "bg-coral",
  urgent: "bg-coral",
  missed: "bg-coral",
  soon: "bg-yellow",
  safe: "bg-lime",
  past: "bg-paper-soft",
};

function monthStartOf(iso: string): string {
  const date = parseIsoDate(iso);
  return formatIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function shiftMonth(iso: string, delta: number): string {
  const date = parseIsoDate(iso);
  return formatIsoDate(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1)),
  );
}

function normalizeInitialDate(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    try {
      parseIsoDate(raw);
      return raw;
    } catch {
      // Fall through to today for malformed calendar links.
    }
  }
  return todayIso();
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarPageInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("date");
  const initialDate = normalizeInitialDate(raw);
  return <CalendarContent key={initialDate} initialDate={initialDate} />;
}

function CalendarContent({ initialDate }: { initialDate: string }) {
  const subscriptions = useSubscriptions();
  const { settings } = useAppData();
  const { openDetail } = useSubscriptionDetail();
  const { openAdd } = useSubscriptionSheet();
  const today = useToday();

  const [viewMonthIso, setViewMonthIso] = useState(() => monthStartOf(initialDate));
  const [selectedIso, setSelectedIso] = useState(initialDate);

  const all = subscriptions ?? [];
  const active = all.filter((subscription) => subscription.status === "active");
  const currency = settings.displayCurrency;
  const summary = summarizeSpend(active, currency, settings.fxToNgn);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, { subscription: Subscription; window: CancelWindow }[]>();
    if (!today) {
      return map;
    }
    for (const subscription of active) {
      const window = computeCancelWindow(subscription, today);
      const list = map.get(window.cancelBy) ?? [];
      list.push({ subscription, window });
      map.set(window.cancelBy, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const byUrgency = compareUrgency(a.window.urgency, b.window.urgency);
        return byUrgency !== 0
          ? byUrgency
          : a.window.daysUntilCancelBy - b.window.daysUntilCancelBy;
      });
    }
    return map;
  }, [active, today]);

  const cells = useMemo(() => {
    const first = parseIsoDate(viewMonthIso);
    const offset = (first.getUTCDay() + 6) % 7;
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(start, index);
      return {
        iso: formatIsoDate(date),
        day: date.getUTCDate(),
        inMonth:
          date.getUTCMonth() === first.getUTCMonth() &&
          date.getUTCFullYear() === first.getUTCFullYear(),
      };
    });
  }, [viewMonthIso]);

  const comingUp = useMemo(() => {
    if (!today) {
      return [];
    }
    return active
      .map((subscription) => ({
        subscription,
        window: computeCancelWindow(subscription, today),
      }))
      .filter((item) => item.window.daysUntilRenewal >= 0)
      .sort((a, b) => a.window.cancelBy.localeCompare(b.window.cancelBy))
      .slice(0, 8);
  }, [active, today]);

  const selectedEvents = eventsByDay.get(selectedIso) ?? [];
  const todayValue = today ? todayIso(today) : "";
  const monthPrefix = viewMonthIso.slice(0, 7);
  const deadlinesThisMonth = [...eventsByDay.entries()]
    .filter(([iso]) => iso.startsWith(monthPrefix))
    .reduce((sum, [, events]) => sum + events.length, 0);

  function goToMonth(iso: string) {
    setViewMonthIso(monthStartOf(iso));
    setSelectedIso(iso);
  }

  return (
    <div className="flex flex-col gap-6 pt-2 lg:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">Every last safe day</span>
          <h1 className="font-display text-[length:min(3.4rem,17vw)] leading-[0.84] font-extrabold tracking-[-0.07em] text-ink sm:text-6xl">
            Calendar
          </h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-surface p-1.5 shadow-card">
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(viewMonthIso, -1))}
            aria-label="Previous month"
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(today ? todayIso(today) : todayIso())}
            aria-label="Go to today"
            className="rounded-full px-2 text-sm font-bold text-ink"
          >
            {formatMonthYear(viewMonthIso)}
          </button>
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(viewMonthIso, 1))}
            aria-label="Next month"
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
          >
            <ChevronRightIcon width={18} height={18} />
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-[2rem] bg-surface p-3 shadow-card sm:p-6">
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {WEEKDAYS.map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className="pb-2 text-center text-[11px] font-bold tracking-[0.12em] text-muted uppercase"
                >
                  {day}
                </span>
              ))}
              {cells.map((cell) => {
                const isToday = cell.iso === todayValue;
                const isSelected = cell.iso === selectedIso;
                const events = eventsByDay.get(cell.iso);
                const urgency = events?.[0]?.window.urgency;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setSelectedIso(cell.iso);
                      if (!cell.inMonth) {
                        setViewMonthIso(monthStartOf(cell.iso));
                      }
                    }}
                    aria-label={`Select ${formatDate(cell.iso)}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative mx-auto flex size-8 flex-col items-center justify-center rounded-full text-sm font-bold transition-all duration-200 min-[360px]:size-10 sm:size-11",
                      cell.inMonth ? "text-ink" : "text-muted/35",
                      isToday && "bg-coral text-ink-fixed ring-2 ring-ink-fixed",
                      isSelected && !isToday && "bg-ink text-bone shadow-card",
                      !isToday && !isSelected && "hover:bg-surface-soft active:scale-95",
                    )}
                  >
                    {cell.day}
                    {events ? (
                      <span
                        className={cn(
                          "absolute bottom-1 size-1.5 rounded-full",
                          isToday || isSelected
                            ? "bg-bone"
                            : urgency
                              ? BADGE_TONE[urgency]
                              : "bg-coral",
                        )}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className={cn(
              "relative overflow-hidden rounded-[2rem] p-5 shadow-card sm:p-6",
              selectedEvents.length > 0
                ? "bg-coral text-ink-fixed"
                : "bg-surface text-ink",
            )}
          >
            <div className="relative z-10 flex flex-col gap-3 sm:pr-24">
              <span
                className={cn(
                  "text-[11px] font-bold tracking-[0.13em] uppercase",
                  selectedEvents.length > 0 ? "text-ink-fixed/60" : "text-coral-ink",
                )}
              >
                {formatDate(selectedIso)}
                {selectedEvents.length > 0 ? " · last day" : " · nothing due"}
              </span>

              {selectedEvents.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {selectedEvents.map(({ subscription, window }) => (
                    <li key={subscription.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(subscription)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-paper/20 px-3 py-2.5 text-left transition-colors hover:bg-paper/30"
                      >
                        <ServiceAvatar category={subscription.category} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-xl leading-none font-extrabold tracking-[-0.04em]">
                            {subscription.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-ink-fixed/65">
                            {subscription.isTrial && window.daysUntilRenewal < 0
                              ? "Trial ended"
                              : getUrgencyPresentation(window.urgency).label}{" "}
                            · {formatCountdown(window.daysUntilCancelBy)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-ink-fixed px-3 py-1.5 text-xs font-bold text-paper">
                          <MoneyText
                            amount={getEffectiveAmount(subscription)}
                            currency={subscription.currency}
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-lime">
                    <Mascot variant="sleepy" color="var(--color-yellow)" size={48} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-xl leading-tight font-extrabold tracking-[-0.04em] text-ink">
                      Nothing to cancel on this day.
                    </p>
                    <p className="text-xs text-muted">
                      Pick another day, or add a subscription to start watching dates.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {selectedEvents.length > 0 ? (
              <Mascot
                variant="alarmed"
                color="var(--color-yellow)"
                size={96}
                className="pointer-events-none absolute -right-2 -bottom-4 hidden opacity-70 sm:block"
              />
            ) : null}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-yellow p-5 text-ink-fixed shadow-card sm:p-6">
            <div className="relative z-10 flex flex-col gap-1 pr-24">
              <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
                This month
              </span>
              <span className="font-display text-4xl leading-none font-extrabold tracking-[-0.06em]">
                {deadlinesThisMonth}{" "}
                <span className="text-2xl">
                  {deadlinesThisMonth === 1 ? "deadline" : "deadlines"}
                </span>
              </span>
              <span className="mt-1 text-xs font-semibold text-ink-fixed/65">
                <MoneyText amount={summary.monthly} currency={currency} rounded /> a month
                across {active.length} active {active.length === 1 ? "plan" : "plans"}
              </span>
            </div>
            <Mascot
              variant="calm"
              color="var(--color-paper)"
              size={92}
              className="pointer-events-none absolute -right-1 -bottom-2 opacity-90"
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
                Coming up
              </h2>
              <span className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                {formatMonthShort(viewMonthIso)}
              </span>
            </div>

            {comingUp.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {comingUp.map(({ subscription, window }, index) => (
                  <li
                    key={subscription.id}
                    className="animate-rise-in"
                    style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => openDetail(subscription)}
                      className="flex w-full items-center gap-3 rounded-[1.4rem] bg-surface p-3.5 text-left shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      <span
                        className={cn(
                          "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-ink-fixed",
                          BADGE_TONE[window.urgency],
                        )}
                      >
                        <span className="text-[11px] font-bold tracking-wide uppercase">
                          {formatMonthShort(window.cancelBy)}
                        </span>
                        <span className="font-display text-lg leading-none font-extrabold">
                          {parseIsoDate(window.cancelBy).getUTCDate()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {subscription.name}
                        </span>
                        <span className="block text-[11px] font-medium text-muted">
                          {window.daysUntilCancelBy === 0
                            ? "Last day today"
                            : window.daysUntilCancelBy < 0
                              ? "Window passed"
                              : `${formatCountdown(window.daysUntilCancelBy)} left`}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs font-bold text-ink">
                        <MoneyText
                          amount={getEffectiveAmount(subscription)}
                          currency={subscription.currency}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-surface p-6 text-center shadow-card">
                <div className="flex size-20 items-center justify-center rounded-full bg-lime">
                  <Mascot variant="sleepy" color="var(--color-yellow)" size={58} />
                </div>
                <p className="text-sm font-semibold text-ink">No upcoming deadlines.</p>
                <p className="text-xs text-muted">
                  Add a subscription and Undue will fill this list.
                </p>
                <button
                  type="button"
                  onClick={() => openAdd()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-bone"
                >
                  <PlusIcon width={14} height={14} />
                  Add subscription
                </button>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-surface-soft p-4 text-left transition-colors hover:bg-surface"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-sky text-ink-fixed">
                <CalendarIcon width={18} height={18} />
              </span>
              <span className="text-sm font-bold text-ink">Add another deadline</span>
            </span>
            <ArrowRightIcon width={18} height={18} className="text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarFallback() {
  return (
    <div className="flex flex-col gap-6 pt-2" aria-hidden="true">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded-full bg-surface/70" />
          <div className="h-14 w-56 animate-pulse rounded-2xl bg-surface/70" />
        </div>
        <div className="h-12 w-44 animate-pulse rounded-full bg-surface/70" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-surface/70" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-surface/70" />
      </div>
    </div>
  );
}
