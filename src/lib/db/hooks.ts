"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./client";
import { DEFAULT_FX_TO_NGN } from "@/lib/domain/currency";
import type { AppSettings, Subscription } from "@/lib/domain/schema";

const FALLBACK_SETTINGS: AppSettings = {
  id: "app",
  displayCurrency: "NGN",
  fxToNgn: { ...DEFAULT_FX_TO_NGN },
  defaultLeadDays: 2,
  notificationTime: "08:00",
  lastBackupAt: null,
  ratesUpdatedAt: null,
  updatedAt: "",
};

export function useSubscriptions(): Subscription[] | undefined {
  return useLiveQuery(() => db.subscriptions.toArray(), []);
}

export function useSubscription(id: string): Subscription | undefined {
  return useLiveQuery(() => db.subscriptions.get(id), [id]);
}

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get("app"), []);
  return settings ?? FALLBACK_SETTINGS;
}
