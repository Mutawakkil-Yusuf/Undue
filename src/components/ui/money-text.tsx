import { formatMoney } from "@/lib/domain/currency";
import type { CurrencyCode } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

interface MoneyTextProps {
  amount: number;
  currency: CurrencyCode;
  className?: string;
  rounded?: boolean;
}

export function MoneyText({
  amount,
  currency,
  className,
  rounded = false,
}: MoneyTextProps) {
  const formatted = rounded
    ? formatMoney(Math.round(amount), currency)
    : formatMoney(amount, currency);

  return <span className={cn("font-tabular", className)}>{formatted}</span>;
}
