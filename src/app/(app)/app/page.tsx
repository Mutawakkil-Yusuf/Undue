"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mascot, MascotAvatar } from "@/components/brand/mascot";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { QuickEntrySheet } from "@/components/import/quick-entry-sheet";
import { BackupNudge } from "@/components/subscriptions/backup-nudge";
import { DeadlineCard, DeadlineHero } from "@/components/subscriptions/deadline-card";
import { SpendSnapshot } from "@/components/subscriptions/spend-snapshot";
import { SubscriptionExplorer } from "@/components/subscriptions/subscription-explorer";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { useSubscriptionDetail } from "@/components/subscriptions/subscription-detail-sheet";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { WeekStrip } from "@/components/subscriptions/week-strip";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import {
  ArrowRightIcon,
  ChartIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { getCatalogEntry } from "@/lib/catalog";
import type { CatalogEntry } from "@/lib/catalog/schema";
import { useSubscriptions } from "@/lib/db/hooks";
import { createSubscription } from "@/lib/db/subscriptions";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { addDays, civilDate, formatIsoDate, todayIso } from "@/lib/domain/date";
import { formatLongDate } from "@/lib/domain/format";
import {
  savingsFromCancelled,
  summarizeByCategory,
  summarizeSpend,
} from "@/lib/domain/spend";
import type { Subscription } from "@/lib/domain/schema";
import { compareUrgency } from "@/lib/domain/urgency";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils/cn";

const QUICK_START_IDS = ["netflix", "spotify", "dstv"] as const;

export default function DashboardPage() {
  const subscriptions = useSubscriptions();
  const { settings } = useAppData();
  const { openAdd } = useSubscriptionSheet();
  const { openDetail } = useSubscriptionDetail();
  const { showToast } = useToast();
  const today = useToday();

  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [showAll, setShowAll] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const all = subscriptions ?? [];
  const active = all.filter((subscription) => subscription.status === "active");
  const cancelled = all.filter((subscription) => subscription.status === "cancelled");

  const currency = settings.displayCurrency;
  const summary = summarizeSpend(active, currency, settings.fxToNgn);
  const categories = summarizeByCategory(active, currency, settings.fxToNgn);
  const savings = savingsFromCancelled(cancelled, currency, settings.fxToNgn);

  const sorted = useMemo(() => {
    if (!today) {
      return [];
    }
    return [...active].sort((a, b) => {
      const windowA = computeCancelWindow(a, today);
      const windowB = computeCancelWindow(b, today);
      const byUrgency = compareUrgency(windowA.urgency, windowB.urgency);
      if (byUrgency !== 0) {
        return byUrgency;
      }
      return windowA.daysUntilCancelBy - windowB.daysUntilCancelBy;
    });
  }, [active, today]);

  const hero = sorted[0];
  const rest = sorted.slice(1);
  const visibleRest = showAll ? rest : rest.slice(0, 4);
  const heroWindow = hero && today ? computeCancelWindow(hero, today) : null;
  const dateLabel = today ? formatLongDate(todayIso(today)) : "Today";

  async function handleSample() {
    try {
      await createSubscription({
        name: "Netflix",
        serviceId: "netflix",
        category: "streaming",
        amount: 4400,
        currency: "NGN",
        cycle: { unit: "month", interval: 1 },
        nextRenewal: formatIsoDate(addDays(civilDate(), 5)),
        leadDays: 2,
        isTrial: false,
        trialEndsAt: null,
        paidVia: "card",
        chargeStatus: "unknown",
        myShare: null,
        cancelUrl: "https://www.netflix.com/cancelplan",
        notes: "Sample plan — delete or edit it whenever you like.",
      });
      showToast("Sample plan added", "success");
    } catch {
      showToast("Could not add the sample", "danger");
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-2 lg:gap-8 lg:pt-2">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-muted">{dateLabel}</span>
          <h1 className="max-w-[9ch] font-display text-[clamp(2.8rem,13vw,3.4rem)] leading-[0.82] font-extrabold tracking-[-0.07em] text-ink sm:text-6xl lg:text-7xl">
            Your deadlines
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Open settings"
          className="mt-1 shrink-0 transition-transform duration-200 hover:rotate-3 active:scale-95"
        >
          <MascotAvatar
            variant={heroWindow?.urgency === "today" ? "alarmed" : "happy"}
            color="var(--color-yellow)"
            size={64}
            className="sm:size-[72px]"
          />
        </Link>
      </header>

      <BackupNudge />

      {subscriptions === undefined || today === null ? (
        <DashboardSkeleton />
      ) : all.length === 0 ? (
        <EmptyDeadlines
          onPick={(entry) => openAdd(entry)}
          onAdd={() => openAdd()}
          onPaste={() => setQuickOpen(true)}
          onSample={() => void handleSample()}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setPeriod((current) => (current === "monthly" ? "annual" : "monthly"))
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-lime px-5 py-3 text-sm font-bold text-ink-fixed transition-transform duration-200 active:scale-[0.98]"
            >
              <MoneyText
                amount={period === "monthly" ? summary.monthly : summary.annual}
                currency={currency}
                rounded
                animate
              />
              <span className="text-ink-fixed/70">
                a {period === "monthly" ? "month" : "year"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExplorerOpen((value) => !value)}
              aria-expanded={explorerOpen}
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-bone"
            >
              {active.length} active
              <ChevronDownIcon
                width={15}
                height={15}
                className={cn("transition-transform", explorerOpen && "rotate-180")}
              />
            </button>

            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-3 text-sm font-bold text-ink shadow-card transition-colors hover:bg-surface-soft"
            >
              <ChartIcon width={16} height={16} />
              Insights
            </Link>

            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-bone"
            >
              <SparkIcon width={16} height={16} />
              Paste alert
            </button>
          </div>

          {active.length > 0 ? <WeekStrip subscriptions={active} today={today} /> : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)] lg:items-start lg:gap-8">
            <div className="flex min-w-0 flex-col gap-6">
              {active.length > 0 ? (
                <section className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
                      Up next
                    </h2>
                    <button
                      type="button"
                      onClick={() => setExplorerOpen((value) => !value)}
                      aria-label="Search and filter subscriptions"
                      aria-expanded={explorerOpen}
                      className="flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-surface-soft"
                    >
                      <SearchIcon width={18} height={18} />
                    </button>
                  </div>

                  {hero && heroWindow ? (
                    <DeadlineHero
                      subscription={hero}
                      window={heroWindow}
                      onSelect={openDetail}
                    />
                  ) : null}

                  {visibleRest.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {visibleRest.map((subscription, index) => (
                        <div
                          key={subscription.id}
                          className="animate-rise-in"
                          style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
                        >
                          <DeadlineCard
                            subscription={subscription}
                            window={computeCancelWindow(subscription, today)}
                            onSelect={openDetail}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {rest.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setShowAll((value) => !value)}
                      className="inline-flex items-center gap-1.5 self-start px-1 text-sm font-bold text-ink transition-colors hover:text-coral"
                    >
                      {showAll ? "Show less" : `Show ${rest.length - 4} more`}
                      <ChevronDownIcon
                        width={16}
                        height={16}
                        className={cn("transition-transform", showAll && "rotate-180")}
                      />
                    </button>
                  ) : null}

                  {explorerOpen ? (
                    <div className="animate-rise-in rounded-[2rem] bg-surface-soft p-4 sm:p-5">
                      <SubscriptionExplorer
                        subscriptions={active}
                        referenceDate={today}
                        onSelect={openDetail}
                        displayCurrency={currency}
                        fxToNgn={settings.fxToNgn}
                      />
                    </div>
                  ) : null}
                </section>
              ) : (
                <EmptyActive onAdd={() => openAdd()} />
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              {active.length > 0 ? (
                <SpendSnapshot
                  summary={summary}
                  categories={categories}
                  currency={currency}
                  activeCount={active.length}
                  period={period}
                  onPeriodChange={setPeriod}
                />
              ) : null}

              {cancelled.length > 0 ? (
                <CancelledSection
                  items={cancelled}
                  referenceDate={today}
                  onSelect={openDetail}
                  savingsAnnual={savings.annual}
                  currency={currency}
                />
              ) : null}
            </div>
          </div>
        </>
      )}

      <QuickEntrySheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}

function EmptyDeadlines({
  onPick,
  onAdd,
  onPaste,
  onSample,
}: {
  onPick: (entry: CatalogEntry) => void;
  onAdd: () => void;
  onPaste: () => void;
  onSample: () => void;
}) {
  const entries = QUICK_START_IDS.map((id) => getCatalogEntry(id)).filter(
    (entry): entry is CatalogEntry => entry !== undefined,
  );

  return (
    <div className="flex animate-rise-in flex-col items-center gap-7 py-6 text-center sm:py-10">
      <div className="relative flex size-64 items-center justify-center rounded-full bg-lime sm:size-80">
        <Mascot
          variant="sleepy"
          color="var(--color-yellow)"
          size={210}
          className="animate-float"
        />
        <span className="absolute top-10 right-10 font-display text-2xl font-extrabold text-ink-fixed/40">
          z
        </span>
        <span className="absolute top-4 right-4 font-display text-lg font-extrabold text-ink-fixed/25">
          z
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-6xl">
          All clear.
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted sm:text-base">
          Nothing to cancel yet. Add what you pay for and I&apos;ll watch the dates for
          you.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2.5">
        <Button
          variant="primary"
          size="xl"
          onClick={onAdd}
          className="w-full justify-between px-6"
          trailingIcon={<ArrowRightIcon width={20} height={20} />}
        >
          Add your first
        </Button>
        <Button variant="secondary" size="lg" onClick={onPaste} block>
          Paste a bank alert instead
        </Button>
        <button
          type="button"
          onClick={onSample}
          className="min-h-10 text-sm font-bold text-muted underline decoration-muted/30 underline-offset-4 transition-colors hover:text-ink"
        >
          Or see a sample plan
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onPick(entry)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-bone"
          >
            <ServiceAvatar category={entry.category} size="sm" className="size-6" />
            {entry.name}
          </button>
        ))}
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted transition-colors hover:text-ink"
        >
          Browse guides
          <ArrowRightIcon width={15} height={15} />
        </Link>
      </div>
    </div>
  );
}

function EmptyActive({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-surface p-8 text-center shadow-card">
      <div className="flex size-32 items-center justify-center rounded-full bg-sky">
        <Mascot variant="wink" color="var(--color-paper)" size={96} />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.05em] text-ink">
          Nothing active
        </h2>
        <p className="max-w-xs text-sm text-muted">
          Every plan is cancelled. Add a new one whenever you need to.
        </p>
      </div>
      <Button onClick={onAdd} leadingIcon={<PlusIcon width={18} height={18} />}>
        Add subscription
      </Button>
    </div>
  );
}

interface CancelledSectionProps {
  items: readonly Subscription[];
  referenceDate: Date;
  onSelect: (subscription: Subscription) => void;
  savingsAnnual: number;
  currency: Subscription["currency"];
}

function CancelledSection({
  items,
  referenceDate,
  onSelect,
  savingsAnnual,
  currency,
}: CancelledSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-[2rem] bg-surface-soft p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex items-center justify-between gap-4 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
            Cancelled
          </span>
          <span className="font-display text-xl leading-tight font-extrabold tracking-[-0.04em] text-ink">
            {savingsAnnual > 0 ? (
              <>
                You stopped{" "}
                <MoneyText amount={savingsAnnual} currency={currency} rounded /> a year
              </>
            ) : (
              "Your cancelled plans"
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-muted">
          {items.length}
          <ChevronDownIcon
            width={15}
            height={15}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </span>
      </button>

      {expanded ? (
        <div className="animate-rise-in">
          <SubscriptionList
            subscriptions={items}
            referenceDate={referenceDate}
            onSelect={onSelect}
          />
        </div>
      ) : null}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex gap-2.5">
        <div className="h-11 w-40 animate-pulse rounded-full bg-surface/70" />
        <div className="h-11 w-28 animate-pulse rounded-full bg-surface/70" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[74px] w-[54px] shrink-0 animate-pulse rounded-[1.15rem] bg-surface/70"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="flex flex-col gap-3">
          <div className="h-[280px] animate-pulse rounded-[2.25rem] bg-surface/70" />
          <div className="h-[92px] animate-pulse rounded-[1.75rem] bg-surface/70" />
          <div className="h-[92px] animate-pulse rounded-[1.75rem] bg-surface/70" />
        </div>
        <div className="h-64 animate-pulse rounded-[2rem] bg-surface/70" />
      </div>
    </div>
  );
}
