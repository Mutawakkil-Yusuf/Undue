"use client";

import { formatMoney } from "@/lib/domain/currency";
import type { CurrencyCode } from "@/lib/domain/schema";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { cn } from "@/lib/utils/cn";

interface MoneyTextProps {
  amount: number;
  currency: CurrencyCode;
  className?: string;
  rounded?: boolean;
  animate?: boolean;
  /** Start the count-up from zero instead of the current value. */
  countFromZero?: boolean;
}

export function MoneyText({
  amount,
  currency,
  className,
  rounded = false,
  animate = false,
  countFromZero = false,
}: MoneyTextProps) {
  const counted = useCountUp(amount, 650, countFromZero);
  const value = animate ? counted : amount;
  const formatted = rounded
    ? formatMoney(Math.round(value), currency)
    : formatMoney(value, currency);

  return <span className={cn("font-tabular", className)}>{formatted}</span>;
}
