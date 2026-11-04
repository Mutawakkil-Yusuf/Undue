import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/brand/logo";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return <BrandLogo size={size} className={className} />;
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
