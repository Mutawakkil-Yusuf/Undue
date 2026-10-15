"use client";

import dynamic from "next/dynamic";
import { ChartCard } from "@/components/charts/chart-card";
import type { ProjectedMonth } from "@/lib/domain/projection";
import type { CategorySpend } from "@/lib/domain/spend";
import type { CurrencyCode } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

const CategoryDonut = dynamic(
  () => import("@/components/charts/category-donut").then((mod) => mod.CategoryDonut),
  {
    ssr: false,
    loading: () => <ChartSkeleton className="h-52" />,
  },
);

const SpendBars = dynamic(
  () => import("@/components/charts/spend-bars").then((mod) => mod.SpendBars),
  {
    ssr: false,
    loading: () => <ChartSkeleton className="h-44" />,
  },
);

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-card bg-bone/70", className)}
    />
  );
}

interface InsightsSectionProps {
  categories: readonly CategorySpend[];
  months: readonly ProjectedMonth[];
  currency: CurrencyCode;
}

export function InsightsSection({ categories, months, currency }: InsightsSectionProps) {
  const hasCategories = categories.length > 0;
  const hasMonths = months.some((month) => month.total > 0);

  return (
    <>
      {hasCategories ? (
        <ChartCard
          label="Where it goes"
          title="Monthly spend by category"
          description="Tap a category to see its share."
        >
          <CategoryDonut data={categories} currency={currency} />
        </ChartCard>
      ) : null}
      {hasMonths ? (
        <ChartCard
          label="What is coming"
          title="Charges over the next 12 months"
          description="Tap a bar for that month's total."
        >
          <SpendBars months={months} currency={currency} />
        </ChartCard>
      ) : null}
    </>
  );
}
