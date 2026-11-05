"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Mascot } from "@/components/brand/mascot";
import { CategoryIcon, categoryColor } from "@/components/ui/category-icon";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { Switch } from "@/components/ui/switch";
import { getCatalogEntry, searchCatalog } from "@/lib/catalog";
import type { CatalogEntry } from "@/lib/catalog/schema";
import {
  addDays,
  civilDate,
  diffInDays,
  formatIsoDate,
  parseIsoDate,
  todayIso,
} from "@/lib/domain/date";
import { formatDate } from "@/lib/domain/format";
import {
  CATEGORIES,
  CHARGE_STATUSES,
  CHARGE_STATUS_LABELS,
  CURRENCY_CODES,
  CYCLE_UNITS,
  PAID_VIA,
  PAID_VIA_LABELS,
  getCategory,
  type CategoryId,
  type ChargeStatus,
  type CurrencyCode,
  type CycleUnit,
  type PaidVia,
  type Subscription,
} from "@/lib/domain/schema";
import type { SubscriptionInput } from "@/lib/db/subscriptions";
import { cn } from "@/lib/utils/cn";

const QUICK_SERVICE_IDS = ["netflix", "spotify", "dstv", "canva-pro"] as const;

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  AUD: "A$",
  ZAR: "R",
  GHS: "₵",
  KES: "KSh",
  INR: "₹",
  AED: "د.إ",
  JPY: "¥",
  CNY: "¥",
  CHF: "CHF",
  BRL: "R$",
  MXN: "MX$",
};

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

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

const REMINDER_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 0, label: "On the day" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days" },
  { value: 7, label: "1 week" },
];

