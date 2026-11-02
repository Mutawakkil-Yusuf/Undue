"use client";

import { useState } from "react";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";
import { categoryColor, CategoryIcon } from "@/components/ui/category-icon";
import { MoneyText } from "@/components/ui/money-text";
import { formatMoney } from "@/lib/domain/currency";
import { getCategory, type CategoryId, type CurrencyCode } from "@/lib/domain/schema";
import type { CategorySpend } from "@/lib/domain/spend";

const SIZE = 200;
const RADIUS = SIZE / 2;
const OUTER = RADIUS - 2;
const INNER = OUTER - 28;

interface CategoryDonutProps {
  data: readonly CategorySpend[];
  currency: CurrencyCode;
}

interface Segment {
  category: CategoryId;
  monthly: number;
  annual: number;
  share: number;
}

export function CategoryDonut({ data, currency }: CategoryDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const segments: Segment[] = data.map((item) => ({
    category: item.category,
    monthly: item.monthly,
    annual: item.annual,
    share: item.share,
  }));

  const total = segments.reduce((sum, segment) => sum + segment.monthly, 0);
  const focused = active !== null ? segments[active] : undefined;

  if (segments.length === 0 || total <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 min-[460px]:flex-row min-[460px]:items-center">
      <div className="relative mx-auto shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label="Monthly spend split by category"
          className="overflow-visible"
        >
          <Group top={RADIUS} left={RADIUS}>
            <Pie
              data={segments}
              pieValue={(segment) => segment.monthly}
              outerRadius={OUTER}
              innerRadius={INNER}
              cornerRadius={6}
              padAngle={0.03}
            >
              {({ arcs, path }) =>
                arcs.map((arc, index) => (
                  <path
                    key={arc.data.category}
                    d={path(arc) ?? undefined}
                    fill={categoryColor(arc.data.category)}
                    opacity={active === null || active === index ? 1 : 0.35}
                    className="transition-opacity duration-200"
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                  />
                ))
              }
            </Pie>
          </Group>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
            {focused ? getCategory(focused.category).label : "Each month"}
          </span>
          <MoneyText
            amount={focused ? focused.monthly : total}
            currency={currency}
            rounded
            className="font-display text-2xl font-extrabold tracking-[-0.05em] text-ink"
          />
          {focused ? (
            <span className="text-[11px] font-semibold text-muted">
              {Math.round(focused.share * 100)}%
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-muted">
              {segments.length} {segments.length === 1 ? "category" : "categories"}
            </span>
          )}
        </div>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-1">
        {segments.map((segment, index) => (
          <li key={segment.category}>
            <button
              type="button"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((current) => (current === index ? null : index))}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-soft active:bg-surface-soft"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: categoryColor(segment.category) }}
              >
                <CategoryIcon
                  category={segment.category}
                  width={14}
                  height={14}
                  className="text-ink-fixed"
                />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {getCategory(segment.category).label}
              </span>
              <span className="shrink-0 text-xs font-bold text-ink">
                <MoneyText amount={segment.monthly} currency={currency} rounded />
              </span>
              <span className="w-8 shrink-0 text-right font-tabular text-[11px] font-semibold text-muted">
                {Math.round(segment.share * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Monthly spend by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Monthly</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.category}>
              <th scope="row">{getCategory(segment.category).label}</th>
              <td>{formatMoney(Math.round(segment.monthly), currency)}</td>
              <td>{Math.round(segment.share * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
