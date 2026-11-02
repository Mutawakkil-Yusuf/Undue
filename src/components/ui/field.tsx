import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

const baseControlClasses = cn(
  "w-full rounded-2xl border px-4 text-base transition-colors focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const controlClasses = cn(
  baseControlClasses,
  "border-line bg-surface text-ink placeholder:text-muted/60 focus:border-ink",
);

const fixedControlClasses = cn(
  baseControlClasses,
  "border-transparent bg-paper text-ink-fixed placeholder:text-ink-fixed/35 focus:border-ink-fixed",
);

type ControlTone = "auto" | "fixed";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  labelClassName?: string | undefined;
  errorClassName?: string | undefined;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  labelClassName,
  errorClassName,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "text-[11px] font-bold tracking-[0.13em] uppercase",
          labelClassName ?? "text-muted",
        )}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className={cn("text-xs font-medium", errorClassName ?? "text-urgent")}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  tone = "auto",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { tone?: ControlTone }) {
  return (
    <input
      className={cn(tone === "fixed" ? fixedControlClasses : controlClasses, "h-12", className)}
      {...props}
    />
  );
}

export function TextArea({
  className,
  tone = "auto",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: ControlTone }) {
  return (
    <textarea
      className={cn(
        tone === "fixed" ? fixedControlClasses : controlClasses,
        "min-h-24 py-3",
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  children,
  tone = "auto",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { tone?: ControlTone }) {
  return (
    <select
      className={cn(
        tone === "fixed" ? fixedControlClasses : controlClasses,
        "h-12 appearance-none pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
