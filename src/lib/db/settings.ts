import { db } from "./client";
import { DEFAULT_FX_TO_NGN } from "@/lib/domain/currency";
import { settingsSchema, type AppSettings } from "@/lib/domain/schema";
import { nowIso } from "@/lib/utils/time";

const SETTINGS_ID = "app" as const;

export function createDefaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    displayCurrency: "NGN",
    fxToNgn: { ...DEFAULT_FX_TO_NGN },
    defaultLeadDays: 2,
    updatedAt: nowIso(),
  };
}

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) {
    return existing;
  }
  const created = createDefaultSettings();
  await db.settings.put(created);
  return created;
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID);
  return existing ?? createDefaultSettings();
}

export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updatedAt">>;

export async function updateSettings(patch: SettingsPatch): Promise<void> {
  const current = await getSettings();
  const next = settingsSchema.parse({
    ...current,
    ...patch,
    fxToNgn: { ...current.fxToNgn, ...patch.fxToNgn },
    id: SETTINGS_ID,
    updatedAt: nowIso(),
  });
  await db.settings.put(next);
}
