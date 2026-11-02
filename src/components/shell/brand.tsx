import { cn } from "@/lib/utils/cn";
import { Mascot } from "@/components/brand/mascot";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-lime)] ring-2 ring-ink",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Mascot variant="happy" color="var(--color-yellow)" size={size * 0.82} />
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl leading-none font-extrabold tracking-[-0.06em] text-ink",
        className,
      )}
    >
      Undue
      <span className="text-coral">.</span>
    </span>
  );
}
