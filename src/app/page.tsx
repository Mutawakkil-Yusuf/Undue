"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { SpendSummaryCard } from "@/components/subscriptions/spend-summary";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, ShieldIcon } from "@/components/ui/icons";
import { useSubscriptions } from "@/lib/db/hooks";
import { summarizeSpend } from "@/lib/domain/spend";
import { useToday } from "@/lib/hooks/use-today";

export default function DashboardPage() {
  const subscriptions = useSubscriptions();
  const { settings } = useAppData();
  const { openAdd, openEdit } = useSubscriptionSheet();
  const today = useToday();

  const active = (subscriptions ?? []).filter(
    (subscription) => subscription.status === "active",
  );
  const summary = summarizeSpend(active, settings.displayCurrency, settings.fxToNgn);

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
      ) : active.length === 0 ? (
        <EmptyState
          icon={<PlusIcon width={24} height={24} />}
          title="No subscriptions yet"
          description="Add your first subscription and we will tell you the last day to cancel before you are charged."
          action={
            <Button onClick={openAdd} leadingIcon={<PlusIcon width={18} height={18} />}>
              Add subscription
            </Button>
          }
        />
      ) : (
        <>
          <SpendSummaryCard
            summary={summary}
            currency={settings.displayCurrency}
            activeCount={active.length}
          />
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl text-ink">Up next</h2>
              <span className="text-xs text-muted">Sorted by urgency</span>
            </div>
            <SubscriptionList
              subscriptions={active}
              referenceDate={today}
              onSelect={openEdit}
            />
          </section>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-card border border-line bg-surface/70" />
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
