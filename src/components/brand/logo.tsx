import { cn } from "@/lib/utils/cn";

interface BrandLogoProps {
  size?: number;
  className?: string | undefined;
  title?: string | undefined;
}

/**
 * The Undue mark: a calendar with a clean cancellation slash. It keeps the
 * brand's lime tile and ink outline while reading clearly at favicon size.
 */
export function BrandLogo({ size = 32, className, title }: BrandLogoProps) {
  const labelled = title !== undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="16" fill="var(--color-lime)" />
      <path
        d="M17 24a7 7 0 0 1 7-7h16a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7V24Z"
        fill="var(--color-paper)"
        stroke="var(--color-ink-fixed)"
        strokeWidth="4"
      />
      <path d="M17 27h30" stroke="var(--color-ink-fixed)" strokeWidth="4" />
      <path
        d="M24 13v8M40 13v8"
        stroke="var(--color-ink-fixed)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M24 44 43 25"
        stroke="var(--color-coral)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
