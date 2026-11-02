import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type MascotVariant =
  | "happy"
  | "calm"
  | "alarmed"
  | "sleepy"
  | "party"
  | "wink";

interface MascotProps {
  variant?: MascotVariant;
  color?: string;
  size?: number;
  className?: string;
  title?: string | undefined;
  style?: CSSProperties;
}

const INK = "#191713";
const CHEEK = "#ff9d8d";
const SWEAT = "#93baf8";

export function Mascot({
  variant = "happy",
  color = "var(--color-lime)",
  size = 120,
  className,
  title,
  style,
}: MascotProps) {
  const labelled = title !== undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      className={cn("overflow-visible", className)}
      style={style}
    >
      {/* antennae */}
      <path
        d="M46 34V17"
        stroke={INK}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M94 34V17"
        stroke={INK}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {variant === "party" ? (
        <g>
          <path
            d="M76 33 92 2l17 31Z"
            fill="var(--color-coral)"
            stroke={INK}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <circle
            cx="92"
            cy="3"
            r="7"
            fill="var(--color-yellow)"
            stroke={INK}
            strokeWidth="5"
          />
        </g>
      ) : null}

      {/* head */}
      <rect
        x="23"
        y="32"
        width="94"
        height="86"
        rx="31"
        fill={color}
        stroke={INK}
        strokeWidth="7"
      />

      {variant === "sleepy" ? (
        <g stroke={INK} strokeWidth="6" strokeLinecap="round">
          <path d="M43 69q9 8 18 0" />
          <path d="M79 69q9 8 18 0" />
        </g>
      ) : variant === "alarmed" ? (
        <g>
          <circle cx="52" cy="69" r="12" fill="var(--color-paper)" stroke={INK} strokeWidth="4" />
          <circle cx="88" cy="69" r="12" fill="var(--color-paper)" stroke={INK} strokeWidth="4" />
          <circle cx="53" cy="70" r="5.5" fill={INK} />
          <circle cx="89" cy="70" r="5.5" fill={INK} />
          <circle cx="55" cy="67" r="1.8" fill="var(--color-paper)" />
          <circle cx="91" cy="67" r="1.8" fill="var(--color-paper)" />
          <path
            d="M44 53q8-5 16-1M80 52q8-4 16 1"
            stroke={INK}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <ellipse cx="70" cy="97" rx="8" ry="10" fill={INK} />
          <path
            d="M116 58c0 6-8 14-8 14s-8-8-8-14a8 8 0 1 1 16 0Z"
            fill={SWEAT}
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g>
          {variant === "wink" ? (
            <path
              d="M43 69q9 8 18 0"
              stroke={INK}
              strokeWidth="6"
              strokeLinecap="round"
            />
          ) : (
            <g>
              <ellipse cx="52" cy="68" rx="7" ry="9" fill={INK} />
              <circle cx="54.5" cy="64.5" r="2.6" fill="var(--color-paper)" />
            </g>
          )}
          <g>
            <ellipse cx="88" cy="68" rx="7" ry="9" fill={INK} />
            <circle cx="90.5" cy="64.5" r="2.6" fill="var(--color-paper)" />
          </g>
        </g>
      )}

      {variant === "alarmed" ? null : variant === "sleepy" ? (
        <ellipse cx="70" cy="94" rx="5" ry="6.5" fill={INK} />
      ) : variant === "party" ? (
        <path
          d="M54 88q16 17 32 0"
          stroke={INK}
          strokeWidth="6"
          strokeLinecap="round"
          fill="var(--color-coral)"
        />
      ) : (
        <path
          d="M56 90q14 12 28 0"
          stroke={INK}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}

      {/* cheeks */}
      {variant === "alarmed" ? null : (
        <g opacity="0.62">
          <circle cx="38" cy="88" r="8" fill={CHEEK} />
          <circle cx="102" cy="88" r="8" fill={CHEEK} />
        </g>
      )}
    </svg>
  );
}

export function MascotAvatar({
  variant = "happy",
  color = "var(--color-yellow)",
  size = 48,
  className,
  title,
}: {
  variant?: MascotVariant;
  color?: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-paper)] ring-2 ring-ink",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Mascot variant={variant} color={color} size={size * 0.78} title={title} />
    </span>
  );
}

export function Confetti({ className }: { className?: string }) {
  const pieces = [
    { left: "6%", delay: "0s", drift: "-20px", color: "var(--color-coral)", size: 10 },
    { left: "16%", delay: "1.1s", drift: "18px", color: "var(--color-sky)", size: 8 },
    { left: "28%", delay: "0.4s", drift: "-14px", color: "var(--color-yellow)", size: 12 },
    { left: "42%", delay: "1.6s", drift: "26px", color: "var(--color-lavender)", size: 9 },
    { left: "56%", delay: "0.2s", drift: "-24px", color: "var(--color-coral)", size: 11 },
    { left: "68%", delay: "1.3s", drift: "16px", color: "var(--color-yellow)", size: 8 },
    { left: "80%", delay: "0.7s", drift: "-18px", color: "var(--color-sky)", size: 12 },
    { left: "92%", delay: "1.8s", drift: "22px", color: "var(--color-lavender)", size: 9 },
  ] as const;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece absolute top-0 block rounded-[3px]"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            animation: `confetti-fall ${3.2 + (index % 3) * 0.7}s ${piece.delay} linear infinite`,
            ["--drift" as string]: piece.drift,
          }}
        />
      ))}
    </div>
  );
}
