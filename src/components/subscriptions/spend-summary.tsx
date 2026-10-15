"use client";

import { useState } from "react";
import { MoneyText } from "@/components/ui/money-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { CurrencyCode } from "@/lib/domain/schema";
import type { SpendSummary } from "@/lib/domain/spend";

type Period = "monthly" | "annual";

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Yearly" },
] as const;

interface SpendSummaryCardProps {
  summary: SpendSummary;
  currency: CurrencyCode;
  activeCount: number;
}

export function SpendSummaryCard({
  summary,
  currency,
  activeCount,
}: SpendSummaryCardProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const amount = period === "monthly" ? summary.monthly : summary.annual;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            {period === "monthly" ? "You spend each month" : "You spend each year"}
          </span>
          <MoneyText
            amount={amount}
            currency={currency}
            rounded
            className="font-display text-3xl text-ink min-[420px]:text-4xl"
          />
          <span className="text-xs text-muted">
            across {activeCount} active{" "}
            {activeCount === 1 ? "subscription" : "subscriptions"}
          </span>
        </div>
      </div>
      <SegmentedControl
        ariaLabel="Spending period"
        options={PERIOD_OPTIONS}
        value={period}
        onChange={(next) => setPeriod(next)}
        className="max-w-56"
      />
    </section>
  );
}
