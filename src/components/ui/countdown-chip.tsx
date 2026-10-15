import type { CancelWindow } from "@/lib/domain/cancel-by";
import { formatCountdown } from "@/lib/domain/format";
import { getUrgencyPresentation, urgencySurfaceClass } from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";

interface CountdownChipProps {
  window: CancelWindow;
  className?: string;
}

const TERMINAL_LABELS: Partial<Record<CancelWindow["urgency"], string>> = {
  missed: "Window passed",
  past: "Renewed",
};

export function CountdownChip({ window, className }: CountdownChipProps) {
  const presentation = getUrgencyPresentation(window.urgency);
  const terminal = TERMINAL_LABELS[window.urgency];
  const label = terminal ?? formatCountdown(window.daysUntilCancelBy);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-tabular text-xs font-medium",
        urgencySurfaceClass(presentation.tone),
        className,
      )}
    >
      {label}
    </span>
  );
}
