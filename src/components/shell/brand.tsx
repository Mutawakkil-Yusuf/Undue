import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Undue"
      className={className}
    >
      <circle
        cx="16"
        cy="16"
        r="11.5"
        stroke="var(--color-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="58 14.5"
        transform="rotate(-38 16 16)"
      />
      <path
        d="M16 3.2v3.4"
        stroke="var(--color-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="26.2" cy="8.6" r="3.1" fill="var(--color-ember)" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl leading-none tracking-tight text-ink",
        className,
      )}
    >
      Un
      <span className="relative inline-block">
        due
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 rounded-full bg-ember"
        />
      </span>
    </span>
  );
}
