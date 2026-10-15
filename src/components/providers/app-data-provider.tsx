"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/client";
import { ensureSettings } from "@/lib/db/settings";
import { DEFAULT_FX_TO_NGN } from "@/lib/domain/currency";
import type { AppSettings } from "@/lib/domain/schema";

const FALLBACK_SETTINGS: AppSettings = {
  id: "app",
  displayCurrency: "NGN",
  fxToNgn: { ...DEFAULT_FX_TO_NGN },
  defaultLeadDays: 2,
  updatedAt: "",
};

interface AppDataValue {
  settings: AppSettings;
  isReady: boolean;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const settings = useLiveQuery(() => db.settings.get("app"), []);

  useEffect(() => {
    let active = true;
    ensureSettings()
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({ settings: settings ?? FALLBACK_SETTINGS, isReady }),
    [settings, isReady],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
