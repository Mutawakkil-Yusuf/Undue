"use client";

import { useRef, useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { useAppData } from "@/components/providers/app-data-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRightIcon,
  AutoIcon,
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldIcon,
  SparkleIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { updateSettings } from "@/lib/db/settings";
import {
  createBackup,
  eraseAll,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from "@/lib/db/backup";
import { useSubscriptions } from "@/lib/db/hooks";
import { CURRENCY_CODES, type AppSettings, type CurrencyCode } from "@/lib/domain/schema";
import { todayIso } from "@/lib/domain/date";
import { buildCalendar, CALENDAR_MIME_TYPE, calendarFilename } from "@/lib/domain/ics";
import {
  useNotificationsEnabled,
  useNotificationsSupported,
} from "@/lib/hooks/use-notifications";
import {
  requestNotificationPermission,
  setNotificationsEnabled,
} from "@/lib/notifications/notifications";
import { THEMES, THEME_LABELS, type Theme } from "@/lib/theme/theme";
import { downloadTextFile } from "@/lib/utils/download";
import { vibrate } from "@/lib/utils/haptics";
import { cn } from "@/lib/utils/cn";

const THEME_ICONS: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: AutoIcon,
};

interface SettingsDraft {
  displayCurrency: CurrencyCode;
  defaultLeadDays: number;
  usd: string;
  gbp: string;
}

function toDraft(settings: AppSettings): SettingsDraft {
  return {
    displayCurrency: settings.displayCurrency,
    defaultLeadDays: settings.defaultLeadDays,
    usd: String(settings.fxToNgn.USD),
    gbp: String(settings.fxToNgn.GBP),
  };
}

function parseRate(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function SettingsPage() {
  const { settings, isReady } = useAppData();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const subscriptions = useSubscriptions();
  const notificationsEnabled = useNotificationsEnabled();
  const notificationsSupported = useNotificationsSupported();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingErase, setConfirmingErase] = useState(false);

  const active = subscriptions?.filter((item) => item.status === "active") ?? [];

  async function handleExportBackup() {
    try {
      const backup = await createBackup();
      downloadTextFile(
        `undue-backup-${todayIso()}.json`,
        serializeBackup(backup),
        "application/json",
      );
      showToast("Backup downloaded", "success");
    } catch {
      showToast("Could not create a backup", "danger");
    }
  }

  async function handleImportFile(file: File) {
    try {
      const backup = parseBackup(await file.text());
      await restoreBackup(backup);
      showToast("Backup restored", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not restore that file.";
      showToast(message, "danger");
    }
  }

  function handleExportCalendar() {
    if (active.length === 0) {
      showToast("Add a subscription first to create reminders.");
      return;
    }
    downloadTextFile(calendarFilename(), buildCalendar(active), CALENDAR_MIME_TYPE);
    showToast("Calendar file downloaded", "success");
  }

  async function handleToggleNotifications(next: boolean) {
    if (!next) {
      setNotificationsEnabled(false);
      return;
    }
    if (!notificationsSupported) {
      showToast("Notifications aren't supported on this device.", "danger");
      return;
    }
    const result = await requestNotificationPermission();
    if (result === "granted") {
      setNotificationsEnabled(true);
      showToast("Daily reminders turned on", "success");
    } else {
      setNotificationsEnabled(false);
      showToast(
        "Notifications are blocked. Enable them in your browser settings.",
        "danger",
      );
    }
  }

  async function handleErase() {
    if (!confirmingErase) {
      setConfirmingErase(true);
      window.setTimeout(() => setConfirmingErase(false), 6000);
      return;
    }
    setConfirmingErase(false);
    vibrate([12, 40, 12]);
    try {
      await eraseAll();
      showToast("Everything erased", "success");
    } catch {
      showToast("Could not erase your data", "danger");
    }
  }

  function replayIntro() {
    try {
      window.localStorage.removeItem("undue-onboarded");
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new Event("undue:show-intro"));
  }

  return (
    <div className="flex flex-col gap-6 pt-2 lg:gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted">
          Your data lives in this browser only.
        </span>
        <h1 className="font-display text-[3.6rem] leading-[0.82] font-extrabold tracking-[-0.07em] text-ink sm:text-7xl">
          Settings
        </h1>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] bg-sky p-6 text-ink-fixed shadow-card sm:p-8">
        <div className="relative z-10 flex max-w-[62%] flex-col items-start gap-4 sm:max-w-[55%]">
          <span className="text-[11px] font-extrabold tracking-[0.16em] uppercase">
            Private by design
          </span>
          <h2 className="font-display text-[2.4rem] leading-[0.88] font-extrabold tracking-[-0.06em] text-balance sm:text-5xl">
            Nothing leaves this device.
          </h2>
          <p className="text-sm leading-relaxed font-medium text-ink-fixed/70">
            No account, no server. Back up when you want, move it when you want.
          </p>
          <button
            type="button"
            onClick={() => void handleExportBackup()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-fixed px-5 text-sm font-bold text-paper transition-transform duration-200 hover:gap-3 active:scale-95"
          >
            Export backup
            <ArrowRightIcon width={17} height={17} />
          </button>
        </div>
        <Mascot
          variant="happy"
          color="var(--color-paper)"
          size={150}
          className="pointer-events-none absolute -right-2 -bottom-3 hidden animate-float min-[360px]:block sm:right-8 sm:size-[180px]"
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-[2rem] bg-lavender p-5 text-ink-fixed shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-paper/45">
              <PaletteIcon width={21} height={21} />
            </span>
            <ThemeSwitch theme={theme} setTheme={setTheme} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
              Theme
            </span>
            <span className="text-xs font-semibold text-ink-fixed/60">
              {THEME_LABELS[theme]}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-[2rem] bg-yellow p-5 text-ink-fixed shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-paper/45">
              <BellIcon width={21} height={21} />
            </span>
            <Switch
              checked={notificationsEnabled && notificationsSupported}
              onChange={(next) => void handleToggleNotifications(next)}
              disabled={!notificationsSupported}
              label={<span className="sr-only">Daily nudge</span>}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
              Daily nudge
            </span>
            <span className="text-xs font-semibold text-ink-fixed/60">
              When a window closes
            </span>
          </div>
        </section>

        <button
          type="button"
          onClick={handleExportCalendar}
          className="group flex flex-col gap-5 rounded-[2rem] bg-lime p-5 text-left text-ink-fixed shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] sm:p-6"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-paper/45">
            <CalendarIcon width={21} height={21} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
              Calendar
            </span>
            <span className="text-xs font-semibold text-ink-fixed/60">
              Export as .ics
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col gap-5 rounded-[2rem] bg-paper p-5 text-left text-ink-fixed shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] sm:p-6"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-lime">
            <UploadIcon width={21} height={21} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
              Import
            </span>
            <span className="text-xs font-semibold text-ink-fixed/60">
              Restore a backup
            </span>
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImportFile(file);
          }
          event.target.value = "";
        }}
      />

      {isReady ? (
        <PreferencesCard key={settings.updatedAt} settings={settings} />
      ) : null}

      <section className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold tracking-[0.13em] text-coral uppercase">
              On device
            </span>
            <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
              Your data
            </h2>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-safe-soft text-safe">
            <ShieldIcon width={19} height={19} />
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Undue has no backend. Your subscriptions never leave this device, and there is
          nothing for us to sell, leak, or lose.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => void handleExportBackup()}
            leadingIcon={<DownloadIcon width={17} height={17} />}
            className="flex-1"
          >
            Export backup
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            leadingIcon={<UploadIcon width={17} height={17} />}
            className="flex-1"
          >
            Import backup
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={replayIntro}
          leadingIcon={<SparkleIcon width={17} height={17} />}
          className="self-start text-muted"
        >
          Show the intro again
        </Button>
      </section>

      <button
        type="button"
        onClick={() => void handleErase()}
        className={cn(
          "mx-auto inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors",
          confirmingErase
            ? "bg-urgent text-paper dark:bg-[#ff8a7c] dark:text-ink-fixed"
            : "text-urgent hover:bg-urgent-soft",
        )}
      >
        <TrashIcon width={17} height={17} />
        {confirmingErase ? "Tap again to erase everything" : "Erase everything"}
      </button>

      <p className="pb-2 text-center text-xs text-muted">
        Undue is not affiliated with the services it tracks.
      </p>
    </div>
  );
}