function defaultRenewalDate(): string {
  return formatIsoDate(addDays(civilDate(), 30));
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function safeFormatDate(iso: string): string {
  try {
    return formatDate(iso);
  } catch {
    return "the trial end date";
  }
}

interface FormErrors {
  name?: string | undefined;
  amount?: string | undefined;
  date?: string | undefined;
}

interface SubscriptionFormProps {
  formId: string;
  initial: Subscription | null;
  seed?: CatalogEntry | null;
  defaultCurrency: CurrencyCode;
  defaultLeadDays: number;
  initialIsTrial?: boolean | undefined;
  onSubmit: (input: SubscriptionInput) => void;
}

export function SubscriptionForm({
  formId,
  initial,
  seed = null,
  defaultCurrency,
  defaultLeadDays,
  initialIsTrial = false,
  onSubmit,
}: SubscriptionFormProps) {
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogEntry, setCatalogEntry] = useState<CatalogEntry | null>(seed);
  const [name, setName] = useState(initial?.name ?? seed?.name ?? "");
  const [category, setCategory] = useState<CategoryId>(
    initial?.category ?? seed?.category ?? "other",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    initial?.currency ?? defaultCurrency,
  );
  const [cycleUnit, setCycleUnit] = useState<CycleUnit>(
    initial?.cycle.unit ?? seed?.defaultCycle.unit ?? "month",
  );
  const [cycleInterval, setCycleInterval] = useState(
    initial?.cycle.interval ?? seed?.defaultCycle.interval ?? 1,
  );
  const [nextRenewal, setNextRenewal] = useState(
    initial?.nextRenewal ?? defaultRenewalDate(),
  );
  const [billingDay, setBillingDay] = useState<number | undefined>(() => {
    if (initial?.billingDay !== undefined) {
      return initial.billingDay;
    }
    if (!initial?.nextRenewal) {
      return undefined;
    }
    try {
      return parseIsoDate(initial.nextRenewal).getUTCDate();
    } catch {
      return undefined;
    }
  });
  const [leadDays, setLeadDays] = useState(
    initial?.leadDays ?? seed?.defaultLeadDays ?? defaultLeadDays,
  );
  const [isTrial, setIsTrial] = useState(initial?.isTrial ?? initialIsTrial);
  const [trialEndsAt, setTrialEndsAt] = useState(() => {
    if (initial?.trialEndsAt) return initial.trialEndsAt;
    if (initial?.isTrial) return initial.nextRenewal;
    return initialIsTrial ? defaultRenewalDate() : "";
  });
  const [paidVia, setPaidVia] = useState<PaidVia>(initial?.paidVia ?? "card");
  const [chargeStatus, setChargeStatus] = useState<ChargeStatus>(
    initial?.chargeStatus ?? "unknown",
  );
  const [myShare, setMyShare] = useState(
    initial?.myShare !== null && initial?.myShare !== undefined
      ? String(initial.myShare)
      : "",
  );
  const [cancelUrl, setCancelUrl] = useState(
    initial?.cancelUrl ?? seed?.cancelUrl ?? null,
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [moreOpen, setMoreOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  const quickEntries = useMemo(() => {
    const entries = QUICK_SERVICE_IDS.map((id) => getCatalogEntry(id)).filter(
      (entry): entry is CatalogEntry => entry !== undefined,
    );
    if (catalogEntry && !entries.some((entry) => entry.id === catalogEntry.id)) {
      entries.unshift(catalogEntry);
    }
    return entries;
  }, [catalogEntry]);

  const results = useMemo(
    () => searchCatalog(query, pickerOpen ? 8 : 6),
    [query, pickerOpen],
  );

  const todayValue = todayIso();
  const dateOptions = useMemo(() => {
    const base = Array.from({ length: 10 }, (_, index) => addDays(civilDate(), index));
    const hasSelected = base.some((date) => formatIsoDate(date) === nextRenewal);
    if (!hasSelected) {
      try {
        base.push(parseIsoDate(nextRenewal));
      } catch {
        // Keep the ten suggested days when the stored date is malformed.
      }
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextRenewal, todayValue]);

  const effectiveRenewal = isTrial && trialEndsAt ? trialEndsAt : nextRenewal;

  const lastDayIso = useMemo(() => {
    try {
      return formatIsoDate(
        addDays(parseIsoDate(effectiveRenewal), -Math.max(0, leadDays)),
      );
    } catch {
      return null;
    }
  }, [effectiveRenewal, leadDays]);

  const lastDayDays = lastDayIso
    ? diffInDays(civilDate(), parseIsoDate(lastDayIso))
    : null;

  const reminderOptions = useMemo(() => {
    const options = REMINDER_OPTIONS.map((option) => ({ ...option }));
    if (!options.some((option) => option.value === leadDays)) {
      options.push({ value: leadDays, label: `${leadDays} days` });
    }
    return options;
  }, [leadDays]);

  const billingValue =
    cycleUnit === "year" ? "yearly" : cycleUnit === "month" ? "monthly" : null;
  const isCustomCycle = cycleUnit !== "month" && cycleUnit !== "year";

  function applyCatalogEntry(entry: CatalogEntry) {
    setCatalogEntry(entry);
    setName(entry.name);
    setCategory(entry.category);
    setCycleUnit(entry.defaultCycle.unit);
    setCycleInterval(entry.defaultCycle.interval);
    setLeadDays(entry.defaultLeadDays);
    setCancelUrl(entry.cancelUrl);
    setQuery("");
    setPickerOpen(false);
    setErrors((current) => ({ ...current, name: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (name.trim().length === 0) {
      nextErrors.name = "Give this subscription a name.";
    } else if (name.trim().length > 80) {
      nextErrors.name = "Keep the name under 80 characters.";
    }
    const parsedAmount = parseAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      nextErrors.amount = "Enter a valid amount.";
    }
    try {
      parseIsoDate(nextRenewal);
    } catch {
      nextErrors.date = "Pick the next charge date.";
    }
    if (isTrial) {
      try {
        parseIsoDate(trialEndsAt);
      } catch {
        nextErrors.date = "Pick the date this trial ends.";
      }
    }
    const parsedShare = myShare.trim() ? parseAmount(myShare) : null;
    if (parsedShare !== null && (!Number.isFinite(parsedShare) || parsedShare < 0)) {
      nextErrors.amount = "Enter a valid share amount.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name && catalogEntry) {
        setMoreOpen(true);
      }
      return;
    }

    onSubmit({
      name: name.trim(),
      serviceId: catalogEntry?.id ?? initial?.serviceId ?? null,
      category,
      amount: parsedAmount,
      currency,
      cycle: {
        unit: cycleUnit,
        interval: Math.min(60, Math.max(1, Math.trunc(cycleInterval))),
      },
      nextRenewal,
      ...(billingDay !== undefined ? { billingDay } : {}),
      leadDays: Math.min(60, Math.max(0, Math.trunc(leadDays))),
      isTrial,
      trialEndsAt: isTrial ? trialEndsAt : null,
      paidVia,
      chargeStatus,
      myShare: parsedShare,
      cancelUrl,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1">
          {quickEntries.map((entry) => {
            const selected = catalogEntry?.id === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => applyCatalogEntry(entry)}
                aria-label={entry.name}
                aria-pressed={selected}
                className={cn(
                  "flex size-16 shrink-0 flex-col items-center justify-center rounded-[1.25rem] font-display text-2xl font-extrabold text-ink-fixed ring-2 transition-all duration-200",
                  selected
                    ? "ring-ink-fixed ring-offset-2 ring-offset-lime"
                    : "ring-transparent hover:-translate-y-0.5 active:scale-95",
                )}
                style={{ background: categoryColor(entry.category) }}
              >
                {entry.name.trim().charAt(0).toUpperCase()}
                <span className="mt-0.5 max-w-[54px] truncate text-[11px] font-bold tracking-wide text-ink-fixed/60 uppercase">
                  {entry.name.split(" ")[0]}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setPickerOpen((value) => !value)}
            aria-label="Find a service"
            aria-expanded={pickerOpen}
            className={cn(
              "flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] border-2 border-dashed border-ink-fixed/45 text-ink-fixed transition-colors hover:bg-paper/25",
              pickerOpen && "bg-paper/35",
            )}
          >
            <PlusIcon width={22} height={22} />
            <span className="text-[11px] font-bold tracking-wide uppercase">Find</span>
          </button>
        </div>

        {pickerOpen ? (
          <div className="animate-rise-in rounded-[1.5rem] bg-paper p-3 text-ink-fixed shadow-sm">
            <div className="relative">
              <SearchIcon
                width={18}
                height={18}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-fixed/40"
              />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Netflix, DStv, MTN…"
                aria-label="Search services"
                className="h-11 w-full rounded-full border border-line bg-paper-soft pr-4 pl-10 text-sm font-medium text-ink-fixed placeholder:text-ink-fixed/40 focus:border-ink-fixed focus:outline-none"
              />
            </div>
            <ul className="mt-2 flex max-h-52 flex-col overflow-y-auto">
              {results.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => applyCatalogEntry(entry)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-paper-soft"
                  >
                    <ServiceAvatar category={entry.category} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-ink-fixed">
                        {entry.name}
                      </span>
                      <span className="text-[11px] text-ink-fixed/55">
                        {getCategory(entry.category).label}
                      </span>
                    </span>
                    <CheckIcon
                      width={16}
                      height={16}
                      className="text-ink-fixed/0 transition-colors group-hover:text-ink-fixed"
                    />
                  </button>
                </li>
              ))}
              {results.length === 0 ? (
                <li className="px-2 py-4 text-center text-xs text-ink-fixed/55">
                  No match. Close this and add it by hand.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {!catalogEntry ? (
        <Field
          label="Name"
          htmlFor="subscription-name-main"
          error={errors.name}
          labelClassName="text-ink-fixed/55"
          errorClassName="text-ink-fixed"
        >
          <TextInput
            id="subscription-name-main"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="What is it?"
            maxLength={80}
            tone="fixed"
            data-autofocus={!catalogEntry ? true : undefined}
          />
        </Field>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
            Price
          </span>
          <button
            type="button"
            onClick={() => {
              const index = CURRENCY_CODES.indexOf(currency);
              setCurrency(CURRENCY_CODES[(index + 1) % CURRENCY_CODES.length] ?? "NGN");
            }}
            className="rounded-full bg-paper/35 px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink-fixed uppercase"
            aria-label="Change currency"
          >
            {currency}
          </button>
        </div>
        <div className="flex flex-col gap-2 rounded-[1.5rem] bg-paper p-3.5 text-ink-fixed shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl leading-none font-extrabold tracking-[-0.04em]">
              {CURRENCY_SYMBOL[currency]}
            </span>
            <input
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setErrors((current) => ({ ...current, amount: undefined }));
              }}
              inputMode="decimal"
              placeholder="0"
              aria-label="Price"
              data-autofocus={catalogEntry ? true : undefined}
              className="min-w-0 flex-1 bg-transparent font-display text-4xl leading-none font-extrabold tracking-[-0.05em] text-ink-fixed placeholder:text-ink-fixed/25 focus:outline-none"
            />
            <div className="flex shrink-0 rounded-full bg-paper-soft p-1">
              {(["monthly", "yearly"] as const).map((option) => {
                const active = billingValue === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setCycleUnit(option === "yearly" ? "year" : "month");
                      setCycleInterval(1);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                      active
                        ? "bg-ink-fixed text-paper"
                        : "text-ink-fixed/50 hover:text-ink-fixed",
                    )}
                  >
                    {option === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                );
              })}
            </div>
          </div>
          {isCustomCycle ? (
            <span className="text-[11px] font-semibold text-ink-fixed/55">
              Custom cycle: every {cycleInterval} {cycleUnit}
              {cycleInterval === 1 ? "" : "s"}
            </span>
          ) : null}
          {errors.amount ? (
            <span className="text-xs font-semibold text-ink-fixed">{errors.amount}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
            {isTrial ? "First charge" : "Next charge"}
          </span>
          <span className="text-[11px] font-semibold text-ink-fixed/45">
            {nextRenewal === todayValue ? "Today" : formatDate(nextRenewal)}
          </span>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
          {dateOptions.map((date) => {
            const iso = formatIsoDate(date);
            const selected = iso === nextRenewal;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setNextRenewal(iso);
                  setBillingDay(date.getUTCDate());
                  setErrors((current) => ({ ...current, date: undefined }));
                }}
                aria-pressed={selected}
                className={cn(
                  "flex h-[68px] w-[56px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] transition-all duration-200",
                  selected
                    ? "bg-ink-fixed text-paper shadow-card"
                    : "bg-paper text-ink-fixed hover:-translate-y-0.5 hover:bg-paper/80",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold tracking-wide uppercase",
                    selected ? "text-paper/55" : "text-ink-fixed/50",
                  )}
                >
                  {WEEKDAY.format(date)}
                </span>
                <span className="font-display text-xl leading-none font-extrabold tracking-[-0.04em]">
                  {date.getUTCDate()}
                </span>
                {iso === todayValue ? (
                  <span className="mt-0.5 size-1 rounded-full bg-coral" />
                ) : null}
              </button>
            );
          })}
          <label className="relative flex h-[68px] w-[56px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[1.1rem] border-2 border-dashed border-ink-fixed/35 text-ink-fixed transition-colors hover:bg-paper/25">
            <CalendarIcon width={18} height={18} />
            <span className="text-[11px] font-bold tracking-wide uppercase">Pick</span>
            <input
              ref={dateInputRef}
              type="date"
              value={nextRenewal}
              onChange={(event) => {
                if (event.target.value) {
                  setNextRenewal(event.target.value);
                  try {
                    setBillingDay(parseIsoDate(event.target.value).getUTCDate());
                  } catch {
                    // Keep the previous anchor if the browser supplied a bad value.
                  }
                  setErrors((current) => ({ ...current, date: undefined }));
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={isTrial ? "Pick first charge date" : "Pick next charge date"}
            />
          </label>
        </div>
        {errors.date ? (
          <span className="text-xs font-semibold text-ink-fixed">{errors.date}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
          Remind me
        </span>
        <div className="flex flex-wrap gap-2">
          {reminderOptions.map((option) => {
            const selected = leadDays === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setLeadDays(option.value)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200",
                  selected
                    ? "bg-ink-fixed text-paper shadow-card"
                    : "bg-paper text-ink-fixed hover:-translate-y-0.5",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[1.5rem] bg-dark p-4 text-paper shadow-card">
        <Mascot
          variant={lastDayDays !== null && lastDayDays <= 2 ? "alarmed" : "calm"}
          color="var(--color-yellow)"
          size={64}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold tracking-[0.14em] text-paper/45 uppercase">
            Your last day to cancel
          </span>
          <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.05em]">
            {lastDayIso ? formatDate(lastDayIso) : "Pick a date"}
          </span>
          <span className="text-[11px] font-medium text-paper/55">
            {lastDayDays === null
              ? "We need a valid charge date."
              : lastDayDays < 0
                ? "This date has already passed."
                : lastDayDays === 0
                  ? "That's today. Cancel before the charge."
                  : `${lastDayDays} day${lastDayDays === 1 ? "" : "s"} from now.`}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMoreOpen((value) => !value)}
        aria-expanded={moreOpen}
        className="flex items-center justify-between gap-3 rounded-full px-1 py-1 text-left"
      >
        <span className="text-xs font-bold text-ink-fixed/60">
          {moreOpen ? "Hide extra details" : "More details"}
        </span>
        <ChevronDownIcon
          width={17}
          height={17}
          className={cn(
            "text-ink-fixed/50 transition-transform",
            moreOpen && "rotate-180",
          )}
        />
      </button>

      {moreOpen ? (
        <div className="flex animate-rise-in flex-col gap-4 rounded-[1.5rem] bg-paper/45 p-4">
          {catalogEntry ? (
            <Field
              label="Name"
              htmlFor="subscription-name"
              error={errors.name}
              labelClassName="text-ink-fixed/55"
              errorClassName="text-ink-fixed"
            >
              <TextInput
                id="subscription-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="e.g. Netflix"
                maxLength={80}
                tone="fixed"
              />
            </Field>
          ) : null}

          <Field label="Category" labelClassName="text-ink-fixed/55">
            <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
              {CATEGORIES.map((option) => {
                const selected = category === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setCategory(option.id);
                      setCatalogEntry(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200",
                      selected
                        ? "text-ink-fixed shadow-sm"
                        : "bg-paper text-ink-fixed/55 hover:text-ink-fixed",
                    )}
                    style={
                      selected ? { background: categoryColor(option.id) } : undefined
                    }
                  >
                    <CategoryIcon category={option.id} width={13} height={13} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Currency"
              htmlFor="subscription-currency"
              labelClassName="text-ink-fixed/55"
            >
              <SelectInput
                id="subscription-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                tone="fixed"
              >
                {CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field
              label="Repeat every"
              htmlFor="subscription-interval"
              labelClassName="text-ink-fixed/55"
            >
              <TextInput
                id="subscription-interval"
                type="number"
                min={1}
                max={60}
                value={cycleInterval}
                onChange={(event) =>
                  setCycleInterval(Number.parseInt(event.target.value, 10) || 1)
                }
                tone="fixed"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.13em] text-ink-fixed/55 uppercase">
              Cycle
            </span>
            <SegmentedControl
              ariaLabel="Billing cycle unit"
              options={CYCLE_UNIT_OPTIONS}
              value={cycleUnit}
              onChange={setCycleUnit}
              size="sm"
            />
          </div>

          <Field
            label="Notes"
            htmlFor="subscription-notes"
            labelClassName="text-ink-fixed/55"
          >
            <TextArea
              id="subscription-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth remembering"
              maxLength={1000}
              tone="fixed"
            />
          </Field>

          <Switch
            checked={isTrial}
            onChange={(checked) => {
              setIsTrial(checked);
              if (checked && !trialEndsAt) {
                setTrialEndsAt(nextRenewal);
              }
              if (checked) {
                try {
                  setBillingDay(parseIsoDate(nextRenewal).getUTCDate());
                } catch {
                  // The date field will surface the error on submit.
                }
              }
            }}
            tone="fixed"
            label="Free trial"
            description="Remind me before this converts to a paid plan."
          />

          {isTrial ? (
            <div className="flex flex-col gap-3">
              <Field
                label="Trial ends"
                htmlFor="subscription-trial-end"
                labelClassName="text-ink-fixed/55"
              >
                <TextInput
                  id="subscription-trial-end"
                  type="date"
                  value={trialEndsAt}
                  onChange={(event) => {
                    if (event.target.value) {
                      setTrialEndsAt(event.target.value);
                      setErrors((current) => ({ ...current, date: undefined }));
                    }
                  }}
                  tone="fixed"
                />
              </Field>
              <p className="rounded-xl bg-paper/45 px-3 py-2 text-[11px] font-semibold text-ink-fixed/65">
                Converts to {CURRENCY_SYMBOL[currency]}
                {amount || "0"} on {safeFormatDate(trialEndsAt)}.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Paid via"
              htmlFor="subscription-paid-via"
              labelClassName="text-ink-fixed/55"
            >
              <SelectInput
                id="subscription-paid-via"
                value={paidVia}
                onChange={(event) => setPaidVia(event.target.value as PaidVia)}
                tone="fixed"
              >
                {PAID_VIA.map((value) => (
                  <option key={value} value={value}>
                    {PAID_VIA_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field
              label="Last charge"
              htmlFor="subscription-charge-status"
              labelClassName="text-ink-fixed/55"
            >
              <SelectInput
                id="subscription-charge-status"
                value={chargeStatus}
                onChange={(event) => setChargeStatus(event.target.value as ChargeStatus)}
                tone="fixed"
              >
                {CHARGE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {CHARGE_STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Field
            label="My share (optional)"
            htmlFor="subscription-share"
            hint="For family or shared plans. Spend totals use this amount."
            labelClassName="text-ink-fixed/55"
          >
            <TextInput
              id="subscription-share"
              inputMode="decimal"
              value={myShare}
              onChange={(event) => {
                setMyShare(event.target.value);
                setErrors((current) => ({ ...current, amount: undefined }));
              }}
              placeholder={`Total ${CURRENCY_SYMBOL[currency]}${amount || "0"}`}
              tone="fixed"
            />
          </Field>

          {cancelUrl ? (
            <p className="text-[11px] font-medium text-ink-fixed/60">
              We saved a cancellation link for this service. It appears on the detail
              screen.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
