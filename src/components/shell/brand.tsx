import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/brand/logo-mark";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return <LogoMark size={size} className={cn("shrink-0", className)} />;
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
