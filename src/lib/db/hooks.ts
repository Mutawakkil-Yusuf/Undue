"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./client";
import { createDefaultSettings } from "./settings";
import type { AppSettings, Subscription } from "@/lib/domain/schema";

export function useSubscriptions(): Subscription[] | undefined {
  return useLiveQuery(() => db.subscriptions.toArray(), []);
}

export function useSubscription(id: string): Subscription | undefined {
  return useLiveQuery(() => db.subscriptions.get(id), [id]);
}

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get("app"), []);
  return settings ?? createDefaultSettings();
}
