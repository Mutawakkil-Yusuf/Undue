"use client";

import { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { MoneyText } from "@/components/ui/money-text";
import { formatMoney } from "@/lib/domain/currency";
import {
  projectionMonthFullLabel,
  projectionMonthLabel,
  type ProjectedMonth,
} from "@/lib/domain/projection";
import type { CurrencyCode } from "@/lib/domain/schema";
import { useMeasuredWidth } from "@/lib/hooks/use-measured-width";

const CHART_HEIGHT = 128;
const LABEL_HEIGHT = 18;
const HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;
const MIN_BAR = 3;
const STUB = 2;

interface SpendBarsProps {
  months: readonly ProjectedMonth[];
  currency: CurrencyCode;
}

export function SpendBars({ months, currency }: SpendBarsProps) {
  const [containerRef, measuredWidth] = useMeasuredWidth<HTMLDivElement>();
  const [selected, setSelected] = useState(0);

  const max = useMemo(() => Math.max(1, ...months.map((month) => month.total)), [months]);
  const total = useMemo(
    () => months.reduce((sum, month) => sum + month.total, 0),
    [months],
  );

  const width = Math.max(measuredWidth, 200);
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: months.map((month) => month.month),
        range: [0, width],
        padding: 0.34,
      }),
    [months, width],
  );
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, max], range: [CHART_HEIGHT, 0], nice: true }),
    [max],
  );

  const active = months[selected] ?? months[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-ink">
          {active ? projectionMonthFullLabel(active.month) : ""}
        </span>
        <span className="text-sm text-muted">
          {active ? (
            <MoneyText amount={active.total} currency={currency} rounded />
          ) : null}
        </span>
      </div>

      <div ref={containerRef} className="w-full">
        {measuredWidth > 0 ? (
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Projected charges over ${months.length} months, totalling ${formatMoney(Math.round(total), currency)}`}
          >
            <line
              x1={0}
              x2={width}
              y1={CHART_HEIGHT}
              y2={CHART_HEIGHT}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <Group>
              {months.map((month, index) => {
                const bandX = xScale(month.month) ?? 0;
                const bandWidth = xScale.bandwidth();
                const height = Math.max(
                  month.total > 0 ? MIN_BAR : STUB,
                  CHART_HEIGHT - yScale(month.total),
                );
                const isSelected = index === selected;
                const fill =
                  month.total > 0
                    ? isSelected
                      ? "var(--color-ember-strong)"
                      : "var(--color-ember)"
                    : "var(--color-line-strong)";

                return (
                  <g key={month.month}>
                    <rect
                      x={bandX}
                      y={CHART_HEIGHT - height}
                      width={bandWidth}
                      height={height}
                      rx={Math.min(4, bandWidth / 2)}
                      fill={fill}
                      className="transition-colors"
                    />
                    <rect
                      x={bandX}
                      y={0}
                      width={bandWidth}
                      height={CHART_HEIGHT}
                      fill="transparent"
                      className="cursor-pointer"
                      onPointerEnter={() => setSelected(index)}
                      onPointerDown={() => setSelected(index)}
                      onClick={() => setSelected(index)}
                    />
                  </g>
                );
              })}
            </Group>
            <Group>
              {months.map((month) => (
                <text
                  key={month.month}
                  x={(xScale(month.month) ?? 0) + xScale.bandwidth() / 2}
                  y={CHART_HEIGHT + 13}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-muted)"
                >
                  {projectionMonthLabel(month.month)}
                </text>
              ))}
            </Group>
          </svg>
        ) : (
          <div style={{ height: HEIGHT }} aria-hidden="true" />
        )}
      </div>

      <p className="text-xs text-muted">
        Projected over {months.length} months:{" "}
        <MoneyText amount={total} currency={currency} rounded className="text-ink" />
      </p>

      <table className="sr-only">
        <caption>Projected charges by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.month}>
              <th scope="row">{projectionMonthFullLabel(month.month)}</th>
              <td>{formatMoney(Math.round(month.total), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
