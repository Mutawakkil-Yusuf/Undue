"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ShieldIcon } from "@/components/ui/icons";
import { createBackup, serializeBackup } from "@/lib/db/backup";
import { updateSettings } from "@/lib/db/settings";
import { useSubscriptions } from "@/lib/db/hooks";
import { todayIso } from "@/lib/domain/date";
import { downloadTextFile } from "@/lib/utils/download";

const NUDGE_AFTER_DAYS = 30;

function isDue(lastBackupAt: string | null | undefined): boolean {
  if (!lastBackupAt) {
    return true;
  }
  const then = new Date(lastBackupAt).getTime();
  if (!Number.isFinite(then)) {
    return true;
  }
  return Date.now() - then > NUDGE_AFTER_DAYS * 86_400_000;
}

export function BackupNudge() {
  const { settings } = useAppData();
  const subscriptions = useSubscriptions();
  const { showToast } = useToast();

  if (!subscriptions || subscriptions.length === 0 || !isDue(settings.lastBackupAt)) {
    return null;
  }

  async function handleBackup() {
    try {
      const backup = await createBackup();
      downloadTextFile(
        `undue-backup-${todayIso()}.json`,
        serializeBackup(backup),
        "application/json",
      );
      await updateSettings({ lastBackupAt: new Date().toISOString() });
      showToast("Backup downloaded", "success");
    } catch {
      showToast("Could not create a backup", "danger");
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-[1.5rem] border border-line bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky text-ink-fixed">
          <ShieldIcon width={17} height={17} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-bold text-ink">Keep a backup somewhere safe</span>
          <span className="text-xs leading-relaxed text-muted">
            This browser can clear local data. Export a JSON backup so your plans survive.
          </span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0 self-start sm:self-auto"
        leadingIcon={<DownloadIcon width={15} height={15} />}
        onClick={() => void handleBackup()}
      >
        Back up now
      </Button>
    </section>
  );
}
