"use client";

import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { TextInput } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { monthlyAmount, normalizeToDisplayCurrency } from "@/lib/domain/spend";
import { CATEGORIES } from "@/lib/domain/schema";
import type { CategoryId, CurrencyCode, Subscription } from "@/lib/domain/schema";
import type { FxToNgn } from "@/lib/domain/currency";
import {
  URGENCY_BUCKETS,
  URGENCY_BUCKET_LABELS,
  urgencyBucket,
} from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";
import { sortByUrgency } from "./subscription-list";
import { SubscriptionRow } from "./subscription-row";

type SortKey = "urgency" | "amount" | "name";

const SORT_OPTIONS = [
  { value: "urgency", label: "Urgency" },
  { value: "amount", label: "Cost" },
  { value: "name", label: "Name" },
] as const;

interface SubscriptionExplorerProps {
  subscriptions: readonly Subscription[];
  referenceDate: Date;
  onSelect: (subscription: Subscription) => void;
  displayCurrency: CurrencyCode;
  fxToNgn: FxToNgn;
}

export function SubscriptionExplorer({
  subscriptions,
  referenceDate,
  onSelect,
  displayCurrency,
  fxToNgn,
}: SubscriptionExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortKey>("urgency");

  const showControls = subscriptions.length >= 3;

  const presentCategories = useMemo(() => {
    const present = new Set(subscriptions.map((item) => item.category));
    return CATEGORIES.filter((option) => present.has(option.id));
  }, [subscriptions]);

  const monthlyOf = useMemo(() => {
    return (subscription: Subscription) =>
      monthlyAmount(
        normalizeToDisplayCurrency(subscription, displayCurrency, fxToNgn),
        subscription.cycle,
      );
  }, [displayCurrency, fxToNgn]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = subscriptions.filter((subscription) => {
      if (category !== "all" && subscription.category !== category) {
        return false;
      }
      if (needle.length > 0 && !subscription.name.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });

    if (sort === "urgency") {
      return sortByUrgency(filtered, referenceDate);
    }
    if (sort === "amount") {
      return [...filtered].sort((a, b) => monthlyOf(b) - monthlyOf(a));
    }
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [subscriptions, category, query, sort, monthlyOf, referenceDate]);

  const groups = useMemo(() => {
    if (sort !== "urgency") {
      return null;
    }
    return URGENCY_BUCKETS.map((bucket) => ({
      bucket,
      items: visible.filter(
        (subscription) =>
          urgencyBucket(computeCancelWindow(subscription, referenceDate).urgency) ===
          bucket,
      ),
    })).filter((group) => group.items.length > 0);
  }, [sort, visible, referenceDate]);

  return (
    <div className="flex flex-col gap-4">
      {showControls ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon
              width={18}
              height={18}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subscriptions…"
              aria-label="Search subscriptions"
              autoComplete="off"
              className="pl-10"
            />
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label="All"
            />
            {presentCategories.map((option) => (
              <FilterChip
                key={option.id}
                active={category === option.id}
                onClick={() => setCategory(option.id)}
                icon={<CategoryIcon category={option.id} width={14} height={14} />}
                label={option.label}
              />
            ))}
          </div>

          <SegmentedControl
            ariaLabel="Sort subscriptions"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-card border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          No subscriptions match that.
        </p>
      ) : groups ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.bucket} className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
                  {URGENCY_BUCKET_LABELS[group.bucket]}
                </h3>
                <span className="text-xs text-muted">{group.items.length}</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {group.items.map((subscription) => (
                  <li key={subscription.id}>
                    <SubscriptionRow
                      subscription={subscription}
                      referenceDate={referenceDate}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((subscription) => (
            <li key={subscription.id}>
              <SubscriptionRow
                subscription={subscription}
                referenceDate={referenceDate}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}

function FilterChip({ active, onClick, label, icon }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-ember bg-ember-soft text-ember-strong"
          : "border-line bg-surface text-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
