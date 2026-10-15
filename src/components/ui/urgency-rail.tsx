import type { UrgencyTone } from "@/lib/domain/urgency";
import { urgencyRailClass } from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";

interface UrgencyRailProps {
  tone: UrgencyTone;
  className?: string;
}

export function UrgencyRail({ tone, className }: UrgencyRailProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("w-1 self-stretch rounded-full", urgencyRailClass(tone), className)}
    />
  );
}
