import { db } from "./client";
import { DEFAULT_FX_TO_NGN } from "@/lib/domain/currency";
import {
  CURRENCY_CODES,
  settingsSchema,
  type AppSettings,
  type CurrencyCode,
} from "@/lib/domain/schema";
import { nowIso } from "@/lib/utils/time";

const SETTINGS_ID = "app" as const;

/** Pick the device locale currency when we support it; otherwise stay on NGN. */
export function detectDefaultCurrency(): CurrencyCode {
  try {
    const resolved = Intl.NumberFormat().resolvedOptions().currency?.toUpperCase();
    if (CURRENCY_CODES.includes(resolved as CurrencyCode)) {
      return resolved as CurrencyCode;
    }
  } catch {
    // Locale detection is optional; NGN remains a safe default.
  }
  return "NGN";
}

export function withCompleteFx(settings: AppSettings): AppSettings {
  return { ...settings, fxToNgn: { ...DEFAULT_FX_TO_NGN, ...settings.fxToNgn } };
}

export function createDefaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    displayCurrency: detectDefaultCurrency(),
    fxToNgn: { ...DEFAULT_FX_TO_NGN },
    defaultLeadDays: 2,
    notificationTime: "08:00",
    lastBackupAt: null,
    ratesUpdatedAt: null,
    updatedAt: nowIso(),
  };
}

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) {
    return withCompleteFx(existing);
  }
  const created = createDefaultSettings();
  await db.settings.put(created);
  return created;
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID);
  return existing ? withCompleteFx(existing) : createDefaultSettings();
}

export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updatedAt">>;

export function notificationTimeOf(
  settings: Pick<AppSettings, "notificationTime">,
): string {
  return settings.notificationTime ?? "08:00";
}

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
