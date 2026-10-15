"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { Switch } from "@/components/ui/switch";
import { searchCatalog } from "@/lib/catalog";
import type { CatalogEntry } from "@/lib/catalog/schema";
import { addDays, civilDate, formatIsoDate, todayIso } from "@/lib/domain/date";
import {
  CURRENCY_CODES,
  CYCLE_UNITS,
  CATEGORIES,
  getCategory,
  type CategoryId,
  type CurrencyCode,
  type CycleUnit,
  type Subscription,
} from "@/lib/domain/schema";
import type { SubscriptionInput } from "@/lib/db/subscriptions";
import { cn } from "@/lib/utils/cn";

const CYCLE_UNIT_LABELS: Record<CycleUnit, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

const CYCLE_UNIT_OPTIONS = CYCLE_UNITS.map((unit) => ({
  value: unit,
  label: CYCLE_UNIT_LABELS[unit],
}));

function defaultRenewalDate(): string {
  return formatIsoDate(addDays(civilDate(), 30));
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

interface SubscriptionFormProps {
  formId: string;
  initial: Subscription | null;
  defaultCurrency: CurrencyCode;
  defaultLeadDays: number;
  onSubmit: (input: SubscriptionInput) => void;
}

export function SubscriptionForm({
  formId,
  initial,
  defaultCurrency,
  defaultLeadDays,
  onSubmit,
}: SubscriptionFormProps) {
  const [query, setQuery] = useState("");
  const [catalogEntry, setCatalogEntry] = useState<CatalogEntry | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<CategoryId>(initial?.category ?? "other");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    initial?.currency ?? defaultCurrency,
  );
  const [cycleUnit, setCycleUnit] = useState<CycleUnit>(initial?.cycle.unit ?? "month");
  const [cycleInterval, setCycleInterval] = useState(initial?.cycle.interval ?? 1);
  const [nextRenewal, setNextRenewal] = useState(
    initial?.nextRenewal ?? defaultRenewalDate(),
  );
  const [leadDays, setLeadDays] = useState(initial?.leadDays ?? defaultLeadDays);
  const [isTrial, setIsTrial] = useState(initial?.isTrial ?? false);
  const [cancelUrl, setCancelUrl] = useState(initial?.cancelUrl ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  const results = useMemo(() => {
    if (query.trim().length === 0) {
      return [];
    }
    return searchCatalog(query, 6);
  }, [query]);

  function applyCatalogEntry(entry: CatalogEntry) {
    setCatalogEntry(entry);
    setName(entry.name);
    setCategory(entry.category);
    setCycleUnit(entry.defaultCycle.unit);
    setCycleInterval(entry.defaultCycle.interval);
    setLeadDays(entry.defaultLeadDays);
    setCancelUrl(entry.cancelUrl);
    setQuery("");
  }

  const emoji = catalogEntry?.emoji ?? getCategory(category).emoji;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: { name?: string; amount?: string } = {};
    if (name.trim().length === 0) {
      nextErrors.name = "Give this subscription a name.";
    }
    const parsedAmount = parseAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      nextErrors.amount = "Enter a valid amount.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      serviceId: catalogEntry?.id ?? initial?.serviceId ?? null,
      emoji,
      category,
      amount: parsedAmount,
      currency,
      cycle: { unit: cycleUnit, interval: Math.max(1, Math.trunc(cycleInterval)) },
      nextRenewal,
      leadDays: Math.max(0, Math.trunc(leadDays)),
      isTrial,
      cancelUrl,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    });
  }

  const today = todayIso();

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-card border border-line bg-bone/60 p-3">
        <ServiceAvatar emoji={emoji} size="lg" />
        <div className="flex flex-col">
          <span className="font-display text-lg text-ink">
            {name.trim().length > 0 ? name : "New subscription"}
          </span>
          <span className="text-xs text-muted">{getCategory(category).label}</span>
        </div>
      </div>

      <Field
        label="Find a service"
        htmlFor="subscription-search"
        hint="Optional. Pick a service to fill in the details automatically."
      >
        <div className="relative">
          <SearchIcon
            width={18}
            height={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <TextInput
            id="subscription-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Netflix, DStv, MTN…"
            autoComplete="off"
            className="pl-10"
          />
        </div>
      </Field>

      {results.length > 0 ? (
        <ul className="-mt-2 flex flex-col overflow-hidden rounded-field border border-line bg-surface">
          {results.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => applyCatalogEntry(entry)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-bone"
              >
                <ServiceAvatar emoji={entry.emoji} size="sm" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-ink">{entry.name}</span>
                  <span className="text-xs text-muted">
                    {getCategory(entry.category).label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Field label="Name" htmlFor="subscription-name" error={errors.name}>
        <TextInput
          id="subscription-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Netflix"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" htmlFor="subscription-amount" error={errors.amount}>
          <TextInput
            id="subscription-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
        <Field label="Currency" htmlFor="subscription-currency">
          <SelectInput
            id="subscription-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Repeat every" htmlFor="subscription-interval">
          <TextInput
            id="subscription-interval"
            type="number"
            min={1}
            max={60}
            value={cycleInterval}
            onChange={(event) =>
              setCycleInterval(Number.parseInt(event.target.value, 10) || 1)
            }
          />
        </Field>
        <Field label="Unit" htmlFor="subscription-unit">
          <SegmentedControl
            ariaLabel="Billing cycle unit"
            options={CYCLE_UNIT_OPTIONS}
            value={cycleUnit}
            onChange={setCycleUnit}
          />
        </Field>
      </div>

      <Field
        label="Next charge"
        htmlFor="subscription-renewal"
        hint="The date the service will next bill you."
      >
        <TextInput
          id="subscription-renewal"
          type="date"
          min={today}
          value={nextRenewal}
          onChange={(event) => setNextRenewal(event.target.value)}
        />
      </Field>

      <Field
        label="Cancel by (days before)"
        htmlFor="subscription-lead"
        hint="How many days before the charge you need to act."
      >
        <TextInput
          id="subscription-lead"
          type="number"
          min={0}
          max={60}
          value={leadDays}
          onChange={(event) => setLeadDays(Number.parseInt(event.target.value, 10) || 0)}
        />
      </Field>

      <Field label="Category" htmlFor="subscription-category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setCategory(option.id);
                setCatalogEntry(null);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === option.id
                  ? "border-ember bg-ember-soft text-ember-strong"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </Field>

      <Switch
        checked={isTrial}
        onChange={setIsTrial}
        label="Free trial"
        description="Remind me before this converts to a paid plan."
      />

      {cancelUrl ? (
        <p className="text-xs text-muted">
          We saved a cancellation link for this service. It appears on the detail screen.
        </p>
      ) : null}

      <Field label="Notes" htmlFor="subscription-notes">
        <TextArea
          id="subscription-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything worth remembering"
        />
      </Field>
    </form>
  );
}
