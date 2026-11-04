"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/providers/toast-provider";
import { ChevronDownIcon, SettingsIcon } from "@/components/ui/icons";
import { updateSettings } from "@/lib/db/settings";
import { fetchLiveFxRates } from "@/lib/domain/fx";
import { CURRENCY_CODES, type AppSettings, type CurrencyCode } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

interface PreferencesDraft {
  displayCurrency: CurrencyCode;
  defaultLeadDays: number;
  notificationTime: string;
  rates: Record<CurrencyCode, string>;
}

const OTHER_CODES = CURRENCY_CODES.filter((code) => code !== "NGN");

function toDraft(settings: AppSettings): PreferencesDraft {
  return {
    displayCurrency: settings.displayCurrency,
    defaultLeadDays: settings.defaultLeadDays,
    notificationTime: settings.notificationTime ?? "08:00",
    rates: Object.fromEntries(
      CURRENCY_CODES.map((code) => [code, String(settings.fxToNgn[code] ?? 1)]),
    ) as Record<CurrencyCode, string>,
  };
}

function parseRate(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatRatesDate(value: string | null | undefined): string {
  if (!value) {
    return "Manual rates";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Manual rates";
  }
  return `Rates as of ${date.toLocaleDateString()}`;
}

export function PreferencesCard({ settings }: { settings: AppSettings }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(settings.ratesUpdatedAt ?? null);
  const [showAllRates, setShowAllRates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function handleToggleOpen() {
    if (!open) {
      // Pick up settings changed elsewhere without overwriting an open draft.
      setDraft(toDraft(settings));
      setRatesUpdatedAt(settings.ratesUpdatedAt ?? null);
    }
    setOpen((value) => !value);
  }

  async function handleSave() {
    setBusy(true);
    try {
      const rates = Object.fromEntries(
        CURRENCY_CODES.map((code) => [
          code,
          code === "NGN"
            ? 1
            : parseRate(draft.rates[code] ?? "", settings.fxToNgn[code] ?? 1),
        ]),
      ) as Record<CurrencyCode, number>;
      await updateSettings({
        displayCurrency: draft.displayCurrency,
        defaultLeadDays: Math.min(60, Math.max(0, Math.trunc(draft.defaultLeadDays))),
        notificationTime: draft.notificationTime,
        ratesUpdatedAt,
        fxToNgn: rates,
      });
      showToast("Preferences saved", "success");
    } catch {
      showToast("Could not save settings", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshRates() {
    setRefreshing(true);
    try {
      const live = await fetchLiveFxRates();
      setDraft((current) => {
        const next = { ...current.rates };
        for (const code of OTHER_CODES) {
          const rate = live.rates[code];
          if (rate !== undefined) {
            next[code] = String(rate);
          }
        }
        return { ...current, rates: next };
      });
      setRatesUpdatedAt(live.updatedAt);
      showToast("Rates refreshed. Review and save.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not refresh rates.",
        "danger",
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={open}
        className="flex items-center justify-between gap-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink">
            <SettingsIcon width={20} height={20} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
              Preferences
            </span>
            <span className="truncate text-xs font-semibold text-muted">
              {settings.displayCurrency} · {settings.defaultLeadDays} day reminder ·{" "}
              {settings.notificationTime ?? "08:00"}
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
            hint="Totals are converted to this currency using the rates below."
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

          <Field
            label="Notification time"
            htmlFor="settings-notification-time"
            hint="Local time. Notification Triggers can fire while Undue is closed on supported browsers."
          >
            <TextInput
              id="settings-notification-time"
              type="time"
              value={draft.notificationTime}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  notificationTime: event.target.value || "08:00",
                }))
              }
            />
          </Field>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-wide text-muted uppercase">
                Exchange rates
              </span>
              <span className="text-[11px] font-medium text-muted">
                {formatRatesDate(ratesUpdatedAt)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["USD", "GBP"] as const).map((code) => (
                <Field key={code} label={`1 ${code} → ₦`} htmlFor={`settings-${code}`}>
                  <TextInput
                    id={`settings-${code}`}
                    inputMode="decimal"
                    value={draft.rates[code] ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        rates: { ...prev.rates, [code]: event.target.value },
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
            {showAllRates ? (
              <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto overscroll-contain rounded-2xl bg-surface-soft p-2 sm:grid-cols-3">
                {OTHER_CODES.map((code) => (
                  <Field key={code} label={`1 ${code} → ₦`} htmlFor={`settings-${code}`}>
                    <TextInput
                      id={`settings-${code}`}
                      inputMode="decimal"
                      value={draft.rates[code] ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          rates: { ...prev.rates, [code]: event.target.value },
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                disabled={refreshing}
                onClick={() => void handleRefreshRates()}
              >
                {refreshing ? "Refreshing…" : "Refresh live rates"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-muted"
                onClick={() => setShowAllRates((value) => !value)}
              >
                {showAllRates
                  ? "Hide other rates"
                  : `Show every rate (${OTHER_CODES.length})`}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Optional. Refresh sends no subscription data — only a request for public NGN
              rates. You can always keep manual rates.
            </p>
          </div>

          <Button onClick={() => void handleSave()} disabled={busy} block>
            {busy ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
