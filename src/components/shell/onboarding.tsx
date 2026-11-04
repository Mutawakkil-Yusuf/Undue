"use client";

import { useEffect, useState } from "react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { Mascot } from "@/components/brand/mascot";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, BellIcon, LockIcon, SparkleIcon } from "@/components/ui/icons";
import { useNotificationsSupported } from "@/lib/hooks/use-notifications";
import {
  requestNotificationPermission,
  setNotificationsEnabled,
} from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "undue-onboarded";
const STEPS = 3;

function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { showToast } = useToast();
  const supported = useNotificationsSupported();
  const dialogRef = useFocusTrap<HTMLDivElement>({
    enabled: open,
    onEscape: () => finish(),
    initialFocus: "button",
  });

  useEffect(() => {
    if (!hasOnboarded()) {
      const timer = window.setTimeout(() => setOpen(true), 320);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function handleReplay() {
      setStep(0);
      setOpen(true);
    }
    window.addEventListener("undue:show-intro", handleReplay);
    return () => window.removeEventListener("undue:show-intro", handleReplay);
  }, []);

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage can be unavailable in private mode; still close for this session.
    }
    setOpen(false);
  }

  async function enableReminders() {
    if (!supported) {
      showToast("Notifications are not supported on this device.", "danger");
      setStep(2);
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      showToast("Reminders are on. We'll only ping you when it matters.", "success");
      setStep(2);
    } else {
      showToast("You can turn reminders on later in Settings.", "danger");
      setStep(2);
    }
  }

  if (!open) {
    return null;
  }

  const onDark = step === 0;
  const onPaper = step === 1;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Undue"
      className={cn(
        "fixed inset-0 z-[90] flex flex-col overflow-x-hidden overflow-y-auto px-6 pt-safe pb-safe transition-colors duration-500 sm:px-8",
        step === 0 && "bg-dark text-paper",
        step === 1 && "bg-bone text-ink",
        step === 2 && "bg-sky text-ink-fixed",
      )}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between pt-4">
          <span
            className={cn(
              "font-display text-xl font-extrabold tracking-[-0.06em]",
              onDark ? "text-paper" : onPaper ? "text-ink" : "text-ink-fixed",
            )}
          >
            Undue<span className="text-coral">.</span>
          </span>
          <button
            type="button"
            onClick={finish}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors",
              onDark
                ? "text-paper/55 hover:bg-paper/10 hover:text-paper"
                : onPaper
                  ? "text-ink/55 hover:bg-ink/10 hover:text-ink"
                  : "text-ink-fixed/55 hover:bg-ink-fixed/10 hover:text-ink-fixed",
            )}
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
          {step === 0 ? <IntroSlide /> : null}
          {step === 1 ? <NudgeSlide /> : null}
          {step === 2 ? <PrivacySlide /> : null}
        </div>

        <div className="flex flex-col gap-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: STEPS }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === step
                      ? "w-8 bg-coral"
                      : onDark
                        ? "w-2 bg-paper/25"
                        : onPaper
                          ? "w-2 bg-ink/20"
                          : "w-2 bg-ink-fixed/20",
                  )}
                />
              ))}
            </div>

            {step === 0 ? (
              <Button
                variant="lime"
                size="lg"
                onClick={() => setStep(1)}
                trailingIcon={<ArrowRightIcon width={19} height={19} />}
              >
                Next
              </Button>
            ) : null}

            {step === 1 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-semibold text-ink/55 hover:text-ink"
                >
                  Not now
                </button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void enableReminders()}
                  trailingIcon={<ArrowRightIcon width={19} height={19} />}
                >
                  Turn on
                </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={finish}
                trailingIcon={<ArrowRightIcon width={19} height={19} />}
              >
                Get started
              </Button>
            ) : null}
          </div>

          <p
            className={cn(
              "text-center text-[11px]",
              onDark ? "text-paper/40" : onPaper ? "text-muted" : "text-ink-fixed/45",
            )}
          >
            Free forever · No account · Nothing leaves this device
          </p>
        </div>
      </div>
    </div>
  );
}

