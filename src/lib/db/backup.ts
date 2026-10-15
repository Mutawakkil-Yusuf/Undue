import { z } from "zod";
import { db } from "./client";
import { createDefaultSettings } from "./settings";
import { settingsSchema, subscriptionSchema } from "@/lib/domain/schema";
import { nowIso } from "@/lib/utils/time";

export const BACKUP_VERSION = 1;

export const backupSchema = z.object({
  app: z.literal("undue"),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().min(1),
  settings: settingsSchema,
  subscriptions: z.array(subscriptionSchema),
});
export type Backup = z.infer<typeof backupSchema>;

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

export function parseBackup(raw: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    throw new Error("That file is not a valid Undue backup.");
  }
  return result.data;
}

export async function restoreBackup(backup: Backup): Promise<void> {
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
