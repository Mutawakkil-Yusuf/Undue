"use client";

import Link from "next/link";
import { useToast } from "@/components/providers/toast-provider";
import { MoneyText } from "@/components/ui/money-text";
import { AlertIcon, CheckIcon, CloseIcon, TrendUpIcon } from "@/components/ui/icons";
import { setSubscriptionDecision } from "@/lib/db/subscriptions";
import {
  detectPaymentRisks,
  detectPriceMoves,
  findOverlappingGroups,
  findStaleUnsurePlans,
  upcomingCashNeed,
} from "@/lib/domain/smart";
import { getCategory, type Subscription, type CurrencyCode } from "@/lib/domain/schema";
import type { FxToNgn } from "@/lib/domain/currency";

interface SmartProps {
  subscriptions: readonly Subscription[];
  displayCurrency: CurrencyCode;
  fxToNgn: FxToNgn;
  today: Date;
  onSelect?: ((subscription: Subscription) => void) | undefined;
}

function chargeDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function pctText(pct: number | null): string {
  return pct === null ? "increased" : `+${Math.round(pct * 100)}%`;
}

/** A compact but meaningful alert strip for the dashboard. */
export function SmartDashboardAlert({
  subscriptions,
  displayCurrency,
  fxToNgn,
  today,
}: SmartProps) {
  const cash = upcomingCashNeed(subscriptions, {
    now: today,
    days: 7,
    displayCurrency,
    fxToNgn,
  });
  const moves = detectPriceMoves(subscriptions);
  const overlaps = findOverlappingGroups(subscriptions, displayCurrency, fxToNgn);
  const risks = detectPaymentRisks(subscriptions, today);
  const dueThisWeek = risks.filter((risk) => risk.daysUntilCharge <= 7);

  if (cash.charges.length === 0 && moves.length === 0 && overlaps.length === 0) {
    return null;
  }

  return (
    <Link
      href="/insights#smart-review"
      className="block rounded-[1.5rem] border border-line bg-surface-soft p-4 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none"
      aria-label="Open smart review"
    >
      <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.13em] text-coral-ink uppercase">
        <AlertIcon width={13} height={13} />
        Smart review
      </span>

      {cash.charges.length > 0 ? (
        <span className="mt-2 block">
          <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.05em] text-ink">
            <MoneyText amount={cash.amount} currency={displayCurrency} />
          </span>
          <span className="mt-1 block text-xs leading-relaxed font-semibold text-muted">
            leaves your account in the next 7 days
            {cash.largest ? `; largest is ${cash.largest.name}` : ""}.
          </span>
          {dueThisWeek.length > 0 ? (
            <span className="mt-2 inline-flex items-center rounded-full bg-urgent-soft px-2.5 py-1 text-[11px] font-bold text-urgent">
              {dueThisWeek.length} failed last charge{dueThisWeek.length === 1 ? "" : "s"}{" "}
              due this week
            </span>
          ) : null}
        </span>
      ) : null}

      {moves.length > 0 || overlaps.length > 0 ? (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {overlaps.slice(0, 2).map((group) => (
            <span
              key={group.category}
              className="inline-flex items-center rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink"
            >
              {group.count} {getCategory(group.category).label.toLowerCase()} ·{" "}
              <MoneyText amount={group.monthly} currency={displayCurrency} />
            </span>
          ))}
          {moves.slice(0, 2).map((move) => (
            <span
              key={move.subscription.id}
              className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-bold text-urgent"
            >
              <TrendUpIcon width={11} height={11} />
              {move.subscription.name} {pctText(move.change.pct)}
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}

/** Detailed, actionable smart review for /insights. */
export function SmartReviewSection({
  subscriptions,
  displayCurrency,
  fxToNgn,
  today,
  onSelect,
}: SmartProps) {
  const { showToast } = useToast();
  const cash = upcomingCashNeed(subscriptions, {
    now: today,
    days: 7,
    displayCurrency,
    fxToNgn,
  });
  const overlaps = findOverlappingGroups(subscriptions, displayCurrency, fxToNgn);
  const moves = detectPriceMoves(subscriptions);
  const risks = detectPaymentRisks(subscriptions, today);
  const unsure = findStaleUnsurePlans(subscriptions, {
    now: today,
    olderThanDays: 30,
    displayCurrency,
    fxToNgn,
  });

  async function decide(subscription: Subscription, decision: "keep" | "cut" | "unsure") {
    try {
      await setSubscriptionDecision(subscription.id, decision);
      showToast(
        decision === "unsure"
          ? `${subscription.name} stays on the review list`
          : `${subscription.name} marked ${decision === "keep" ? "Keep" : "Cut"}`,
        "success",
      );
    } catch {
      showToast("Could not save that decision", "danger");
    }
  }

  const hasAnything =
    cash.charges.length > 0 ||
    overlaps.length > 0 ||
    moves.length > 0 ||
    risks.length > 0 ||
    unsure.length > 0;

  return (
    <section
      id="smart-review"
      className="scroll-mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.13em] text-coral-ink uppercase">
            Smart review
          </span>
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
            What deserves a decision
          </h2>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted">
          Rules over your own data — nothing leaves this device.
        </p>
      </div>

      {!hasAnything ? (
        <p className="mt-5 rounded-2xl bg-surface-soft p-5 text-center text-sm text-muted">
          Nothing needs a decision right now. Your next review is after the next price
          change, trial conversion, or renewal.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-[1.5rem] bg-surface-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-ink">Money needed this week</h3>
              <MoneyText
                amount={cash.amount}
                currency={displayCurrency}
                className="text-sm font-extrabold"
              />
            </div>
            {cash.charges.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {cash.charges.slice(0, 6).map((charge) => (
                  <li
                    key={`${charge.subscriptionId}-${charge.date}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 truncate text-muted">
                      {chargeDateLabel(charge.date)} · {charge.name}
                    </span>
                    <MoneyText
                      amount={charge.amount}
                      currency={displayCurrency}
                      className="shrink-0 font-bold text-ink"
                    />
                  </li>
                ))}
                {cash.charges.length > 6 ? (
                  <li className="text-[11px] font-semibold text-muted">
                    +{cash.charges.length - 6} more this week
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing due in the next 7 days.</p>
            )}
            {risks.length > 0 ? (
              <div className="rounded-2xl border border-urgent/20 bg-urgent-soft p-3 text-xs leading-relaxed font-semibold text-urgent">
                {risks.length} plan{risks.length === 1 ? "" : "s"} with a failed or
                declined last charge — check the card before the next renewal.
              </div>
            ) : null}
          </div>

          {overlaps.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-surface-soft p-4">
              <h3 className="text-sm font-bold text-ink">Overlapping plans</h3>
              {overlaps.slice(0, 4).map((group) => (
                <div key={group.category} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-ink">
                      {group.count} {getCategory(group.category).label.toLowerCase()}
                    </span>
                    <span className="text-xs font-bold text-muted">
                      <MoneyText amount={group.monthly} currency={displayCurrency} /> / mo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) =>
                      onSelect ? (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const subscription = subscriptions.find(
                              (entry) => entry.id === item.id,
                            );
                            if (subscription) {
                              onSelect(subscription);
                            }
                          }}
                          className="rounded-full bg-surface px-2 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-line"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <span
                          key={item.id}
                          className="rounded-full bg-surface px-2 py-1 text-[11px] font-bold text-ink"
                        >
                          {item.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {unsure.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-surface-soft p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">Unsure for a month+</h3>
                <MoneyText
                  amount={unsure.reduce((sum, item) => sum + item.annual, 0)}
                  currency={displayCurrency}
                  className="text-xs font-extrabold text-coral-ink"
                />
              </div>
              <ul className="flex flex-col gap-2">
                {unsure.slice(0, 5).map((item) => (
                  <li
                    key={item.subscription.id}
                    className="flex flex-col gap-2 rounded-2xl bg-surface p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-bold text-ink">
                        {item.subscription.name}
                      </span>
                      <MoneyText
                        amount={item.monthly}
                        currency={displayCurrency}
                        className="shrink-0 text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void decide(item.subscription, "keep")}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full bg-safe-soft px-3 text-[11px] font-bold text-safe"
                      >
                        <CheckIcon width={12} height={12} />
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => void decide(item.subscription, "cut")}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full bg-urgent-soft px-3 text-[11px] font-bold text-urgent"
                      >
                        <CloseIcon width={12} height={12} />
                        Cut
                      </button>
                      <button
                        type="button"
                        onClick={() => void decide(item.subscription, "unsure")}
                        className="min-h-8 rounded-full px-3 text-[11px] font-bold text-muted hover:text-ink"
                      >
                        Still unsure
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {moves.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-surface-soft p-4">
              <h3 className="text-sm font-bold text-ink">Price moves</h3>
              <ul className="flex flex-col gap-2">
                {moves.slice(0, 5).map((move) => (
                  <li key={move.subscription.id}>
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(move.subscription)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-3 py-2.5 text-left"
                      >
                        <span className="min-w-0 truncate text-xs font-bold text-ink">
                          {move.subscription.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-extrabold text-urgent">
                          {pctText(move.change.pct)}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-3 py-2.5">
                        <span className="truncate text-xs font-bold text-ink">
                          {move.subscription.name}
                        </span>
                        <span className="text-[11px] font-extrabold text-urgent">
                          {pctText(move.change.pct)}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
