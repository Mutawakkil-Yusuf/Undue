import { z } from "zod";
import { db } from "./client";
import { createDefaultSettings } from "./settings";
import { DEFAULT_FX_TO_NGN } from "@/lib/domain/currency";
import { settingsSchema, subscriptionSchema } from "@/lib/domain/schema";
import { nowIso } from "@/lib/utils/time";

export const BACKUP_VERSION = 2;

const backupEnvelopeSchema = z.object({
  app: z.literal("undue"),
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().min(1),
  settings: settingsSchema,
  subscriptions: z.array(subscriptionSchema),
});

export interface Backup {
  app: "undue";
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  settings: z.infer<typeof settingsSchema>;
  subscriptions: z.infer<typeof subscriptionSchema>[];
}

export type ImportMode = "replace" | "merge";

export interface BackupPreview {
  total: number;
  active: number;
  cancelled: number;
  newSubscriptions: number;
  existingSubscriptions: number;
}

export async function createBackup(): Promise<Backup> {
  const [settings, subscriptions] = await Promise.all([
    db.settings.get("app"),
    db.subscriptions.toArray(),
  ]);

  return {
    app: "undue",
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    settings: settings ?? createDefaultSettings(),
    subscriptions,
  };
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/**
 * Accept both backup v1 (the original release) and v2 (billing anchors, trial
 * dates, payment metadata). Unknown fields are stripped by the schemas and
 * missing fields receive safe defaults, so old backups remain importable.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fill newly-added currency keys before validating old backups. */
function normalizeBackupCurrencies(input: unknown): unknown {
  if (!isRecord(input) || !isRecord(input.settings)) {
    return input;
  }
  const fx = isRecord(input.settings.fxToNgn) ? input.settings.fxToNgn : {};
  return {
    ...input,
    settings: {
      ...input.settings,
      fxToNgn: { ...DEFAULT_FX_TO_NGN, ...fx },
    },
  };
}

export function parseBackup(raw: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  json = normalizeBackupCurrencies(json);
  const result = backupEnvelopeSchema.safeParse(json);
  if (!result.success) {
    throw new Error("That file is not a valid Undue backup.");
  }

  const settings = result.data.settings;
  return {
    ...result.data,
    version: BACKUP_VERSION,
    settings: {
      ...createDefaultSettings(),
      ...settings,
      fxToNgn: { ...DEFAULT_FX_TO_NGN, ...settings.fxToNgn },
    },
    subscriptions: result.data.subscriptions.map((subscription) => {
      const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(subscription.nextRenewal);
      return {
        ...subscription,
        billingDay: subscription.billingDay ?? (dayMatch ? Number(dayMatch[3]) : 1),
        trialEndsAt: subscription.isTrial
          ? (subscription.trialEndsAt ?? subscription.nextRenewal)
          : null,
        paidVia: subscription.paidVia ?? "card",
        chargeStatus: subscription.chargeStatus ?? "unknown",
        decision: subscription.decision ?? null,
        myShare: subscription.myShare ?? null,
        priceHistory: subscription.priceHistory ?? [],
      };
    }),
  };
}

export async function previewBackup(backup: Backup): Promise<BackupPreview> {
  const existingIds = new Set(
    (await db.subscriptions.toCollection().primaryKeys()).map(String),
  );
  const existingSubscriptions = backup.subscriptions.filter((subscription) =>
    existingIds.has(subscription.id),
  ).length;

  return {
    total: backup.subscriptions.length,
    active: backup.subscriptions.filter(
      (subscription) => subscription.status === "active",
    ).length,
    cancelled: backup.subscriptions.filter(
      (subscription) => subscription.status === "cancelled",
    ).length,
    newSubscriptions: backup.subscriptions.length - existingSubscriptions,
    existingSubscriptions,
  };
}

export async function restoreBackup(
  backup: Backup,
  mode: ImportMode = "replace",
): Promise<void> {
  if (mode === "merge") {
    const current = await db.settings.get("app");
    await db.transaction("rw", db.subscriptions, db.settings, async () => {
      await db.subscriptions.bulkPut(backup.subscriptions);
      if (!current) {
        await db.settings.put(backup.settings);
      }
    });
    return;
  }

  await db.transaction("rw", db.subscriptions, db.settings, async () => {
    await db.subscriptions.clear();
    await db.settings.clear();
    await db.subscriptions.bulkPut(backup.subscriptions);
    await db.settings.put(backup.settings);
  });
}

export async function eraseAll(): Promise<void> {
  await db.transaction("rw", db.subscriptions, db.settings, async () => {
    await db.subscriptions.clear();
    await db.settings.clear();
    await db.settings.put(createDefaultSettings());
  });
}
