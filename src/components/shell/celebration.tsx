"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Confetti, Mascot } from "@/components/brand/mascot";
import { useToast } from "@/components/providers/toast-provider";
import { ShareCardDialog } from "@/components/share/share-card-dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { MoneyText } from "@/components/ui/money-text";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { todayIso } from "@/lib/domain/date";
import { formatDate } from "@/lib/domain/format";
import { annualAmount } from "@/lib/domain/spend";
import { getEffectiveAmount } from "@/lib/domain/subscription";
import type { Subscription } from "@/lib/domain/schema";

interface CelebrationOptions {
  onUndo?: () => void | Promise<void>;
}

interface CelebrationContextValue {
  celebrate: (subscription: Subscription, options?: CelebrationOptions) => void;
}

interface CelebrationState {
  subscription: Subscription;
  onUndo?: (() => void | Promise<void>) | undefined;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const dialogRef = useFocusTrap<HTMLDivElement>({
    enabled: celebration !== null,
    onEscape: () => setCelebration(null),
    initialFocus: "[data-autofocus]",
  });
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const closeShare = useCallback(() => setShareOpen(false), []);
  const subscription = celebration?.subscription ?? null;

  const celebrate = useCallback((next: Subscription, options?: CelebrationOptions) => {
    setShareOpen(false);
    setCelebration({ subscription: next, onUndo: options?.onUndo });
  }, []);

  const api = useMemo<CelebrationContextValue>(() => ({ celebrate }), [celebrate]);

  async function handleUndo() {
    const undo = celebration?.onUndo;
    if (!undo) {
      return;
    }
    try {
      await undo();
      setCelebration(null);
      showToast("Subscription restored", "success");
    } catch {
      showToast("Could not undo that just now.", "danger");
    }
  }

  const saved = subscription
    ? annualAmount(getEffectiveAmount(subscription), subscription.cycle)
    : 0;
  const urgency = subscription
    ? computeCancelWindow(subscription, new Date()).urgency
    : "safe";
  const timing =
    urgency === "today"
      ? "on the last safe day."
      : urgency === "missed" || urgency === "past"
        ? "before the next charge."
        : "with time to spare.";

  return (
    <CelebrationContext.Provider value={api}>
      {children}
      {subscription ? (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${subscription.name} cancelled`}
          className="fixed inset-0 z-[80] flex animate-fade-in flex-col overflow-x-hidden overflow-y-auto bg-lime px-6 pt-safe pb-safe text-ink-fixed"
        >
          <Confetti />
          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 py-8 text-center">
            <div className="relative">
              <span className="absolute inset-4 rounded-full bg-paper/40 blur-2xl" />
              <Mascot
                variant="party"
                color="var(--color-yellow)"
                size={240}
                className="relative animate-pop-in drop-shadow-[0_22px_24px_rgba(25,23,19,0.16)]"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-ink-fixed/70">
                Cancelled {subscription.name}. You just saved
              </p>
              <MoneyText
                amount={saved}
                currency={subscription.currency}
                rounded
                animate
                className="max-w-full font-display text-[clamp(2.5rem,14vw,4.25rem)] leading-[0.85] font-extrabold tracking-[-0.07em] sm:text-[5rem]"
              />
              <p className="max-w-[17rem] text-base leading-snug font-medium text-ink-fixed/80">
                a year, and you did it {timing}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-paper/60 px-4 py-2 text-sm font-bold">
              <CheckIcon width={16} height={16} strokeWidth={2.4} />
              {formatDate(todayIso())}
            </span>
          </div>

          <div className="relative mx-auto flex w-full max-w-md flex-col gap-3 pb-6">
            {celebration?.onUndo ? (
              <button
                type="button"
                onClick={() => void handleUndo()}
                className="mx-auto rounded-full px-4 py-2 text-sm font-bold text-ink-fixed/65 underline decoration-2 underline-offset-4 transition-colors hover:text-ink-fixed"
              >
                Undo cancel
              </button>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="fixed"
                size="lg"
                onClick={() => setShareOpen(true)}
                leadingIcon={<ShareIcon width={18} height={18} />}
              >
                Share image
              </Button>
              <Button
                variant="primary"
                size="lg"
                data-autofocus
                onClick={() => setCelebration(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {shareOpen && subscription ? (
        <ShareCardDialog
          subscription={subscription}
          mode="saved"
          defaultIncludeAmount
          onClose={closeShare}
        />
      ) : null}
    </CelebrationContext.Provider>
  );
}

export function useCelebration(): CelebrationContextValue {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
}
