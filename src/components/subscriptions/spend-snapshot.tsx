"use client";

import Link from "next/link";
import { MoneyText } from "@/components/ui/money-text";
import { ArrowRightIcon } from "@/components/ui/icons";
import { categoryColor, CategoryIcon } from "@/components/ui/category-icon";
import { getCategory, type CurrencyCode } from "@/lib/domain/schema";
import type { CategorySpend, SpendSummary } from "@/lib/domain/spend";
import { cn } from "@/lib/utils/cn";

type Period = "monthly" | "annual";

interface SpendSnapshotProps {
  summary: SpendSummary;
  categories: readonly CategorySpend[];
  currency: CurrencyCode;
  activeCount: number;
  period: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
}

export function SpendSnapshot({
  summary,
  categories,
  currency,
  activeCount,
  period,
  onPeriodChange,
  className,
}: SpendSnapshotProps) {
  const amount = period === "monthly" ? summary.monthly : summary.annual;
  const top = categories.slice(0, 3);
  const total = categories.reduce((sum, category) => sum + category.monthly, 0);

  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
            Your spend
          </span>
          <MoneyText
            amount={amount}
            currency={currency}
            rounded
            animate
            className="font-display text-4xl leading-none font-extrabold tracking-[-0.06em] text-ink sm:text-5xl"
          />
          <span className="text-xs text-muted">
            {period === "monthly" ? "each month" : "each year"} across {activeCount}{" "}
            {activeCount === 1 ? "plan" : "plans"}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-full bg-surface-soft p-1">
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPeriodChange(option)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors",
                period === option
                  ? "bg-ink text-bone"
                  : "text-muted hover:text-ink",
              )}
            >
              {option === "monthly" ? "Mo" : "Yr"}
            </button>
          ))}
        </div>
      </div>

      {top.length > 0 ? (
        <div className="flex flex-col gap-3">
          {top.map((category) => {
            const share = total > 0 ? category.monthly / total : 0;
            return (
              <div key={category.category} className="flex items-center gap-2.5">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: categoryColor(category.category) }}
                >
                  <CategoryIcon
                    category={category.category}
                    width={14}
                    height={14}
                    className="text-ink-fixed"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
                  {getCategory(category.category).label}
                </span>
                <span className="w-9 text-right text-[11px] font-semibold text-muted">
                  {Math.round(share * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-ink transition-colors hover:text-coral"
      >
        See insights
        <ArrowRightIcon width={16} height={16} />
      </Link>
    </section>
  );
}
