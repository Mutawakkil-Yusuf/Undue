interface LogoMarkProps {
  size?: number;
  /** Rounded tile (default). Turn off for icons the platform masks itself. */
  rounded?: boolean;
  className?: string;
  title?: string;
}

/**
 * The Undue logo: a calendar with the date struck through. It uses fixed hex
 * colors (not theme variables) so it looks the same in light and dark mode and
 * can also be rendered by the image generator for the Apple icon and link
 * previews.
 */
export function LogoMark({ size = 32, rounded = true, className, title }: LogoMarkProps) {
  const labelled = title !== undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      className={className}
    >
      <rect width="512" height="512" rx={rounded ? 130 : 0} fill="#bde66a" />
      <rect
        x="136"
        y="136"
        width="240"
        height="256"
        rx="56"
        fill="#fdfbf7"
        stroke="#191713"
        strokeWidth="32"
      />
      <path d="M152 216H360" stroke="#191713" strokeWidth="32" />
      <path
        d="M191.5 104V167M319.5 104V167"
        stroke="#191713"
        strokeWidth="32"
        strokeLinecap="round"
      />
      <path
        d="M192 351 343 200"
        stroke="#ff6b5a"
        strokeWidth="48"
        strokeLinecap="round"
      />
    </svg>
  );
}
