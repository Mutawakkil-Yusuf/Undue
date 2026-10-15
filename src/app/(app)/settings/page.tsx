"use client";

import { useRef, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon,
  DownloadIcon,
  ShieldIcon,
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
import { THEMES, THEME_LABELS } from "@/lib/theme/theme";
import { downloadTextFile } from "@/lib/utils/download";
import { vibrate } from "@/lib/utils/haptics";

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

function PreferencesCard({ settings }: { settings: AppSettings }) {
  const { showToast } = useToast();
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
      showToast("Settings saved", "success");
    } catch {
      showToast("Could not save settings", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
        Preferences
      </h2>

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

      <Button onClick={handleSave} disabled={busy} block>
        Save settings
      </Button>
    </section>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options = THEMES.map((value) => ({
    value,
    label: THEME_LABELS[value],
  }));

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
          Appearance
        </h2>
        <p className="text-sm text-muted">
          Pick a light or dark theme, or follow your device.
        </p>
      </div>
      <SegmentedControl
        ariaLabel="Theme"
        options={options}
        value={theme}
        onChange={setTheme}
      />
    </section>
  );
}

function RemindersCard() {
  const { showToast } = useToast();
  const subscriptions = useSubscriptions();
  const enabled = useNotificationsEnabled();
  const supported = useNotificationsSupported();
  const active = subscriptions?.filter((item) => item.status === "active") ?? [];

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
    if (!supported) {
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

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
          Reminders
        </h2>
        <p className="text-sm text-muted">
          Add cancellation deadlines to your calendar, or get a nudge in this browser on
          the day a cancel window closes.
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={handleExportCalendar}
        block
        disabled={active.length === 0}
        leadingIcon={<CalendarIcon width={18} height={18} />}
      >
        {active.length > 0
          ? `Add ${active.length} reminder${active.length === 1 ? "" : "s"} to calendar (.ics)`
          : "Add reminders to calendar (.ics)"}
      </Button>

      <Switch
        checked={enabled && supported}
        onChange={handleToggleNotifications}
        disabled={!supported}
        label="Daily reminder notification"
        description={
          supported
            ? "Shows a notification when a subscription is due to be cancelled."
            : "Not supported on this device."
        }
      />
    </section>
  );
}

function DataCard() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingErase, setConfirmingErase] = useState(false);

  async function handleExport() {
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

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
          Your data
        </h2>
        <p className="text-sm text-muted">
          Export a backup before you clear your browser, or move your data to another
          device.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          variant="secondary"
          onClick={handleExport}
          block
          leadingIcon={<DownloadIcon width={18} height={18} />}
        >
          Export backup
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          block
          leadingIcon={<UploadIcon width={18} height={18} />}
        >
          Import backup
        </Button>
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
        <Button
          variant="danger"
          onClick={handleErase}
          block
          leadingIcon={<TrashIcon width={18} height={18} />}
        >
          {confirmingErase ? "Tap again to erase everything" : "Erase everything"}
        </Button>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { settings, isReady } = useAppData();

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl text-ink">Settings</h1>
        <p className="text-sm text-muted">
          Your data lives in this browser only. No account, no server.
        </p>
      </header>

      {isReady ? <PreferencesCard key={settings.updatedAt} settings={settings} /> : null}

      <AppearanceCard />

      <RemindersCard />

      <DataCard />

      <section className="flex items-start gap-3 rounded-card border border-line bg-surface/60 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-safe-soft text-safe">
          <ShieldIcon width={18} height={18} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Private by design</span>
          <span className="text-xs text-muted">
            Undue has no backend. Your subscriptions never leave this device and there is
            nothing for us to sell, leak, or lose.
          </span>
        </div>
      </section>
    </div>
  );
}
