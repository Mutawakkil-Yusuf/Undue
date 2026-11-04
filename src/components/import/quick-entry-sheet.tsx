"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { TextArea } from "@/components/ui/field";
import { MoneyText } from "@/components/ui/money-text";
import { createSubscriptions } from "@/lib/db/subscriptions";
import { formatDate } from "@/lib/domain/format";
import { parseQuickEntries } from "@/lib/import/quick-entry";
import { useToday } from "@/lib/hooks/use-today";

interface QuickEntrySheetProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const SAMPLE = `12/10/2026 DEBIT NGN 4,400.00 NETFLIX.COM card ending 4421
2026-10-14 POS PURCHASE SPOTIFY NGN 1,900.00
15 Oct 2026 WEB DEBIT DSTV NGN 12,500.00`;

export function QuickEntrySheet({ open, onClose, onAdded }: QuickEntrySheetProps) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const today = useToday();
  const entries = useMemo(
    () => (text.trim() && today ? parseQuickEntries(text, today) : []),
    [text, today],
  );

  async function handleAdd() {
    if (entries.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await createSubscriptions(
        entries.map((entry) => ({
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
          myShare: null,
          cancelUrl: entry.cancelUrl,
          notes: entry.notes,
        })),
      );
      showToast(
        `${entries.length} ${entries.length === 1 ? "plan" : "plans"} added`,
        "success",
      );
      setText("");
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
      title="Paste a bank alert"
      description="Drop in SMS alerts or a small CSV. Review what Undue found before adding."
      size="lg"
      footerPadded
      footer={
        <Button
          block
          size="lg"
          disabled={busy || entries.length === 0}
          onClick={() => void handleAdd()}
        >
          {busy
            ? "Adding…"
            : entries.length > 0
              ? `Add ${entries.length} ${entries.length === 1 ? "plan" : "plans"}`
              : "Paste an alert to continue"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-muted uppercase">
            Alerts or CSV
          </span>
          <TextArea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={SAMPLE}
            rows={7}
            className="min-h-40 font-mono text-xs leading-relaxed"
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted">
            {entries.length > 0
              ? `${entries.length} ${entries.length === 1 ? "match" : "matches"} found`
              : "No matches yet"}
          </span>
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="text-xs font-bold text-ink underline decoration-ink/30 underline-offset-2"
          >
            Try a sample
          </button>
        </div>

        {entries.length > 0 ? (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-soft px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold text-ink">
                    {entry.name}
                  </span>
                  <span className="text-[11px] font-medium text-muted">
                    {formatDate(entry.nextRenewal)} · every {entry.cycle.interval}{" "}
                    {entry.cycle.unit}
                    {entry.cycle.interval === 1 ? "" : "s"}
                  </span>
                </div>
                <MoneyText
                  amount={entry.amount}
                  currency={entry.currency}
                  className="shrink-0 text-sm font-bold"
                />
              </div>
            ))}
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-muted">
          Dates are treated as the last charge date, then rolled to the next cycle. You
          can edit anything after adding.
        </p>
      </div>
    </Sheet>
  );
}
