"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Backup, BackupPreview, ImportMode } from "@/lib/db/backup";
import { cn } from "@/lib/utils/cn";

const TONE_CLASSES = {
  lime: "bg-lime",
  sky: "bg-sky",
  lavender: "bg-lavender",
  yellow: "bg-yellow",
} as const;

interface ImportBackupSheetProps {
  open: boolean;
  backup: Backup | null;
  preview: BackupPreview | null;
  onClose: () => void;
  onImport: (mode: ImportMode) => Promise<void>;
}

export function ImportBackupSheet({
  open,
  backup,
  preview,
  onClose,
  onImport,
}: ImportBackupSheetProps) {
  const [busy, setBusy] = useState<ImportMode | null>(null);

  async function handleImport(mode: ImportMode) {
    setBusy(mode);
    try {
      await onImport(mode);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Review this backup"
      description={
        backup
          ? `Exported ${new Date(backup.exportedAt).toLocaleString()} · backup v${backup.version}`
          : undefined
      }
      size="md"
      footerPadded
      footer={
        <div className="flex flex-col gap-2.5 min-[360px]:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => void handleImport("merge")}
          >
            {busy === "merge" ? "Merging…" : "Merge"}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => void handleImport("replace")}
          >
            {busy === "replace" ? "Replacing…" : "Replace everything"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          <Count label="Subscriptions" value={preview?.total ?? 0} tone="lime" />
          <Count label="Active" value={preview?.active ?? 0} tone="sky" />
          <Count label="Cancelled" value={preview?.cancelled ?? 0} tone="lavender" />
          <Count
            label="New to this device"
            value={preview?.newSubscriptions ?? 0}
            tone="yellow"
          />
        </div>

        <div className="rounded-2xl bg-surface-soft p-4 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-ink">Merge</strong> adds new plans and updates
            matching IDs, but keeps your current settings.
          </p>
          <p className="mt-2">
            <strong className="text-ink">Replace</strong> wipes the plans on this device
            first, then restores the backup exactly.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Backups are validated before they reach your device. v1 backups are migrated
          automatically.
        </p>
      </div>
    </Sheet>
  );
}

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "lime" | "sky" | "lavender" | "yellow";
}) {
  return (
    <div className={cn("rounded-2xl p-3 text-ink-fixed", TONE_CLASSES[tone])}>
      <span className="font-display text-3xl leading-none font-extrabold tracking-[-0.05em]">
        {value}
      </span>
      <span className="mt-1 block text-[11px] font-bold tracking-wide uppercase opacity-65">
        {label}
      </span>
    </div>
  );
}
