"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { useAppData } from "@/components/providers/app-data-provider";
import { InsightsSection } from "@/components/charts/insights";
import { SmartReviewSection } from "@/components/smart/smart-insights";
import { useSubscriptionDetail } from "@/components/subscriptions/subscription-detail-sheet";
import { Button } from "@/components/ui/button";
import { CategoryIcon, categoryColor } from "@/components/ui/category-icon";
import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { ArrowLeftIcon, ChartIcon, TrendUpIcon } from "@/components/ui/icons";
import { useSubscriptions } from "@/lib/db/hooks";
import { formatMoney } from "@/lib/domain/currency";
import { formatDate } from "@/lib/domain/format";
import { priceChange } from "@/lib/domain/price-history";
import { projectSpend } from "@/lib/domain/projection";
import {
  monthlyAmount,
  normalizeToDisplayCurrency,
  savingsFromCancelled,
  summarizeByCategory,
  summarizeSpend,
} from "@/lib/domain/spend";
import { getCategory } from "@/lib/domain/schema";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils/cn";

export default function InsightsPage() {
  const subscriptions = useSubscriptions();
  const { settings } = useAppData();
  const { openDetail } = useSubscriptionDetail();
  const today = useToday();
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

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

  const topPlans = [...active]
    .map((subscription) => ({
      subscription,
      monthly: monthlyAmount(
        normalizeToDisplayCurrency(subscription, currency, settings.fxToNgn),
        subscription.cycle,
      ),
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 5);

  const hikes = active.flatMap((subscription) => {
    const change = priceChange(subscription.priceHistory);
    return change?.increased ? [{ subscription, change }] : [];
  });

  const amount = period === "monthly" ? summary.monthly : summary.annual;

  return (
    <div className="flex flex-col gap-6 pt-2 lg:gap-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/app"
          aria-label="Back to deadlines"
          className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-surface-soft lg:hidden"
        >
          <ArrowLeftIcon width={19} height={19} />
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">The full picture</span>
            <h1 className="font-display text-[clamp(2.7rem,13vw,3.2rem)] leading-[0.84] font-extrabold tracking-[-0.07em] text-ink sm:text-6xl">
              Insights
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface p-1 shadow-card">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors",
                  period === option ? "bg-ink text-bone" : "text-muted hover:text-ink",
                )}
              >
                {option === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {subscriptions === undefined || today === null ? (
        <div
          className="h-72 animate-pulse rounded-[2rem] bg-surface/70"
          aria-hidden="true"
        />
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-surface p-10 text-center shadow-card">
          <div className="flex size-40 items-center justify-center rounded-full bg-lime">
            <Mascot variant="sleepy" color="var(--color-yellow)" size={120} />
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.05em] text-ink">
            Nothing to chart yet.
          </h2>
          <p className="max-w-sm text-sm text-muted">
            Add a subscription and this page will show where the money goes, what is
            coming, and where prices have moved.
          </p>
          <Link href="/app">
            <Button variant="primary">Back to deadlines</Button>
          </Link>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[2rem] bg-coral p-6 text-ink-fixed shadow-card sm:p-8">
            <div className="relative z-10 flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/60 uppercase">
                {period === "monthly" ? "Each month" : "Each year"}
              </span>
              <MoneyText
                amount={amount}
                currency={currency}
                rounded
                animate
                className="max-w-full font-display text-[clamp(2.5rem,13vw,3rem)] leading-none font-extrabold tracking-[-0.07em] break-words sm:text-7xl"
              />
              <span className="text-sm font-semibold text-ink-fixed/70">
                across {active.length} active {active.length === 1 ? "plan" : "plans"}
              </span>
            </div>
            <Mascot
              variant="happy"
              color="var(--color-yellow)"
              size={150}
              className="pointer-events-none absolute -right-2 -bottom-4 hidden opacity-90 sm:right-8 sm:block"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-6">
              <InsightsSection
                categories={categories}
                months={months}
                currency={currency}
              />
            </div>

            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
                      Biggest plans
                    </span>
                    <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
                      Where most of it goes
                    </h2>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full bg-sky text-ink-fixed">
                    <ChartIcon width={18} height={18} />
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {topPlans.map(({ subscription, monthly }) => {
                    const share = summary.monthly > 0 ? monthly / summary.monthly : 0;
                    return (
                      <li key={subscription.id}>
                        <button
                          type="button"
                          onClick={() => openDetail(subscription)}
                          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-surface-soft"
                        >
                          <ServiceAvatar category={subscription.category} size="sm" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-bold text-ink">
                              {subscription.name}
                            </span>
                            <span className="h-1.5 overflow-hidden rounded-full bg-line/60">
                              <span
                                className="block h-full rounded-full"
                                style={{
                                  width: `${Math.max(6, Math.round(share * 100))}%`,
                                  background: categoryColor(subscription.category),
                                }}
                              />
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs font-bold text-ink">
                            <MoneyText amount={monthly} currency={currency} rounded />
                            <span className="block text-[10px] font-medium text-muted">
                              /mo · {Math.round(share * 100)}%
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="flex flex-col gap-4 rounded-[2rem] bg-yellow p-5 text-ink-fixed shadow-card sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
                      Price hikes
                    </span>
                    <h2 className="font-display text-xl font-extrabold tracking-[-0.04em]">
                      {hikes.length > 0
                        ? `${hikes.length} plan${hikes.length === 1 ? "" : "s"} moved up`
                        : "No price hikes"}
                    </h2>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full bg-paper text-ink-fixed">
                    <TrendUpIcon width={18} height={18} />
                  </span>
                </div>

                {hikes.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {hikes.slice(0, 4).map(({ subscription, change }) => (
                      <li
                        key={subscription.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-paper/55 px-3 py-2.5"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ServiceAvatar category={subscription.category} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">
                              {subscription.name}
                            </span>
                            <span className="block text-[11px] font-medium text-ink-fixed/60">
                              since{" "}
                              {formatDate(
                                subscription.priceHistory[0]?.at ??
                                  subscription.nextRenewal,
                              )}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-ink-fixed px-2.5 py-1 text-[11px] font-bold text-paper">
                          +
                          <MoneyText
                            amount={change.delta}
                            currency={subscription.currency}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-ink-fixed/70">
                    Every plan is at the price you first recorded. Nice.
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-[2rem] bg-lime p-5 text-ink-fixed shadow-card sm:p-6">
                <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
                  Money kept
                </span>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex flex-col">
                    <MoneyText
                      amount={savings.annual}
                      currency={currency}
                      rounded
                      animate
                      className="font-display text-4xl leading-none font-extrabold tracking-[-0.06em]"
                    />
                    <span className="text-xs font-semibold text-ink-fixed/65">
                      a year from {savings.count} cancelled{" "}
                      {savings.count === 1 ? "plan" : "plans"}
                    </span>
                  </div>
                  <Mascot variant="wink" color="var(--color-paper)" size={74} />
                </div>
              </section>
            </div>
          </div>

          <SmartReviewSection
            subscriptions={active}
            displayCurrency={currency}
            fxToNgn={settings.fxToNgn}
            today={today}
            onSelect={openDetail}
          />

          <section className="flex flex-col gap-3 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
                  Categories
                </span>
                <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
                  All your categories
                </h2>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <li
                  key={category.category}
                  className="flex items-center gap-3 rounded-2xl bg-surface-soft px-3 py-2.5"
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: categoryColor(category.category) }}
                  >
                    <CategoryIcon
                      category={category.category}
                      width={17}
                      height={17}
                      className="text-ink-fixed"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">
                      {getCategory(category.category).label}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {Math.round(category.share * 100)}% of monthly spend
                    </span>
                  </span>
                  <span className="text-xs font-bold text-ink">
                    <MoneyText amount={category.monthly} currency={currency} rounded />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-1 pb-2 text-center text-xs text-muted">
            Totals use the exchange rates in Settings ·{" "}
            {formatMoney(Math.round(summary.annual), currency)} a year
          </p>
        </>
      )}
    </div>
  );
}
