"use client";

import { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { TextArea } from "@/components/ui/field";
import { MoneyText } from "@/components/ui/money-text";
import { UploadIcon, CheckIcon } from "@/components/ui/icons";
import { createSubscriptions } from "@/lib/db/subscriptions";
import { useSubscriptions } from "@/lib/db/hooks";
import { formatDate } from "@/lib/domain/format";
import { detectRecurringCharges, type BankCsvDetection } from "@/lib/import/bank-csv";
import { cn } from "@/lib/utils/cn";

interface BankCsvSheetProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const SAMPLE = `date,description,debit,credit
2025-01-05,POS NETFLIX.COM card,4400.00,
2025-02-05,POS NETFLIX.COM card,4400.00,
2025-03-05,POS NETFLIX.COM card,4400.00,
2025-01-11,POS SPOTIFY AB,2900.00,
2025-02-11,POS SPOTIFY AB,2900.00,
2025-03-11,POS SPOTIFY AB,2900.00,`;

const CONFIDENCE_LABEL = {
  high: "High confidence",
  medium: "Worth reviewing",
  low: "Unlikely",
} as const;

export function BankCsvSheet({ open, onClose, onAdded }: BankCsvSheetProps) {
  const { showToast } = useToast();
  const subscriptions = useSubscriptions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  // All detected plans are selected by default; tapping removes or restores one.
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(new Set());

  const result = useMemo<BankCsvDetection | null>(() => {
    if (!text.trim()) {
      return null;
    }
    return detectRecurringCharges(text, { existing: subscriptions ?? [] });
  }, [text, subscriptions]);

  const entries = useMemo(
    () => (result?.entries ?? []).filter((entry) => !entry.alreadyTracked),
    [result],
  );
  const alreadyTracked = (result?.entries ?? []).filter(
    (entry) => entry.alreadyTracked,
  ).length;
  const selected = useMemo(
    () => entries.filter((entry) => !deselected.has(entry.key)),
    [entries, deselected],
  );

  async function handleFile(file: File) {
    try {
      setText(await file.text());
      setDeselected(new Set());
    } catch {
      showToast("Could not read that file", "danger");
    }
  }

  function toggle(key: string) {
    setDeselected((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleAdd() {
    if (selected.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await createSubscriptions(
        selected.map((entry) => ({
          name: entry.name,
          serviceId: entry.serviceId,
          category: entry.category,
          amount: entry.amount,
          currency: entry.currency,
          cycle: entry.cycle,
          nextRenewal: entry.nextRenewal,
          billingDay: entry.billingDay,
          leadDays: entry.leadDays,
          isTrial: false,
          trialEndsAt: null,
          paidVia: "card",
          chargeStatus: "unknown",
          decision: null,
          myShare: null,
          cancelUrl: entry.cancelUrl,
          notes: entry.notes,
        })),
      );
      showToast(
        `${selected.length} recurring ${selected.length === 1 ? "charge" : "charges"} added`,
        "success",
      );
      setText("");
      setDeselected(new Set());
      onAdded?.();
      onClose();
    } catch {
      showToast("Could not add those entries", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Detect recurring charges"
      description="Paste or upload a bank statement CSV. Everything stays on this device."
      size="lg"
      footerPadded
      footer={
        <div className="flex flex-col gap-2">
          <Button
            block
            size="lg"
            disabled={busy || selected.length === 0}
            onClick={() => void handleAdd()}
          >
            {busy
              ? "Adding…"
              : selected.length > 0
                ? `Add ${selected.length} recurring ${selected.length === 1 ? "charge" : "charges"}`
                : "Add your selected patterns"}
          </Button>
          <p className="text-center text-[11px] font-medium text-muted">
            Amounts, dates and merchant names are used only to spot a pattern. No data is
            sent anywhere.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
            event.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leadingIcon={<UploadIcon width={16} height={16} />}
            onClick={() => fileRef.current?.click()}
          >
            Upload CSV
          </Button>
          <button
            type="button"
            onClick={() => {
              setText(SAMPLE);
              setDeselected(new Set());
            }}
            className="text-xs font-bold text-muted underline decoration-muted/30 underline-offset-2"
          >
            Try a sample statement
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-muted uppercase">
            Statement CSV
          </span>
          <TextArea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDeselected(new Set());
            }}
            placeholder="date,description,debit,credit&#10;2026-01-05,POS NETFLIX.COM,4400.00,"
            rows={6}
            className="min-h-40 font-mono text-xs leading-relaxed"
          />
        </label>

        {result ? (
          <p className="text-xs font-semibold text-muted">
            {result.transactions} transactions scanned · {result.entries.length} recurring{" "}
            {result.entries.length === 1 ? "pattern" : "patterns"}
            {alreadyTracked > 0 ? ` · ${alreadyTracked} already tracked` : ""}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <div
            className="flex flex-col gap-2"
            role="group"
            aria-label="Detected recurring charges"
          >
            {entries.map((entry) => {
              const isSelected = !deselected.has(entry.key);
              return (
                <button
                  key={entry.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(entry.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                    isSelected ? "bg-surface-soft" : "bg-surface opacity-60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-ink bg-ink text-bone"
                        : "border-line bg-transparent text-transparent",
                    )}
                  >
                    <CheckIcon width={13} height={13} strokeWidth={2.4} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">
                        {entry.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-line/40 px-2 py-0.5 text-[11px] font-bold text-muted">
                        {CONFIDENCE_LABEL[entry.confidence]}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-muted">
                      Next {formatDate(entry.nextRenewal)} · every{" "}
                      {entry.cycle.interval === 1
                        ? entry.cycle.unit
                        : `${entry.cycle.interval} ${entry.cycle.unit}s`}{" "}
                      · {entry.occurrences} matches
                    </span>
                  </span>
                  <MoneyText
                    amount={entry.amount}
                    currency={entry.currency}
                    className="shrink-0 text-sm font-bold"
                  />
                </button>
              );
            })}
          </div>
        ) : result ? (
          <p className="rounded-2xl bg-surface-soft p-4 text-center text-sm text-muted">
            No recurring patterns found. A statement needs at least two charges with a
            steady cadence (weekly, monthly, quarterly or yearly).
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