function IntroSlide() {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="relative flex h-[300px] w-full items-center justify-center">
        <span className="absolute size-56 rounded-full bg-lime/15 blur-2xl" />
        <FloatingCard
          name="Netflix"
          meta="Last day today"
          className="absolute top-2 left-0 -rotate-6 bg-coral"
        />
        <FloatingCard
          name="DStv"
          meta="5 days left"
          className="absolute top-8 right-0 rotate-6 bg-yellow"
        />
        <FloatingCard
          name="Spotify"
          meta="17 days left"
          className="absolute bottom-0 left-4 rotate-3 bg-lime"
        />
        <div className="relative flex size-40 items-center justify-center rounded-full bg-paper ring-[6px] ring-paper/15 min-[360px]:size-48">
          <Mascot
            variant="happy"
            color="var(--color-lime)"
            size={132}
            className="min-[360px]:hidden"
          />
          <Mascot
            variant="happy"
            color="var(--color-lime)"
            size={156}
            className="hidden min-[360px]:block"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[2.75rem] leading-[0.92] font-extrabold tracking-[-0.06em] text-balance">
          Know the last day to cancel.
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-paper/60">
          Undue counts back from every charge, so you never pay for what you meant to
          cancel.
        </p>
      </div>
    </div>
  );
}

function FloatingCard({
  name,
  meta,
  className,
}: {
  name: string;
  meta: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "flex min-w-[112px] flex-col gap-0.5 rounded-2xl px-3 py-2.5 text-left text-ink-fixed shadow-float ring-2 ring-ink-fixed/10 min-[360px]:min-w-[128px] min-[360px]:px-4 min-[360px]:py-3",
        className,
      )}
    >
      <span className="font-display text-lg leading-none font-extrabold tracking-[-0.04em]">
        {name}
      </span>
      <span className="text-[11px] font-medium text-ink-fixed/70">{meta}</span>
    </span>
  );
}

function NudgeSlide() {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="flex w-full items-center gap-3 rounded-[1.4rem] bg-paper px-4 py-3 text-left shadow-float ring-1 ring-ink-fixed/5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-coral">
          <Mascot variant="alarmed" color="var(--color-yellow)" size={34} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-bold tracking-[0.12em] text-ink-fixed/45 uppercase">
            Undue · now
          </span>
          <span className="text-sm leading-snug font-semibold text-ink-fixed">
            Netflix: today is your last day to cancel.
          </span>
        </div>
      </div>

      <div className="relative flex size-60 items-center justify-center rounded-full bg-yellow">
        <Mascot variant="happy" color="var(--color-paper)" size={176} />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[2.65rem] leading-[0.92] font-extrabold tracking-[-0.06em] text-balance">
          One nudge, on the right day.
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
          Undue only pings you when a cancel window is about to close. You can also export
          deadlines to your calendar, so reminders work even when Undue is closed.
        </p>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-fixed">
        <BellIcon width={14} height={14} />
        You can turn this off any time
      </span>
    </div>
  );
}

function PrivacySlide() {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="relative flex size-60 items-center justify-center rounded-full bg-paper ring-[6px] ring-ink-fixed/10">
        <Mascot variant="wink" color="var(--color-lavender)" size={176} />
        <span className="absolute -top-2 -right-2 flex size-12 items-center justify-center rounded-full bg-lime ring-2 ring-ink-fixed">
          <LockIcon width={22} height={22} />
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[2.65rem] leading-[0.92] font-extrabold tracking-[-0.06em] text-balance">
          Nothing leaves this device.
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-fixed/65">
          No account, no server. Your subscriptions live in this browser, and you can
          export a backup whenever you want.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {["No account", "No server", "Export anytime"].map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper/70 px-3 py-1.5 text-xs font-semibold text-ink-fixed"
          >
            <SparkleIcon width={13} height={13} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
