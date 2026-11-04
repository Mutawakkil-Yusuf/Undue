"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { useAppData } from "@/components/providers/app-data-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImportBackupSheet } from "@/components/settings/import-backup-sheet";
import { PreferencesCard } from "@/components/settings/preferences-card";
import {
  ArrowRightIcon,
  AutoIcon,
  BellIcon,
  CalendarIcon,
  DownloadIcon,
  MoonIcon,
  PaletteIcon,
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
  previewBackup,
  restoreBackup,
  serializeBackup,
  type Backup,
  type BackupPreview,
  type ImportMode,
} from "@/lib/db/backup";
import { useSubscriptions } from "@/lib/db/hooks";
import { todayIso } from "@/lib/domain/date";
import { buildCalendar, CALENDAR_MIME_TYPE, calendarFilename } from "@/lib/domain/ics";
import {
  useNotificationsEnabled,
  useNotificationsSupported,
} from "@/lib/hooks/use-notifications";
import { requestNotificationPermission } from "@/lib/notifications/notifications";
import { THEMES, THEME_LABELS, type Theme } from "@/lib/theme/theme";
import { clearAppStorage } from "@/lib/storage/clear";
import { setNotificationsEnabled } from "@/lib/notifications/notifications";
import { downloadTextFile } from "@/lib/utils/download";
import { vibrate } from "@/lib/utils/haptics";
import { cn } from "@/lib/utils/cn";

const THEME_ICONS: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: AutoIcon,
};

export default function SettingsPage() {
  const { settings, isReady } = useAppData();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const subscriptions = useSubscriptions();
  const notificationsEnabled = useNotificationsEnabled();
  const notificationsSupported = useNotificationsSupported();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
  const [pendingPreview, setPendingPreview] = useState<BackupPreview | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const active = subscriptions?.filter((item) => item.status === "active") ?? [];

  async function handleExportBackup() {
    try {
      const backup = await createBackup();
      downloadTextFile(
        `undue-backup-${todayIso()}.json`,
        serializeBackup(backup),
        "application/json",
      );
      // The backup exists even when this timestamp cannot be saved; don't show a
      // false failure after a successful download.
      await updateSettings({ lastBackupAt: new Date().toISOString() }).catch(
        () => undefined,
      );
      showToast("Backup downloaded", "success");
    } catch {
      showToast("Could not create a backup", "danger");
    }
  }

  async function handleImportFile(file: File) {
    try {
      const backup = parseBackup(await file.text());
      const preview = await previewBackup(backup);
      setPendingBackup(backup);
      setPendingPreview(preview);
      setImportOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not restore that file.";
      showToast(message, "danger");
    }
  }

  async function handleConfirmImport(mode: ImportMode) {
    if (!pendingBackup) {
      return;
    }
    try {
      await restoreBackup(pendingBackup, mode);
      await updateSettings({ lastBackupAt: new Date().toISOString() });
      setImportOpen(false);
      setPendingBackup(null);
      setPendingPreview(null);
      showToast(mode === "merge" ? "Backup merged" : "Backup restored", "success");
    } catch {
      showToast("Could not restore that backup", "danger");
    }
  }

  function handleExportCalendar() {
    if (subscriptions === undefined) {
      showToast("Still loading your subscriptions.");
      return;
    }
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
      clearAppStorage();
      setNotificationsEnabled(false);
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
        <h1 className="font-display text-[clamp(2.9rem,14vw,3.6rem)] leading-[0.82] font-extrabold tracking-[-0.07em] text-ink sm:text-7xl">
          Settings
        </h1>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] bg-sky p-6 text-ink-fixed shadow-card sm:p-8">
        <div className="relative z-10 flex max-w-full flex-col items-start gap-4 min-[360px]:max-w-[62%] sm:max-w-[55%]">
          <span className="text-[11px] font-extrabold tracking-[0.16em] uppercase">
            Private by design
          </span>
          <h2 className="font-display text-[clamp(2.05rem,9vw,2.4rem)] leading-[0.88] font-extrabold tracking-[-0.06em] text-balance sm:text-5xl">
            Nothing leaves this device.
          </h2>
          <p className="text-sm leading-relaxed font-medium text-ink-fixed/70">
            No account, no server. Back up when you want, move it when you want.
          </p>
          <p className="text-[11px] font-semibold text-ink-fixed/60">
            {settings.lastBackupAt
              ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleDateString()}`
              : "No backup yet — export one today."}
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

      <Link
        href="/find"
        className="group relative flex flex-col gap-5 overflow-hidden rounded-[2rem] bg-ink p-5 text-left text-bone shadow-card transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] sm:p-6"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-lime text-ink-fixed">
          <SparkleIcon width={20} height={20} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
            Find my subscriptions
          </span>
          <span className="text-xs font-semibold text-bone/55">
            Play Store, Apple, Gmail and card statements — with quick-add.
          </span>
        </span>
        <ArrowRightIcon
          width={22}
          height={22}
          className="absolute right-5 bottom-5 transition-transform duration-200 group-hover:translate-x-1 sm:right-6 sm:bottom-6"
        />
      </Link>

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
              At your chosen time · calendar export works when closed
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

      {isReady ? <PreferencesCard settings={settings} /> : null}

      <ImportBackupSheet
        open={importOpen}
        backup={pendingBackup}
        preview={pendingPreview}
        onClose={() => {
          setImportOpen(false);
          setPendingBackup(null);
          setPendingPreview(null);
        }}
        onImport={handleConfirmImport}
      />

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
