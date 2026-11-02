import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger"
  | "lime"
  | "white"
  | "fixed";
type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-bone hover:bg-ink/90 active:bg-ink/80",
  accent: "bg-coral text-ink-fixed hover:bg-coral-strong active:bg-coral-strong",
  secondary:
    "bg-surface text-ink border border-line hover:border-line-strong active:bg-surface-soft",
  ghost: "bg-transparent text-ink hover:bg-line/60 active:bg-line",
  danger:
    "bg-urgent-soft text-urgent hover:bg-urgent hover:text-paper dark:hover:text-ink-fixed",
  lime: "bg-lime text-ink-fixed hover:bg-lime/90 active:bg-lime/80",
  white: "bg-paper text-ink-fixed hover:bg-paper-soft active:bg-paper-soft",
  fixed:
    "border border-ink-fixed/30 bg-transparent text-ink-fixed hover:bg-paper/30 active:bg-paper/40",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-1.5 text-sm gap-1.5",
  md: "min-h-11 px-5 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-6 py-3 text-base gap-2",
  xl: "min-h-14 px-7 py-3.5 text-lg gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em]",
        "transition-[background-color,transform,color,box-shadow] duration-200 ease-out",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