function ThemeSwitch({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-paper/50 p-1">
      {THEMES.map((option) => {
        const Icon = THEME_ICONS[option];
        const active = theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-label={THEME_LABELS[option]}
            aria-pressed={active}
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-all duration-200",
              active
                ? "bg-ink-fixed text-paper shadow-sm"
                : "text-ink-fixed/50 hover:text-ink-fixed",
            )}
          >
            <Icon width={16} height={16} />
          </button>
        );
      })}
    </div>
  );
}

function PreferencesCard({ settings }: { settings: AppSettings }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await updateSettings({
        displayCurrency: draft.displayCurrency,
        defaultLeadDays: Math.min(60, Math.max(0, Math.trunc(draft.defaultLeadDays))),
        fxToNgn: {
          ...settings.fxToNgn,
          USD: parseRate(draft.usd, settings.fxToNgn.USD),
          GBP: parseRate(draft.gbp, settings.fxToNgn.GBP),
        },
      });
      showToast("Preferences saved", "success");
    } catch {
      showToast("Could not save settings", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center justify-between gap-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface-soft text-ink">
            <SettingsIcon width={20} height={20} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
              Preferences
            </span>
            <span className="text-xs font-semibold text-muted">
              {settings.displayCurrency} · {settings.defaultLeadDays} day reminder
            </span>
          </span>
        </span>
        <ChevronDownIcon
          width={19}
          height={19}
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="flex animate-rise-in flex-col gap-4 border-t border-line pt-4">
          <Field
            label="Display currency"
            htmlFor="settings-currency"
            hint="Totals are converted to this currency."
          >
            <SelectInput
              id="settings-currency"
              value={draft.displayCurrency}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  displayCurrency: event.target.value as CurrencyCode,
                }))
              }
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label="Default reminder window"
            htmlFor="settings-lead"
            hint="Days before a charge to flag it for cancellation."
          >
            <TextInput
              id="settings-lead"
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={draft.defaultLeadDays}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  defaultLeadDays: Number.parseInt(event.target.value, 10) || 0,
                }))
              }
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="1 USD → ₦" htmlFor="settings-usd">
              <TextInput
                id="settings-usd"
                inputMode="decimal"
                value={draft.usd}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, usd: event.target.value }))
                }
              />
            </Field>
            <Field label="1 GBP → ₦" htmlFor="settings-gbp">
              <TextInput
                id="settings-gbp"
                inputMode="decimal"
                value={draft.gbp}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, gbp: event.target.value }))
                }
              />
            </Field>
          </div>

          <Button onClick={() => void handleSave()} disabled={busy} block>
            Save preferences
          </Button>
        </div>
      ) : null}
    </section>
  );
}
