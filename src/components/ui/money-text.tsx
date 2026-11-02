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
}

export function MoneyText({
  amount,
  currency,
  className,
  rounded = false,
  animate = false,
}: MoneyTextProps) {
  const counted = useCountUp(amount);
  const value = animate ? counted : amount;
  const formatted = rounded
    ? formatMoney(Math.round(value), currency)
    : formatMoney(value, currency);

  return <span className={cn("font-tabular", className)}>{formatted}</span>;
}
