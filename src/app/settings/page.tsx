"use client";

import { useRef, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { DownloadIcon, ShieldIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { updateSettings } from "@/lib/db/settings";
import {
  createBackup,
  eraseAll,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from "@/lib/db/backup";
import { CURRENCY_CODES, type AppSettings, type CurrencyCode } from "@/lib/domain/schema";
import { todayIso } from "@/lib/domain/date";

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

function DataCard() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const backup = await createBackup();
      const blob = new Blob([serializeBackup(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `undue-backup-${todayIso()}.json`;
      link.click();
      URL.revokeObjectURL(url);
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
    if (
      !window.confirm(
        "Delete every subscription and reset your settings? This cannot be undone.",
      )
    ) {
      return;
    }
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
          Erase everything
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
