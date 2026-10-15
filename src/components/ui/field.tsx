import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

export const controlClasses = cn(
  "w-full rounded-field border border-line bg-surface px-3.5 text-base text-ink",
  "placeholder:text-muted/70",
  "focus:border-ember focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted uppercase"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-urgent">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, "h-11", className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlClasses, "min-h-20 py-2.5", className)} {...props} />
  );
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "h-11 appearance-none", className)} {...props}>
      {children}
    </select>
  );
}
