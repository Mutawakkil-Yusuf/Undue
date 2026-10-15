"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "default" | "success" | "danger";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction | undefined;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CLASSES: Record<ToastTone, string> = {
  default: "bg-ink text-bone",
  success: "bg-safe text-white",
  danger: "bg-urgent text-white",
};

const TOAST_DURATION_MS = 3200;
const TOAST_ACTION_DURATION_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      tone: ToastTone = "default",
      action: ToastAction | undefined = undefined,
    ) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, tone, action }]);
      const duration = action ? TOAST_ACTION_DURATION_MS : TOAST_DURATION_MS;
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-clear-fab z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => {
          const classes = cn(
            "pointer-events-auto flex max-w-sm animate-sheet-in items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium shadow-sheet",
            TONE_CLASSES[toast.tone],
          );

          if (!toast.action) {
            return (
              <button
                key={toast.id}
                type="button"
                onClick={() => dismiss(toast.id)}
                className={classes}
              >
                {toast.message}
              </button>
            );
          }

          return (
            <div key={toast.id} className={classes}>
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
                className="shrink-0 rounded-full font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
              >
                {toast.action.label}
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
