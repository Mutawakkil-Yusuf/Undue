"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { InsightsSection } from "@/components/charts/insights";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { SpendSummaryCard } from "@/components/subscriptions/spend-summary";
import { SubscriptionExplorer } from "@/components/subscriptions/subscription-explorer";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { useSubscriptionDetail } from "@/components/subscriptions/subscription-detail-sheet";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { Button } from "@/components/ui/button";
import { CategoryIcon, categoryColor } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyText } from "@/components/ui/money-text";
import { ChevronRightIcon, PlusIcon, ShieldIcon } from "@/components/ui/icons";
import { getCatalogEntry } from "@/lib/catalog";
import type { CatalogEntry } from "@/lib/catalog/schema";
import { useSubscriptions } from "@/lib/db/hooks";
import { projectSpend } from "@/lib/domain/projection";
import type { Subscription } from "@/lib/domain/schema";
import {
  savingsFromCancelled,
  summarizeByCategory,
  summarizeSpend,
} from "@/lib/domain/spend";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils/cn";

const QUICK_START_IDS = ["netflix", "spotify", "dstv", "mtn-data"] as const;

export default function DashboardPage() {
  const subscriptions = useSubscriptions();
  const { settings } = useAppData();
  const { openAdd } = useSubscriptionSheet();
  const { openDetail } = useSubscriptionDetail();
  const today = useToday();

  const all = subscriptions ?? [];
  const active = all.filter((subscription) => subscription.status === "active");
  const cancelled = all.filter((subscription) => subscription.status === "cancelled");

  const currency = settings.displayCurrency;
  const summary = summarizeSpend(active, currency, settings.fxToNgn);
  const categories = summarizeByCategory(active, currency, settings.fxToNgn);
  const savings = savingsFromCancelled(cancelled, currency, settings.fxToNgn);
  const months = today
    ? projectSpend(active, {
        referenceDate: today,
        displayCurrency: currency,
        fxToNgn: settings.fxToNgn,
        months: 12,
      })
    : [];

  const addButton = (
    <Button onClick={() => openAdd()} leadingIcon={<PlusIcon width={18} height={18} />}>
      Add subscription
    </Button>
  );

  return (
    <div className="flex flex-col gap-5 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <BrandWordmark />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <ShieldIcon width={14} height={14} />
          On this device
        </span>
      </header>

      {subscriptions === undefined || today === null ? (
        <DashboardSkeleton />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<PlusIcon width={24} height={24} />}
          title="No subscriptions yet"
          description="Add your first subscription and we will tell you the last day to cancel before you are charged."
          action={addButton}
          footer={<QuickStart onPick={(entry) => openAdd(entry)} />}
        />
      ) : (
        <>
          {active.length > 0 ? (
            <>
              <SpendSummaryCard
                summary={summary}
                currency={currency}
                activeCount={active.length}
              />
              <InsightsSection
                categories={categories}
                months={months}
                currency={currency}
              />
              <section className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl text-ink">Up next</h2>
                </div>
                <SubscriptionExplorer
                  subscriptions={active}
                  referenceDate={today}
                  onSelect={openDetail}
                  displayCurrency={currency}
                  fxToNgn={settings.fxToNgn}
                />
              </section>
            </>
          ) : (
            <EmptyState
              icon={<PlusIcon width={24} height={24} />}
              title="Nothing active"
              description="Every subscription is cancelled. Add a new one whenever you need to."
              action={addButton}
            />
          )}

          {cancelled.length > 0 ? (
            <CancelledSection
              items={cancelled}
              referenceDate={today}
              onSelect={openDetail}
              savingsAnnual={savings.annual}
              currency={currency}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

interface QuickStartProps {
  onPick: (entry: CatalogEntry) => void;
}

function QuickStart({ onPick }: QuickStartProps) {
  const entries = QUICK_START_IDS.map((id) => getCatalogEntry(id)).filter(
    (entry): entry is CatalogEntry => entry !== undefined,
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted">Or start with a popular one</span>
      <div className="flex flex-wrap justify-center gap-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onPick(entry)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ember active:scale-95"
          >
            <CategoryIcon
              category={entry.category}
              className={categoryColor(entry.category)}
              width={14}
              height={14}
            />
            {entry.name}
          </button>
        ))}
      </div>
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
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-left transition-colors active:bg-bone"
      >
        <span className="flex flex-col">
          <span className="text-sm font-medium text-ink">Cancelled</span>
          {savingsAnnual > 0 ? (
            <span className="text-xs text-safe">
              You stopped <MoneyText amount={savingsAnnual} currency={currency} rounded />
              /yr
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {items.length} {items.length === 1 ? "plan" : "plans"}
          <ChevronRightIcon
            width={16}
            height={16}
            className={cn("transition-transform", expanded && "rotate-90")}
          />
        </span>
      </button>
      {expanded ? (
        <SubscriptionList
          subscriptions={items}
          referenceDate={referenceDate}
          onSelect={onSelect}
        />
      ) : null}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-card border border-line bg-surface/70" />
      <div className="h-56 animate-pulse rounded-card border border-line bg-surface/70" />
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-[74px] animate-pulse rounded-card border border-line bg-surface/70"
          />
        ))}
      </div>
    </div>
  );
}
